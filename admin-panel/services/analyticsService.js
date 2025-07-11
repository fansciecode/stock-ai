import api from './api';

class AnalyticsService {
    // Event Analytics
    async getEventAnalytics(timeRange) {
        try {
            const response = await api.get('/admin-analytics/events', {
                params: { timeRange }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching event analytics:', error);
            return {
                data: [],
                insights: { summary: 'Failed to load event analytics' },
                trends: []
            };
        }
    }

    // User Analytics
    async getUserAnalytics() {
        try {
            const response = await api.get('/admin-analytics/users');
            return response.data;
        } catch (error) {
            console.error('Error fetching user analytics:', error);
            return {
                data: [],
                insights: { summary: 'Failed to load user analytics' },
                segments: {}
            };
        }
    }

    // Revenue Analytics
    async getRevenueAnalytics(timeRange) {
        try {
            const response = await api.get('/admin-analytics/revenue', {
                params: { timeRange }
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching revenue analytics:', error);
            return {
                data: [],
                insights: { summary: 'Failed to load revenue analytics' },
                forecasts: { nextMonth: 'Forecast unavailable' }
            };
        }
    }

    // Platform Health Analytics
    async getPlatformHealth() {
        try {
            const response = await api.get('/admin-analytics/platform-health');
            return response.data;
        } catch (error) {
            console.error('Error fetching platform health:', error);
            return {
                data: [],
                insights: { summary: 'Failed to load platform health data' },
                recommendations: ['System data unavailable']
            };
        }
    }

    // AI-Powered Insights
    async getAIInsights(dataType, data) {
        try {
            const response = await api.post('/admin/ai/insights', {
                dataType,
                data
            });
            return response.data;
        } catch (error) {
            console.error('Error fetching AI insights:', error);
        return {
                summary: 'AI insights unavailable',
                recommendations: []
            };
        }
    }

    // Market Trends
    async getMarketTrends() {
        try {
            const response = await api.get('/admin/ai/market-trends');
            return response.data;
        } catch (error) {
            console.error('Error fetching market trends:', error);
            return {
                trends: [],
                analysis: 'Market trend analysis unavailable'
            };
        }
    }

    // Subscription Analytics
    async getSubscriptionAnalytics() {
        try {
            const response = await api.get('/admin-analytics/subscriptions');
            return response.data;
        } catch (error) {
            console.error('Error fetching subscription analytics:', error);
            return {
                totalSubscriptions: 0,
                dailyPlans: 0,
                monthlyPlans: 0,
                yearlyPlans: 0,
                totalRevenue: 0
            };
        }
    }
}

export default new AnalyticsService();
