import axios from 'axios';
import { API_BASE_URL } from '../config';

const api = axios.create({
    baseURL: `${API_BASE_URL}/api/admin/analytics`,
    headers: {
        'Content-Type': 'application/json'
    }
});

// Add request interceptor to include auth token
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('auth_token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => Promise.reject(error)
);

export const analytics = {
    // Dashboard Overview
    getDashboardOverview: () => api.get('/overview'),
    
    // Trending Items
    getTrendingItems: (params) => api.get('/trending', { params }),
    
    // User Engagement
    getUserEngagement: (params) => api.get('/engagement', { params }),
    
    // Sales Metrics
    getSalesMetrics: (params) => api.get('/sales', { params }),
    
    // Fraud Alerts
    getFraudAlerts: (params) => api.get('/fraud-alerts', { params }),
    
    // Delivery Metrics
    getDeliveryMetrics: (params) => api.get('/delivery', { params }),
    
    // Predictive Analytics
    getPredictiveDemand: (params) => api.get('/predictive', { params }),
    
    // Export Reports
    exportReport: (type, params) => api.get(`/export/${type}`, {
        params,
        responseType: 'blob'
    }),
    
    // Custom Date Range Analytics
    getCustomRangeData: (startDate, endDate, metrics) => api.post('/custom-range', {
        startDate,
        endDate,
        metrics
    }),
    
    // Real-time Monitoring
    getRealTimeMetrics: () => api.get('/real-time'),
    
    // Fraud Detection
    submitFraudInvestigation: (alertId, data) => api.post(`/fraud-alerts/${alertId}/investigate`, data),
    updateFraudAlert: (alertId, status) => api.patch(`/fraud-alerts/${alertId}`, { status }),
    
    // Performance Metrics
    getPerformanceMetrics: (params) => api.get('/performance', { params }),
    
    // AI Insights
    getAIInsights: (params) => api.get('/ai-insights', { params }),
    
    // Notifications
    getNotificationStats: () => api.get('/notifications/stats'),
    
    // System Health
    getSystemHealth: () => api.get('/system/health'),
    
    // Error Tracking
    getErrorLogs: (params) => api.get('/errors', { params }),
    
    // User Activity
    getUserActivity: (params) => api.get('/user-activity', { params }),
    
    // Event Analytics
    getEventAnalytics: (eventId) => api.get(`/events/${eventId}/analytics`),
    getEventComparison: (eventIds) => api.post('/events/compare', { eventIds }),
    
    // Revenue Analytics
    getRevenueBreakdown: (params) => api.get('/revenue/breakdown', { params }),
    getRefundAnalytics: (params) => api.get('/revenue/refunds', { params }),
    
    // Geographic Analytics
    getGeographicData: (params) => api.get('/geographic', { params }),
    
    // Platform Usage
    getPlatformUsage: (params) => api.get('/platform/usage', { params }),
    
    // Custom Metrics
    createCustomMetric: (data) => api.post('/custom-metrics', data),
    getCustomMetrics: () => api.get('/custom-metrics'),
    
    // Dashboards
    saveDashboardLayout: (data) => api.post('/dashboards/layout', data),
    getDashboardLayout: () => api.get('/dashboards/layout'),
    
    // Reports
    scheduleReport: (data) => api.post('/reports/schedule', data),
    getScheduledReports: () => api.get('/reports/scheduled'),
    
    // Alerts
    configureAlerts: (data) => api.post('/alerts/configure', data),
    getAlertConfigurations: () => api.get('/alerts/configurations'),
    
    // Data Export
    exportData: (params) => api.get('/export', {
        params,
        responseType: 'blob'
    })
};

export default analytics; 