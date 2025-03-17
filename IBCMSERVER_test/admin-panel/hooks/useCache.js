import { useState, useEffect, useCallback } from 'react';
import { CACHE_DURATION } from '../config';

// Cache storage structure
const cache = new Map();

// Cache item structure
class CacheItem {
    constructor(key, value, duration) {
        this.key = key;
        this.value = value;
        this.timestamp = Date.now();
        this.duration = duration;
    }

    isExpired() {
        return Date.now() > this.timestamp + this.duration;
    }
}

const useCache = (options = {}) => {
    const {
        prefix = '',
        defaultDuration = CACHE_DURATION.MEDIUM * 60 * 1000, // Convert minutes to milliseconds
        storage = 'memory' // 'memory' or 'local'
    } = options;

    const [cacheSize, setCacheSize] = useState(cache.size);

    // Generate cache key with prefix
    const generateKey = useCallback((key) => {
        return prefix ? `${prefix}:${key}` : key;
    }, [prefix]);

    // Set cache item
    const setItem = useCallback((key, value, duration = defaultDuration) => {
        const cacheKey = generateKey(key);
        const cacheItem = new CacheItem(cacheKey, value, duration);

        if (storage === 'local') {
            try {
                localStorage.setItem(cacheKey, JSON.stringify({
                    value,
                    timestamp: cacheItem.timestamp,
                    duration
                }));
            } catch (error) {
                console.error('Error saving to localStorage:', error);
                // Fallback to memory cache
                cache.set(cacheKey, cacheItem);
            }
        } else {
            cache.set(cacheKey, cacheItem);
        }

        setCacheSize(cache.size);
    }, [generateKey, defaultDuration, storage]);

    // Get cache item
    const getItem = useCallback((key) => {
        const cacheKey = generateKey(key);

        if (storage === 'local') {
            try {
                const stored = localStorage.getItem(cacheKey);
                if (!stored) return null;

                const { value, timestamp, duration } = JSON.parse(stored);
                if (Date.now() > timestamp + duration) {
                    localStorage.removeItem(cacheKey);
                    return null;
                }
                return value;
            } catch (error) {
                console.error('Error reading from localStorage:', error);
                // Fallback to memory cache
                const item = cache.get(cacheKey);
                return item && !item.isExpired() ? item.value : null;
            }
        } else {
            const item = cache.get(cacheKey);
            return item && !item.isExpired() ? item.value : null;
        }
    }, [generateKey, storage]);

    // Remove cache item
    const removeItem = useCallback((key) => {
        const cacheKey = generateKey(key);

        if (storage === 'local') {
            try {
                localStorage.removeItem(cacheKey);
            } catch (error) {
                console.error('Error removing from localStorage:', error);
            }
        }

        cache.delete(cacheKey);
        setCacheSize(cache.size);
    }, [generateKey, storage]);

    // Clear all cache items
    const clear = useCallback(() => {
        if (storage === 'local') {
            try {
                const keys = Object.keys(localStorage);
                keys.forEach(key => {
                    if (key.startsWith(prefix)) {
                        localStorage.removeItem(key);
                    }
                });
            } catch (error) {
                console.error('Error clearing localStorage:', error);
            }
        }

        if (prefix) {
            // Clear only items with matching prefix
            for (const key of cache.keys()) {
                if (key.startsWith(prefix)) {
                    cache.delete(key);
                }
            }
        } else {
            cache.clear();
        }

        setCacheSize(cache.size);
    }, [prefix, storage]);

    // Get all cache keys
    const getKeys = useCallback(() => {
        if (storage === 'local') {
            try {
                return Object.keys(localStorage).filter(key => key.startsWith(prefix));
            } catch (error) {
                console.error('Error getting localStorage keys:', error);
                return Array.from(cache.keys()).filter(key => key.startsWith(prefix));
            }
        }
        return Array.from(cache.keys()).filter(key => key.startsWith(prefix));
    }, [prefix, storage]);

    // Get cache size
    const getSize = useCallback(() => {
        if (storage === 'local') {
            try {
                return Object.keys(localStorage).filter(key => key.startsWith(prefix)).length;
            } catch (error) {
                console.error('Error getting localStorage size:', error);
                return Array.from(cache.keys()).filter(key => key.startsWith(prefix)).length;
            }
        }
        return Array.from(cache.keys()).filter(key => key.startsWith(prefix)).length;
    }, [prefix, storage]);

    // Cache cleanup interval
    useEffect(() => {
        const cleanup = () => {
            const now = Date.now();

            if (storage === 'local') {
                try {
                    const keys = Object.keys(localStorage);
                    keys.forEach(key => {
                        if (key.startsWith(prefix)) {
                            const stored = JSON.parse(localStorage.getItem(key));
                            if (now > stored.timestamp + stored.duration) {
                                localStorage.removeItem(key);
                            }
                        }
                    });
                } catch (error) {
                    console.error('Error during localStorage cleanup:', error);
                }
            }

            // Memory cache cleanup
            for (const [key, item] of cache.entries()) {
                if (item.isExpired()) {
                    cache.delete(key);
                }
            }

            setCacheSize(cache.size);
        };

        const intervalId = setInterval(cleanup, 60000); // Cleanup every minute
        return () => clearInterval(intervalId);
    }, [prefix, storage]);

    // Memoization helper
    const memoize = useCallback((fn, keyFn = (...args) => JSON.stringify(args)) => {
        return async (...args) => {
            const cacheKey = keyFn(...args);
            const cached = getItem(cacheKey);

            if (cached !== null) {
                return cached;
            }

            const result = await fn(...args);
            setItem(cacheKey, result);
            return result;
        };
    }, [getItem, setItem]);

    return {
        setItem,
        getItem,
        removeItem,
        clear,
        getKeys,
        getSize,
        cacheSize,
        memoize
    };
};

export default useCache; 