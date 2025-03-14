import axios from "axios";

const api = axios.create({
  baseURL: process.env.REACT_APP_API_URL || "http://localhost:5000/api",
  headers: {
    "Content-Type": "application/json",
  },
});

// Request interceptor for API calls
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor for API calls
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        const response = await axios.post(`${api.defaults.baseURL}/auth/refresh-token`, {
          refreshToken
        });

        const { accessToken } = response.data;
        localStorage.setItem('accessToken', accessToken);

        originalRequest.headers.Authorization = `Bearer ${accessToken}`;
        return api(originalRequest);
      } catch (refreshError) {
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    return Promise.reject(error);
  }
);

// Auth endpoints
export const auth = {
  login: (credentials) => api.post('/auth/login', credentials),
  register: (userData) => api.post('/auth/register', userData),
  logout: () => api.post('/auth/logout'),
  refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken })
};

// User management endpoints
export const users = {
  getAll: (params) => api.get('/users', { params }),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  update: (id, userData) => api.put(`/users/${id}`, userData),
  delete: (id) => api.delete(`/users/${id}`),
  updateRole: (id, roleData) => api.put(`/users/${id}/role`, roleData),
  block: (id) => api.put(`/users/${id}/block`),
  unblock: (id) => api.put(`/users/${id}/unblock`)
};

// Event management endpoints
export const events = {
  getAll: (params) => api.get('/events', { params }),
  getById: (id) => api.get(`/events/${id}`),
  create: (eventData) => api.post('/events', eventData),
  update: (id, eventData) => api.put(`/events/${id}`, eventData),
  delete: (id) => api.delete(`/events/${id}`),
  approve: (id) => api.put(`/events/${id}/approve`),
  reject: (id, reason) => api.put(`/events/${id}/reject`, { reason }),
  highlight: (id) => api.put(`/events/${id}/highlight`),
  getAttendees: (id) => api.get(`/events/${id}/attendees`),
  getAnalytics: (id) => api.get(`/events/${id}/analytics`),
  getTrending: () => api.get('/events/trending'),
  getUpcoming: () => api.get('/events/upcoming')
};

// Pricing and commission endpoints
export const pricing = {
  // Commission rules
  getCommissionRules: () => api.get('/pricing/commission-rules'),
  createCommissionRule: (data) => api.post('/pricing/commission-rules', data),
  updateCommissionRule: (id, data) => api.put(`/pricing/commission-rules/${id}`, data),
  deleteCommissionRule: (id) => api.delete(`/pricing/commission-rules/${id}`),
  
  // Dynamic pricing
  getDynamicPricing: () => api.get('/pricing/dynamic'),
  updateDynamicPricing: (data) => api.put('/pricing/dynamic', data),
  
  // Event packages
  getEventPackages: () => api.get('/pricing/event-packages'),
  createEventPackage: (data) => api.post('/pricing/event-packages', data),
  updateEventPackage: (id, data) => api.put(`/pricing/event-packages/${id}`, data),
  deleteEventPackage: (id) => api.delete(`/pricing/event-packages/${id}`),
  
  // Delivery pricing
  getDeliveryPricing: () => api.get('/pricing/delivery'),
  updateDeliveryPricing: (data) => api.put('/pricing/delivery', data)
};

// Analytics endpoints
export const analytics = {
  getDashboardOverview: () => api.get('/analytics/dashboard'),
  getTrendingItems: () => api.get('/analytics/trending'),
  getUserEngagement: () => api.get('/analytics/user-engagement'),
  getSalesMetrics: () => api.get('/analytics/sales'),
  getDynamicPricingInsights: () => api.get('/analytics/pricing-insights'),
  getFraudAlerts: () => api.get('/analytics/fraud-alerts'),
  getPredictiveDemand: () => api.get('/analytics/predictive-demand'),
  getDeliveryMetrics: () => api.get('/analytics/delivery'),
  getRevenueTracking: () => api.get('/analytics/revenue'),
  getCategoryPerformance: () => api.get('/analytics/categories'),
  exportReport: (type, params) => api.get(`/analytics/export/${type}`, { 
    params,
    responseType: 'blob'
  })
};

// Order management endpoints
export const orders = {
  getAll: (params) => api.get('/orders', { params }),
  getById: (id) => api.get(`/orders/${id}`),
  update: (id, data) => api.put(`/orders/${id}`, data),
  cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
  getDeliveryStatus: (id) => api.get(`/orders/${id}/delivery`),
  updateDeliveryStatus: (id, status) => api.put(`/orders/${id}/delivery`, { status }),
  flagAsFraud: (id, reason) => api.put(`/orders/${id}/flag-fraud`, { reason }),
  getDisputes: () => api.get('/orders/disputes'),
  resolveDispute: (id, resolution) => api.put(`/orders/disputes/${id}`, { resolution })
};

// Notification endpoints
export const notifications = {
  getAll: () => api.get('/notifications'),
  send: (data) => api.post('/notifications/send', data),
  getTemplates: () => api.get('/notifications/templates'),
  createTemplate: (data) => api.post('/notifications/templates', data),
  updateTemplate: (id, data) => api.put(`/notifications/templates/${id}`, data),
  deleteTemplate: (id) => api.delete(`/notifications/templates/${id}`),
  sendPromotion: (data) => api.post('/notifications/promotions', data)
};

// Settings endpoints
export const settings = {
  getAll: () => api.get('/settings'),
  update: (data) => api.put('/settings', data),
  getCategories: () => api.get('/settings/categories'),
  updateCategories: (data) => api.put('/settings/categories', data),
  getFraudRules: () => api.get('/settings/fraud-rules'),
  updateFraudRules: (data) => api.put('/settings/fraud-rules', data),
  getDeliveryZones: () => api.get('/settings/delivery-zones'),
  updateDeliveryZones: (data) => api.put('/settings/delivery-zones', data)
};

export default api;
