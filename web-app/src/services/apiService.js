import axios from 'axios';

// Create axios instance with base configuration
const apiClient = axios.create({
  baseURL: 'https://api.ibcm.app/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Request interceptor to add auth token
apiClient.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
apiClient.interceptors.response.use(
  (response) => {
    return response;
  },
  (error) => {
    if (error.response?.status === 401) {
      // Handle unauthorized access
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      window.location.href = '/login';
    }
    return Promise.reject(error);
  }
);

// Authentication APIs
export const authAPI = {
  login: async (credentials) => {
    const response = await apiClient.post('/auth/login', credentials);
    return response.data;
  },

  register: async (userData) => {
    const response = await apiClient.post('/auth/register', userData);
    return response.data;
  },

  logout: async () => {
    const response = await apiClient.post('/auth/logout');
    return response.data;
  },

  resetPassword: async (email) => {
    const response = await apiClient.post('/auth/reset-password', { email });
    return response.data;
  },

  verifyToken: async (token) => {
    const response = await apiClient.post('/auth/verify-token', { token });
    return response.data;
  },

  refreshToken: async () => {
    const response = await apiClient.post('/auth/refresh-token');
    return response.data;
  }
};

// User APIs
export const userAPI = {
  getProfile: async () => {
    const response = await apiClient.get('/users/profile');
    return response.data;
  },

  updateProfile: async (userData) => {
    const response = await apiClient.put('/users/profile', userData);
    return response.data;
  },

  uploadAvatar: async (formData) => {
    const response = await apiClient.post('/users/avatar', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getAllUsers: async (params = {}) => {
    const response = await apiClient.get('/users', { params });
    return response.data;
  },

  getUserById: async (userId) => {
    const response = await apiClient.get(`/users/${userId}`);
    return response.data;
  },

  deleteUser: async (userId) => {
    const response = await apiClient.delete(`/users/${userId}`);
    return response.data;
  },

  updateUserStatus: async (userId, status) => {
    const response = await apiClient.patch(`/users/${userId}/status`, { status });
    return response.data;
  }
};

// Event APIs
export const eventAPI = {
  getAllEvents: async (params = {}) => {
    const response = await apiClient.get('/events', { params });
    return response.data;
  },

  getEventById: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}`);
    return response.data;
  },

  createEvent: async (eventData) => {
    const response = await apiClient.post('/events', eventData);
    return response.data;
  },

  updateEvent: async (eventId, eventData) => {
    const response = await apiClient.put(`/events/${eventId}`, eventData);
    return response.data;
  },

  deleteEvent: async (eventId) => {
    const response = await apiClient.delete(`/events/${eventId}`);
    return response.data;
  },

  joinEvent: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/join`);
    return response.data;
  },

  leaveEvent: async (eventId) => {
    const response = await apiClient.post(`/events/${eventId}/leave`);
    return response.data;
  },

  getEventAttendees: async (eventId) => {
    const response = await apiClient.get(`/events/${eventId}/attendees`);
    return response.data;
  },

  uploadEventImage: async (eventId, formData) => {
    const response = await apiClient.post(`/events/${eventId}/image`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  getEventCategories: async () => {
    const response = await apiClient.get('/events/categories');
    return response.data;
  },

  searchEvents: async (query, filters = {}) => {
    const response = await apiClient.get('/search/events', {
      params: { q: query, ...filters }
    });
    return response.data;
  }
};

// Business APIs
export const businessAPI = {
  getAllBusinesses: async (params = {}) => {
    const response = await apiClient.get('/business', { params });
    return response.data;
  },

  getBusinessById: async (businessId) => {
    const response = await apiClient.get(`/business/${businessId}`);
    return response.data;
  },

  createBusiness: async (businessData) => {
    const response = await apiClient.post('/business', businessData);
    return response.data;
  },

  updateBusiness: async (businessId, businessData) => {
    const response = await apiClient.put(`/business/${businessId}`, businessData);
    return response.data;
  },

  deleteBusiness: async (businessId) => {
    const response = await apiClient.delete(`/business/${businessId}`);
    return response.data;
  },

  verifyBusiness: async (businessId) => {
    const response = await apiClient.post(`/business/${businessId}/verify`);
    return response.data;
  },

  getBusinessEvents: async (businessId) => {
    const response = await apiClient.get(`/business/${businessId}/events`);
    return response.data;
  },

  uploadBusinessDocuments: async (businessId, formData) => {
    const response = await apiClient.post(`/business/${businessId}/documents`, formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  }
};

// Payment APIs
export const paymentAPI = {
  createPayment: async (paymentData) => {
    const response = await apiClient.post('/payment/create', paymentData);
    return response.data;
  },

  verifyPayment: async (paymentData) => {
    const response = await apiClient.post('/payment/verify', paymentData);
    return response.data;
  },

  getPaymentHistory: async (params = {}) => {
    const response = await apiClient.get('/payment/history', { params });
    return response.data;
  },

  getPaymentStatus: async (paymentId) => {
    const response = await apiClient.get(`/payment/status/${paymentId}`);
    return response.data;
  },

  processRefund: async (paymentId, refundData) => {
    const response = await apiClient.post(`/payment/refund`, { paymentId, ...refundData });
    return response.data;
  },

  upgradeEvent: async (eventId, upgradeData) => {
    const response = await apiClient.post(`/payment/upgrade/${eventId}`, upgradeData);
    return response.data;
  },

  getUpgradePrice: async (eventId, upgradeType) => {
    const response = await apiClient.get(`/payment/upgrade-price/${eventId}`, {
      params: { upgradeType }
    });
    return response.data;
  },

  getUpgradeOptions: async (eventId) => {
    const response = await apiClient.get(`/payment/upgrade-options/${eventId}`);
    return response.data;
  },

  createSubscription: async (subscriptionData) => {
    const response = await apiClient.post('/payment/subscribe', subscriptionData);
    return response.data;
  },

  cancelSubscription: async (subscriptionId) => {
    const response = await apiClient.delete(`/payment/subscribe/${subscriptionId}`);
    return response.data;
  }
};

// Analytics APIs
export const analyticsAPI = {
  getDashboardStats: async (timeRange = '7d') => {
    const response = await apiClient.get('/analytics/dashboard', {
      params: { timeRange }
    });
    return response.data;
  },

  getUserAnalytics: async (userId, timeRange = '30d') => {
    const response = await apiClient.get(`/analytics/user/${userId}`, {
      params: { timeRange }
    });
    return response.data;
  },

  getEventAnalytics: async (eventId) => {
    const response = await apiClient.get(`/analytics/event/${eventId}`);
    return response.data;
  },

  getBusinessAnalytics: async (businessId, timeRange = '30d') => {
    const response = await apiClient.get(`/analytics/business/${businessId}`, {
      params: { timeRange }
    });
    return response.data;
  },

  getSystemMetrics: async (timeRange = '24h') => {
    const response = await apiClient.get('/analytics/system', {
      params: { timeRange }
    });
    return response.data;
  },

  getRevenueAnalytics: async (timeRange = '30d') => {
    const response = await apiClient.get('/analytics/revenue', {
      params: { timeRange }
    });
    return response.data;
  },

  getUserActivityAnalytics: async (timeRange = '7d') => {
    const response = await apiClient.get('/user-activity', {
      params: { timeRange }
    });
    return response.data;
  }
};

// Admin APIs
export const adminAPI = {
  getAdminDashboard: async (timeRange = '7d') => {
    const response = await apiClient.get('/admin-analytics/dashboard', {
      params: { timeRange }
    });
    return response.data;
  },

  getSystemHealth: async () => {
    const response = await apiClient.get('/admin-analytics/health');
    return response.data;
  },

  getAuditLogs: async (params = {}) => {
    const response = await apiClient.get('/admin-analytics/audit', { params });
    return response.data;
  },

  getSecurityAlerts: async (params = {}) => {
    const response = await apiClient.get('/admin-analytics/security', { params });
    return response.data;
  },

  performSecurityAudit: async () => {
    const response = await apiClient.post('/admin-analytics/security/audit');
    return response.data;
  },

  exportData: async (type, params = {}) => {
    const response = await apiClient.get(`/admin-analytics/export/${type}`, {
      params,
      responseType: 'blob'
    });
    return response.data;
  },

  generateReport: async (reportType, params = {}) => {
    const response = await apiClient.post('/admin-analytics/report', {
      type: reportType,
      ...params
    });
    return response.data;
  }
};

// Notification APIs
export const notificationAPI = {
  getNotifications: async (params = {}) => {
    const response = await apiClient.get('/notifications', { params });
    return response.data;
  },

  markAsRead: async (notificationId) => {
    const response = await apiClient.patch(`/notifications/${notificationId}/read`);
    return response.data;
  },

  markAllAsRead: async () => {
    const response = await apiClient.patch('/notifications/read-all');
    return response.data;
  },

  deleteNotification: async (notificationId) => {
    const response = await apiClient.delete(`/notifications/${notificationId}`);
    return response.data;
  },

  getNotificationSettings: async () => {
    const response = await apiClient.get('/notifications/settings');
    return response.data;
  },

  updateNotificationSettings: async (settings) => {
    const response = await apiClient.put('/notifications/settings', settings);
    return response.data;
  }
};

// Chat APIs
export const chatAPI = {
  getChats: async (params = {}) => {
    const response = await apiClient.get('/chats', { params });
    return response.data;
  },

  getChatById: async (chatId) => {
    const response = await apiClient.get(`/chats/${chatId}`);
    return response.data;
  },

  createChat: async (chatData) => {
    const response = await apiClient.post('/chats', chatData);
    return response.data;
  },

  sendMessage: async (chatId, messageData) => {
    const response = await apiClient.post(`/chats/${chatId}/messages`, messageData);
    return response.data;
  },

  getMessages: async (chatId, params = {}) => {
    const response = await apiClient.get(`/chats/${chatId}/messages`, { params });
    return response.data;
  },

  markMessagesAsRead: async (chatId) => {
    const response = await apiClient.patch(`/chats/${chatId}/read`);
    return response.data;
  },

  deleteMessage: async (chatId, messageId) => {
    const response = await apiClient.delete(`/chats/${chatId}/messages/${messageId}`);
    return response.data;
  }
};

// Media APIs
export const mediaAPI = {
  uploadFile: async (file, type = 'image') => {
    const formData = new FormData();
    formData.append('file', file);
    formData.append('type', type);

    const response = await apiClient.post('/media/upload', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  uploadMultipleFiles: async (files, type = 'image') => {
    const formData = new FormData();
    files.forEach(file => {
      formData.append('files', file);
    });
    formData.append('type', type);

    const response = await apiClient.post('/media/upload-multiple', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    });
    return response.data;
  },

  deleteFile: async (fileId) => {
    const response = await apiClient.delete(`/media/${fileId}`);
    return response.data;
  },

  getFileUrl: async (fileId) => {
    const response = await apiClient.get(`/media/${fileId}/url`);
    return response.data;
  },

  processImage: async (fileId, operations = {}) => {
    const response = await apiClient.post(`/media/${fileId}/process`, operations);
    return response.data;
  }
};

// Follow APIs
export const followAPI = {
  followUser: async (userId) => {
    const response = await apiClient.post(`/follow/user/${userId}`);
    return response.data;
  },

  unfollowUser: async (userId) => {
    const response = await apiClient.delete(`/follow/user/${userId}`);
    return response.data;
  },

  followBusiness: async (businessId) => {
    const response = await apiClient.post(`/follow/business/${businessId}`);
    return response.data;
  },

  unfollowBusiness: async (businessId) => {
    const response = await apiClient.delete(`/follow/business/${businessId}`);
    return response.data;
  },

  getFollowers: async (params = {}) => {
    const response = await apiClient.get('/follow/followers', { params });
    return response.data;
  },

  getFollowing: async (params = {}) => {
    const response = await apiClient.get('/follow/following', { params });
    return response.data;
  },

  getFollowStatus: async (targetId, type = 'user') => {
    const response = await apiClient.get(`/follow/status/${targetId}`, {
      params: { type }
    });
    return response.data;
  }
};

// Booking APIs
export const bookingAPI = {
  createBooking: async (bookingData) => {
    const response = await apiClient.post('/bookings', bookingData);
    return response.data;
  },

  getBookings: async (params = {}) => {
    const response = await apiClient.get('/bookings', { params });
    return response.data;
  },

  getBookingById: async (bookingId) => {
    const response = await apiClient.get(`/bookings/${bookingId}`);
    return response.data;
  },

  updateBooking: async (bookingId, bookingData) => {
    const response = await apiClient.put(`/bookings/${bookingId}`, bookingData);
    return response.data;
  },

  cancelBooking: async (bookingId) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/cancel`);
    return response.data;
  },

  confirmBooking: async (bookingId) => {
    const response = await apiClient.patch(`/bookings/${bookingId}/confirm`);
    return response.data;
  },

  getBookingHistory: async (params = {}) => {
    const response = await apiClient.get('/bookings/history', { params });
    return response.data;
  }
};

// Order APIs
export const orderAPI = {
  createOrder: async (orderData) => {
    const response = await apiClient.post('/orders', orderData);
    return response.data;
  },

  getOrders: async (params = {}) => {
    const response = await apiClient.get('/orders', { params });
    return response.data;
  },

  getOrderById: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}`);
    return response.data;
  },

  updateOrderStatus: async (orderId, status) => {
    const response = await apiClient.patch(`/orders/${orderId}/status`, { status });
    return response.data;
  },

  cancelOrder: async (orderId) => {
    const response = await apiClient.patch(`/orders/${orderId}/cancel`);
    return response.data;
  },

  trackOrder: async (orderId) => {
    const response = await apiClient.get(`/orders/${orderId}/track`);
    return response.data;
  }
};

// Search APIs
export const searchAPI = {
  globalSearch: async (query, filters = {}) => {
    const response = await apiClient.get('/search', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  searchUsers: async (query, filters = {}) => {
    const response = await apiClient.get('/search/users', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  searchEvents: async (query, filters = {}) => {
    const response = await apiClient.get('/search/events', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  searchBusinesses: async (query, filters = {}) => {
    const response = await apiClient.get('/search/businesses', {
      params: { q: query, ...filters }
    });
    return response.data;
  },

  getSearchSuggestions: async (query, type = 'all') => {
    const response = await apiClient.get('/search/suggestions', {
      params: { q: query, type }
    });
    return response.data;
  }
};

// Category APIs
export const categoryAPI = {
  getAllCategories: async () => {
    const response = await apiClient.get('/categories');
    return response.data;
  },

  getCategoryById: async (categoryId) => {
    const response = await apiClient.get(`/categories/${categoryId}`);
    return response.data;
  },

  createCategory: async (categoryData) => {
    const response = await apiClient.post('/categories', categoryData);
    return response.data;
  },

  updateCategory: async (categoryId, categoryData) => {
    const response = await apiClient.put(`/categories/${categoryId}`, categoryData);
    return response.data;
  },

  deleteCategory: async (categoryId) => {
    const response = await apiClient.delete(`/categories/${categoryId}`);
    return response.data;
  },

  getCategoryEvents: async (categoryId, params = {}) => {
    const response = await apiClient.get(`/categories/${categoryId}/events`, { params });
    return response.data;
  }
};

// Subscription APIs
export const subscriptionAPI = {
  getSubscriptions: async () => {
    const response = await apiClient.get('/subscriptions');
    return response.data;
  },

  createSubscription: async (subscriptionData) => {
    const response = await apiClient.post('/subscriptions', subscriptionData);
    return response.data;
  },

  updateSubscription: async (subscriptionId, subscriptionData) => {
    const response = await apiClient.put(`/subscriptions/${subscriptionId}`, subscriptionData);
    return response.data;
  },

  cancelSubscription: async (subscriptionId) => {
    const response = await apiClient.delete(`/subscriptions/${subscriptionId}`);
    return response.data;
  },

  getSubscriptionHistory: async (params = {}) => {
    const response = await apiClient.get('/subscriptions/history', { params });
    return response.data;
  }
};

// Growth APIs
export const growthAPI = {
  getGrowthMetrics: async (timeRange = '30d') => {
    const response = await apiClient.get('/growth/metrics', {
      params: { timeRange }
    });
    return response.data;
  },

  getCohortAnalysis: async (params = {}) => {
    const response = await apiClient.get('/growth/cohort', { params });
    return response.data;
  },

  getFunnelAnalysis: async (funnelType) => {
    const response = await apiClient.get('/growth/funnel', {
      params: { type: funnelType }
    });
    return response.data;
  },

  getRetentionAnalysis: async (timeRange = '30d') => {
    const response = await apiClient.get('/growth/retention', {
      params: { timeRange }
    });
    return response.data;
  }
};

// External APIs
export const externalAPI = {
  getExternalEvents: async (params = {}) => {
    const response = await apiClient.get('/external/events', { params });
    return response.data;
  },

  importExternalEvent: async (eventData) => {
    const response = await apiClient.post('/external/import', eventData);
    return response.data;
  },

  syncExternalData: async (source) => {
    const response = await apiClient.post('/external/sync', { source });
    return response.data;
  }
};

// Default export with all APIs
const apiService = {
  auth: authAPI,
  user: userAPI,
  event: eventAPI,
  business: businessAPI,
  payment: paymentAPI,
  analytics: analyticsAPI,
  admin: adminAPI,
  notification: notificationAPI,
  chat: chatAPI,
  media: mediaAPI,
  follow: followAPI,
  booking: bookingAPI,
  order: orderAPI,
  search: searchAPI,
  category: categoryAPI,
  subscription: subscriptionAPI,
  growth: growthAPI,
  external: externalAPI
};

export default apiService;
