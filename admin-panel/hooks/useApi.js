import { useState, useCallback, useRef } from 'react';
import { ERROR_MESSAGES } from '../config';
import { extractErrorMessage } from '../utils/helpers';
import useCache from './useCache';

const useApi = (apiFunction, options = {}) => {
    const {
        initialData = null,
        onSuccess,
        onError,
        enableCache = false,
        cacheKey,
        cacheDuration,
        retryCount = 3,
        retryDelay = 1000,
        validateStatus = (status) => status >= 200 && status < 300
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const abortControllerRef = useRef(null);
    const retryTimeoutRef = useRef(null);
    const cache = enableCache ? useCache() : null;

    // Clear any existing retry timeouts
    const clearRetryTimeout = () => {
        if (retryTimeoutRef.current) {
            clearTimeout(retryTimeoutRef.current);
            retryTimeoutRef.current = null;
        }
    };

    // Abort current request
    const abort = useCallback(() => {
        if (abortControllerRef.current) {
            abortControllerRef.current.abort();
            abortControllerRef.current = null;
        }
        clearRetryTimeout();
    }, []);

    // Reset state
    const reset = useCallback(() => {
        setData(initialData);
        setLoading(false);
        setError(null);
        abort();
    }, [initialData, abort]);

    // Handle API error
    const handleError = useCallback((error, attempt = 1) => {
        const errorMessage = extractErrorMessage(error);
        
        // Check if we should retry
        if (attempt < retryCount && !error.response) {
            clearRetryTimeout();
            retryTimeoutRef.current = setTimeout(() => {
                executeRequest(attempt + 1);
            }, retryDelay * attempt);
            return;
        }

        setError(errorMessage);
        setLoading(false);

        if (onError) {
            onError(error);
        }
    }, [retryCount, retryDelay, onError]);

    // Execute API request
    const executeRequest = useCallback(async (attempt = 1, ...args) => {
        try {
            setLoading(true);
            setError(null);

            // Check cache first if enabled
            if (enableCache && cacheKey) {
                const cachedData = cache.getItem(cacheKey);
                if (cachedData) {
                    setData(cachedData);
                    setLoading(false);
                    if (onSuccess) {
                        onSuccess(cachedData);
                    }
                    return cachedData;
                }
            }

            // Create new AbortController for this request
            abortControllerRef.current = new AbortController();

            // Execute API call
            const response = await apiFunction(...args, {
                signal: abortControllerRef.current.signal
            });

            // Validate response status
            if (!validateStatus(response.status)) {
                throw new Error(ERROR_MESSAGES.INVALID_REQUEST);
            }

            // Update state with response data
            const responseData = response.data;
            setData(responseData);
            setLoading(false);

            // Cache response if enabled
            if (enableCache && cacheKey) {
                cache.setItem(cacheKey, responseData, cacheDuration);
            }

            // Call success callback
            if (onSuccess) {
                onSuccess(responseData);
            }

            return responseData;
        } catch (error) {
            // Don't handle aborted requests
            if (error.name === 'AbortError') {
                return;
            }

            handleError(error, attempt);
            return null;
        }
    }, [
        apiFunction,
        enableCache,
        cacheKey,
        cacheDuration,
        validateStatus,
        onSuccess,
        handleError,
        cache
    ]);

    // Memoized execute function
    const execute = useCallback((...args) => {
        abort(); // Abort any existing request
        return executeRequest(1, ...args);
    }, [abort, executeRequest]);

    // Cleanup on unmount
    const cleanup = useCallback(() => {
        abort();
        reset();
    }, [abort, reset]);

    return {
        data,
        loading,
        error,
        execute,
        abort,
        reset,
        cleanup
    };
};

// Utility hooks for common API patterns
export const useGet = (url, options = {}) => {
    return useApi(
        async (config) => {
            const response = await fetch(url, {
                method: 'GET',
                ...config
            });
            return {
                status: response.status,
                data: await response.json()
            };
        },
        options
    );
};

export const usePost = (url, options = {}) => {
    return useApi(
        async (data, config) => {
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                ...config
            });
            return {
                status: response.status,
                data: await response.json()
            };
        },
        options
    );
};

export const usePut = (url, options = {}) => {
    return useApi(
        async (data, config) => {
            const response = await fetch(url, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(data),
                ...config
            });
            return {
                status: response.status,
                data: await response.json()
            };
        },
        options
    );
};

export const useDelete = (url, options = {}) => {
    return useApi(
        async (config) => {
            const response = await fetch(url, {
                method: 'DELETE',
                ...config
            });
            return {
                status: response.status,
                data: await response.json()
            };
        },
        options
    );
};

export default useApi; 