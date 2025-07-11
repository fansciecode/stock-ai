import axios from 'axios';

// Using production API URL
const API_URL = 'https://api.ibcm.app/api';

const api = axios.create({
  baseURL: API_URL,
  timeout: 10000, // 10 second timeout
  headers: {
    'Content-Type': 'application/json',
  },
});

// Add request interceptor
api.interceptors.request.use(
  (config) => {
    // Removed console log for production
    const token = localStorage.getItem('token');
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

// Add response interceptor
api.interceptors.response.use(
  (response) => {
    // Removed console log for production
    return response;
  },
  (error) => {
    console.error('Response error:', error.config?.url, error.message);
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (!error.response) {
      return Promise.reject(new Error('Network error. Please check your connection.'));
    }
    return Promise.reject(error);
  }
);

export const fetchData = async (endpoint, options = {}) => {
  try {
    const response = await api(endpoint, options);
    return response.data;
  } catch (error) {
    console.error('API Error:', error);
    throw error;
  }
};

export default api;
