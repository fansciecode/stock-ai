import api from './api';

export const loginUser = async (credentials) => {
  try {
    const response = await api.post('/users/login', credentials);
    localStorage.setItem('token', response.data.token);
    return true;
  } catch (error) {
    console.error('Login error:', error);
    return false;
  }
};

export const registerUser = async (userData) => {
  try {
    const response = await api.post('/users/register', userData);
    return response.data;
  } catch (error) {
    console.error('Registration error:', error);
    throw error;
  }
};

// const API_URL = "/api/users";

export const getUser = async () => {
  try {
    const response = await api.get('/users/me');
    return response.data;
  } catch (error) {
    console.error('Get user error:', error);
    throw error;
  }
};

export const updateUser = async (userData) => {
  try {
    const response = await api.put('/users/update', userData);
    return response.data;
  } catch (error) {
    console.error('Update user error:', error);
    throw error;
  }
};
