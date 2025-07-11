import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';
import { authService } from '../services/authService';

const AuthContext = createContext();

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  // Check if user is logged in on app start
  useEffect(() => {
    checkAuthStatus();
  }, []);

  const checkAuthStatus = async () => {
    try {
      const token = localStorage.getItem('token');
      const refreshToken = localStorage.getItem('refreshToken');

      if (token && refreshToken) {
        // Verify token with backend
        const response = await authService.verifyToken();
        if (response.success) {
          setUser(response.user);
          setIsAuthenticated(true);
        } else {
          // Token is invalid, clear storage
          clearAuthData();
        }
      }
    } catch (error) {
      console.error('Auth check failed:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const login = async (email, password) => {
    try {
      setLoading(true);
      const response = await authService.login(email, password);

      if (response.success) {
        // Store tokens
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);

        // Set user data
        setUser(response.user);
        setIsAuthenticated(true);

        message.success('Login successful!');
        return { success: true, user: response.user };
      } else {
        message.error(response.message || 'Login failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Login error:', error);
      message.error('Login failed. Please try again.');
      return { success: false, message: 'Login failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const signup = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.signup(userData);

      if (response.success) {
        message.success('Account created successfully!');
        return { success: true, message: 'Account created successfully!' };
      } else {
        message.error(response.message || 'Signup failed');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Signup error:', error);
      message.error('Signup failed. Please try again.');
      return { success: false, message: 'Signup failed. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const logout = async () => {
    try {
      setLoading(true);
      await authService.logout();
      clearAuthData();
      message.success('Logged out successfully!');
    } catch (error) {
      console.error('Logout error:', error);
      clearAuthData();
    } finally {
      setLoading(false);
    }
  };

  const clearAuthData = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('refreshToken');
    setUser(null);
    setIsAuthenticated(false);
  };

  const forgotPassword = async (email) => {
    try {
      setLoading(true);
      const response = await authService.forgotPassword(email);

      if (response.success) {
        message.success('Password reset email sent!');
        return { success: true, message: 'Password reset email sent!' };
      } else {
        message.error(response.message || 'Failed to send reset email');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Forgot password error:', error);
      message.error('Failed to send reset email. Please try again.');
      return { success: false, message: 'Failed to send reset email. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (token, newPassword) => {
    try {
      setLoading(true);
      const response = await authService.resetPassword(token, newPassword);

      if (response.success) {
        message.success('Password reset successfully!');
        return { success: true, message: 'Password reset successfully!' };
      } else {
        message.error(response.message || 'Failed to reset password');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Reset password error:', error);
      message.error('Failed to reset password. Please try again.');
      return { success: false, message: 'Failed to reset password. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const updateProfile = async (userData) => {
    try {
      setLoading(true);
      const response = await authService.updateProfile(userData);

      if (response.success) {
        setUser(response.user);
        message.success('Profile updated successfully!');
        return { success: true, user: response.user };
      } else {
        message.error(response.message || 'Failed to update profile');
        return { success: false, message: response.message };
      }
    } catch (error) {
      console.error('Update profile error:', error);
      message.error('Failed to update profile. Please try again.');
      return { success: false, message: 'Failed to update profile. Please try again.' };
    } finally {
      setLoading(false);
    }
  };

  const refreshToken = async () => {
    try {
      const refreshToken = localStorage.getItem('refreshToken');
      if (!refreshToken) {
        clearAuthData();
        return false;
      }

      const response = await authService.refreshToken(refreshToken);
      if (response.success) {
        localStorage.setItem('token', response.token);
        localStorage.setItem('refreshToken', response.refreshToken);
        return true;
      } else {
        clearAuthData();
        return false;
      }
    } catch (error) {
      console.error('Token refresh error:', error);
      clearAuthData();
      return false;
    }
  };

  const value = {
    user,
    loading,
    isAuthenticated,
    login,
    signup,
    logout,
    forgotPassword,
    resetPassword,
    updateProfile,
    refreshToken,
    checkAuthStatus
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};
