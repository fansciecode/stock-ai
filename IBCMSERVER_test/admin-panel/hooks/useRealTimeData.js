import { useState, useEffect, useCallback } from 'react';
import { analytics } from '../services/analytics';
import { CACHE_DURATION } from '../config';
import { debounce } from '../utils/helpers';

const useRealTimeData = (
    fetchFunction,
    interval = CACHE_DURATION.SHORT * 1000,
    options = {}
) => {
    const {
        enabled = true,
        onError,
        onSuccess,
        initialData = null,
        params = {},
        debounceWait = 1000
    } = options;

    const [data, setData] = useState(initialData);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [lastUpdated, setLastUpdated] = useState(null);

    // Create a debounced version of the fetch function
    const debouncedFetch = useCallback(
        debounce(async () => {
            try {
                setLoading(true);
                setError(null);
                
                const response = await fetchFunction(params);
                setData(response.data);
                setLastUpdated(new Date());
                
                if (onSuccess) {
                    onSuccess(response.data);
                }
            } catch (err) {
                setError(err);
                if (onError) {
                    onError(err);
                }
            } finally {
                setLoading(false);
            }
        }, debounceWait),
        [fetchFunction, params, onSuccess, onError, debounceWait]
    );

    // Function to manually trigger a refresh
    const refresh = useCallback(() => {
        if (!loading) {
            debouncedFetch();
        }
    }, [debouncedFetch, loading]);

    // Set up the interval for real-time updates
    useEffect(() => {
        if (!enabled) return;

        // Initial fetch
        debouncedFetch();

        // Set up interval for subsequent fetches
        const intervalId = setInterval(() => {
            debouncedFetch();
        }, interval);

        // Cleanup function
        return () => {
            clearInterval(intervalId);
        };
    }, [enabled, interval, debouncedFetch]);

    return {
        data,
        loading,
        error,
        lastUpdated,
        refresh
    };
};

// Example usage with specific analytics endpoints
export const useRealTimeOverview = (options = {}) => {
    return useRealTimeData(
        analytics.getDashboardOverview,
        CACHE_DURATION.SHORT * 1000,
        options
    );
};

export const useRealTimeSales = (options = {}) => {
    return useRealTimeData(
        analytics.getSalesMetrics,
        CACHE_DURATION.SHORT * 1000,
        options
    );
};

export const useRealTimeEngagement = (options = {}) => {
    return useRealTimeData(
        analytics.getUserEngagement,
        CACHE_DURATION.MEDIUM * 1000,
        options
    );
};

export const useRealTimeFraudAlerts = (options = {}) => {
    return useRealTimeData(
        analytics.getFraudAlerts,
        CACHE_DURATION.SHORT * 1000,
        {
            ...options,
            onSuccess: (data) => {
                // Check for high-priority alerts
                const highPriorityAlerts = data.filter(alert => alert.priority === 'high');
                if (highPriorityAlerts.length > 0) {
                    // Trigger notification or callback
                    if (options.onHighPriorityAlert) {
                        options.onHighPriorityAlert(highPriorityAlerts);
                    }
                }
                
                if (options.onSuccess) {
                    options.onSuccess(data);
                }
            }
        }
    );
};

export const useRealTimeDelivery = (options = {}) => {
    return useRealTimeData(
        analytics.getDeliveryMetrics,
        CACHE_DURATION.MEDIUM * 1000,
        options
    );
};

export const useRealTimePerformance = (options = {}) => {
    return useRealTimeData(
        analytics.getPerformanceMetrics,
        CACHE_DURATION.MEDIUM * 1000,
        options
    );
};

export const useRealTimeSystemHealth = (options = {}) => {
    return useRealTimeData(
        analytics.getSystemHealth,
        CACHE_DURATION.SHORT * 1000,
        {
            ...options,
            onSuccess: (data) => {
                // Check for system health issues
                const hasIssues = data.issues && data.issues.length > 0;
                if (hasIssues) {
                    // Trigger notification or callback
                    if (options.onSystemIssue) {
                        options.onSystemIssue(data.issues);
                    }
                }
                
                if (options.onSuccess) {
                    options.onSuccess(data);
                }
            }
        }
    );
};

export default useRealTimeData; 