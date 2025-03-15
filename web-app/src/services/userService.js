import api from './api';

const userService = {
  getCurrentUser: async () => {
    try {
      const response = await api.get('/users/me');
      return response.data;
    } catch (error) {
      console.error('Get current user error:', error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put('/users/profile', userData);
      return response.data;
    } catch (error) {
      console.error('Update profile error:', error);
      throw error;
    }
  },

  updatePassword: async (passwords) => {
    try {
      const response = await api.put('/users/password', passwords);
      return response.data;
    } catch (error) {
      console.error('Update password error:', error);
      throw error;
    }
  },

  uploadAvatar: async (formData) => {
    try {
      const response = await api.post('/users/avatar', formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Upload avatar error:', error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await api.get('/users/notifications');
      return response.data;
    } catch (error) {
      console.error('Get notifications error:', error);
      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.put(`/users/notifications/${notificationId}/read`);
      return response.data;
    } catch (error) {
      console.error('Mark notification read error:', error);
      throw error;
    }
  },

  getPreferences: async () => {
    try {
      const response = await api.get('/users/preferences');
      return response.data;
    } catch (error) {
      console.error('Get preferences error:', error);
      throw error;
    }
  },

  updatePreferences: async (preferences) => {
    try {
      const response = await api.put('/users/preferences', preferences);
      return response.data;
    } catch (error) {
      console.error('Update preferences error:', error);
      throw error;
    }
  }
};

export default userService;
