import api from './api';

const authService = {
  login: async (credentials) => {
    try {
      const response = await api.post('/auth/login', credentials);
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      throw new Error('No token received');
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },

  register: async (userData) => {
    try {
      const response = await api.post('/auth/register', userData);
      return response.data;
    } catch (error) {
      console.error('Registration error:', error);
      throw error;
    }
  },

  logout: () => {
    localStorage.removeItem('token');
    window.location.href = '/login';
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      console.error('Reset password error:', error);
      throw error;
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      console.error('Forgot password error:', error);
      throw error;
    }
  },

  verifyToken: async (token) => {
    try {
      const response = await api.post('/auth/verify-token', { token });
      return response.data;
    } catch (error) {
      console.error('Token verification error:', error);
      throw error;
    }
  },

  refreshToken: async () => {
    try {
      const response = await api.post('/auth/refresh-token');
      if (response.data.token) {
        localStorage.setItem('token', response.data.token);
        return response.data;
      }
      throw new Error('No token received');
    } catch (error) {
      console.error('Token refresh error:', error);
      throw error;
    }
  }
};

export default authService;
