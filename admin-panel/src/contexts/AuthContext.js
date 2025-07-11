import React, { createContext, useState, useContext, useEffect } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    useEffect(() => {
        const initAuth = () => {
            try {
                if (authService.isAuthenticated()) {
                    const userData = authService.getUser();
                    setUser(userData);
                }
            } catch (error) {
                console.error('Auth initialization error:', error);
                setError(error.message || 'Authentication error');
            } finally {
                setLoading(false);
            }
        };

        initAuth();
    }, []);

    const login = async (email, password) => {
        try {
            setLoading(true);
            setError(null);
            const userData = await authService.login(email, password);
            if (userData) {
                setUser(userData);
            }
            return userData;
        } catch (error) {
            console.error('Login error:', error);
            setError(error.message || 'Login failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const logout = () => {
        try {
            authService.logout();
            setUser(null);
        } catch (error) {
            console.error('Logout error:', error);
            setError(error.message || 'Logout failed');
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.register(userData);
            return result;
        } catch (error) {
            console.error('Registration error:', error);
            setError(error.message || 'Registration failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const forgotPassword = async (email) => {
        try {
            setLoading(true);
            setError(null);
            await authService.forgotPassword(email);
        } catch (error) {
            console.error('Forgot password error:', error);
            setError(error.message || 'Password reset request failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const resetPassword = async (token, newPassword) => {
        try {
            setLoading(true);
            setError(null);
            await authService.resetPassword(token, newPassword);
        } catch (error) {
            console.error('Reset password error:', error);
            setError(error.message || 'Password reset failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyResetToken = async (token) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.verifyResetToken(token);
            return result;
        } catch (error) {
            console.error('Verify reset token error:', error);
            setError(error.message || 'Token verification failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const updateProfile = async (profileData) => {
        try {
            setLoading(true);
            setError(null);
            const updatedUser = await authService.updateProfile(profileData);
            if (updatedUser) {
                setUser(updatedUser);
            }
            return updatedUser;
        } catch (error) {
            console.error('Update profile error:', error);
            setError(error.message || 'Profile update failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verifyEmail = async (token) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.verifyEmail(token);
            return result;
        } catch (error) {
            console.error('Verify email error:', error);
            setError(error.message || 'Email verification failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const changePassword = async (oldPassword, newPassword) => {
        try {
            setLoading(true);
            setError(null);
            await authService.changePassword(oldPassword, newPassword);
            return true;
        } catch (error) {
            console.error('Change password error:', error);
            setError(error.message || 'Password change failed');
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission) => {
        try {
            return authService.hasPermission(permission);
        } catch (error) {
            console.error('Permission check error:', error);
            return false;
        }
    };

    const hasRole = (role) => {
        try {
            return authService.hasRole(role);
        } catch (error) {
            console.error('Role check error:', error);
            return false;
        }
    };

    const isAuthenticated = () => {
        try {
            return authService.isAuthenticated();
        } catch (error) {
            console.error('Authentication check error:', error);
            return false;
        }
    };

    const value = {
        user,
        loading,
        error,
        login,
        logout,
        register,
        forgotPassword,
        resetPassword,
        verifyResetToken,
        updateProfile,
        verifyEmail,
        changePassword,
        hasPermission,
        hasRole,
        isAuthenticated
    };

    return (
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    );
};

export const useAuth = () => {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error('useAuth must be used within an AuthProvider');
    }
    return context;
};

export default AuthContext; 