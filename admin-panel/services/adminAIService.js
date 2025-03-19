import api from '../utils/api';

export const adminAIService = {
    // User Behavior Analysis
    analyzeUserBehavior: async () => {
        const response = await api.get('/api/admin/ai/user-behavior');
        return response.data;
    },

    // Fraud Detection
    predictFraud: async (transactionData) => {
        const response = await api.post('/api/admin/ai/fraud-prediction', { transactionData });
        return response.data;
    },

    // Business Insights
    generateInsights: async () => {
        const response = await api.get('/api/admin/ai/insights');
        return response.data;
    },

    // Market Trends
    analyzeMarketTrends: async () => {
        const response = await api.get('/api/admin/ai/market-trends');
        return response.data;
    },

    // Price Optimization
    optimizePricing: async (eventId, marketData) => {
        const response = await api.post('/api/admin/ai/optimize-pricing', {
            eventId,
            marketData
        });
        return response.data;
    },

    // Event Success Prediction
    predictEventSuccess: async (eventData) => {
        const response = await api.post('/api/admin/ai/predict-event-success', {
            eventData
        });
        return response.data;
    },

    // Content Suggestions
    generateContentSuggestions: async (type, target, currentContent) => {
        const response = await api.post('/api/admin/ai/content-suggestions', {
            type,
            target,
            currentContent
        });
        return response.data;
    }
};

// Error handling wrapper
export const withErrorHandling = (fn) => async (...args) => {
    try {
        return await fn(...args);
    } catch (error) {
        console.error('AI Service Error:', error);
        throw new Error(error.response?.data?.message || 'An error occurred while processing your request');
    }
};

// Wrap all service methods with error handling
Object.keys(adminAIService).forEach(key => {
    const originalMethod = adminAIService[key];
    adminAIService[key] = withErrorHandling(originalMethod);
});