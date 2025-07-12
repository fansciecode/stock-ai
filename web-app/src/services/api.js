import axios from 'axios';

// Use environment variable for API URL with fallback to production
const API_URL = process.env.REACT_APP_API_URL || 'https://api.ibcm.app/api';

console.log('API_URL:', API_URL); // Debug log to check API URL

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
    // Log request for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Making request to:', config.baseURL + config.url);
    }
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
    // Log response for debugging in development
    if (process.env.NODE_ENV === 'development') {
      console.log('Response received:', response.status, response.statusText);
    }
    return response;
  },
  (error) => {
    console.error('Response error:', error.config?.url, error.message);
    
    // More detailed error logging for development
    if (process.env.NODE_ENV === 'development') {
      console.error('Full error details:', {
        message: error.message,
        code: error.code,
        config: error.config,
        response: error.response
      });
    }
    
    if (error.code === 'ECONNABORTED') {
      return Promise.reject(new Error('Request timeout. Please check your connection.'));
    }
    if (error.response?.status === 401) {
      localStorage.removeItem('token');
      window.location.href = '/login';
    }
    if (!error.response) {
      // Network error - provide more helpful message
      const message = error.code === 'ERR_NETWORK' || error.message === 'Network Error' 
        ? `Network error: Cannot connect to ${API_URL}. Please check if the backend server is running.`
        : 'Network error. Please check your connection.';
      return Promise.reject(new Error(message));
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
