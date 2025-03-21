import axios from 'axios';

const API_URL = process.env.REACT_APP_API_URL || 'http://localhost:5000/api';

const axiosInstance = axios.create({
  baseURL: API_URL,
  timeout: 10000, // Increased timeout to 10 seconds
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add a request interceptor
axiosInstance.interceptors.request.use(
  (config) => {
    console.log('Making request to:', config.url);
    const token = localStorage.getItem('adminToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    console.error('Request error:', error);
    return Promise.reject(error);
  }
);

// Add a response interceptor
axiosInstance.interceptors.response.use(
  (response) => {
    console.log('Response received:', response.config.url);
    return response;
  },
  (error) => {
    console.error('Response error:', error.config?.url, error.message);
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('adminToken');
      window.location.href = '/login';
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

// API endpoints with error handling
export const authAPI = {
  login: async (credentials) => {
    try {
      const response = await axiosInstance.post('/auth/login', credentials);
      return response;
    } catch (error) {
      console.error('Login error:', error);
      throw error;
    }
  },
  logout: () => axiosInstance.post('/auth/logout'),
  verifyToken: () => axiosInstance.get('/auth/verify'),
};

export const usersAPI = {
  getAll: (page = 1, limit = 10) => axiosInstance.get(`/users?page=${page}&limit=${limit}`),
  getById: (id) => axiosInstance.get(`/users/${id}`),
  update: (id, data) => axiosInstance.put(`/users/${id}`, data),
  delete: (id) => axiosInstance.delete(`/users/${id}`),
};

export const businessAPI = {
  getAll: (page = 1, limit = 10) => axiosInstance.get(`/businesses?page=${page}&limit=${limit}`),
  getById: (id) => axiosInstance.get(`/businesses/${id}`),
  update: (id, data) => axiosInstance.put(`/businesses/${id}`, data),
  verify: (id) => axiosInstance.post(`/businesses/${id}/verify`),
  reject: (id, reason) => axiosInstance.post(`/businesses/${id}/reject`, { reason }),
};

export const deliveryAPI = {
  getAll: (page = 1, limit = 10) => axiosInstance.get(`/deliveries?page=${page}&limit=${limit}`),
  getById: (id) => axiosInstance.get(`/deliveries/${id}`),
  updateStatus: (id, status) => axiosInstance.put(`/deliveries/${id}/status`, { status }),
};

export const statsAPI = {
  getDashboardStats: async () => {
    try {
      const response = await axiosInstance.get('/stats/dashboard');
      return response;
    } catch (error) {
      console.error('Dashboard stats error:', error);
      throw error;
    }
  },
};

export default axiosInstance; 