import api from './api';

const dashboardService = {
  getStats: async () => {
    try {
      const response = await api.get('/dashboard/stats');
      return response.data;
    } catch (error) {
      console.error('Get dashboard stats error:', error);
      throw error;
    }
  },

  getRecentActivity: async () => {
    try {
      const response = await api.get('/dashboard/activity');
      return response.data;
    } catch (error) {
      console.error('Get recent activity error:', error);
      throw error;
    }
  },

  getDeliveryMetrics: async (period = 'week') => {
    try {
      const response = await api.get(`/dashboard/metrics/delivery?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get delivery metrics error:', error);
      throw error;
    }
  },

  getBusinessMetrics: async (period = 'week') => {
    try {
      const response = await api.get(`/dashboard/metrics/business?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get business metrics error:', error);
      throw error;
    }
  },

  getUserMetrics: async (period = 'week') => {
    try {
      const response = await api.get(`/dashboard/metrics/users?period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Get user metrics error:', error);
      throw error;
    }
  }
};

export default dashboardService; 