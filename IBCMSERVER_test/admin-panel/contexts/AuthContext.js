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
                    setUser(authService.getUser());
                }
            } catch (error) {
                setError(error.message);
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
            const user = await authService.login(email, password);
            setUser(user);
            return user;
        } catch (error) {
            setError(error.message);
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
            setError(error.message);
        }
    };

    const register = async (userData) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.register(userData);
            return result;
        } catch (error) {
            setError(error.message);
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
            setError(error.message);
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
            setError(error.message);
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
            setUser(updatedUser);
            return updatedUser;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const enable2FA = async () => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.enable2FA();
            return result;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const verify2FA = async (code) => {
        try {
            setLoading(true);
            setError(null);
            const result = await authService.verify2FA(code);
            return result;
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const disable2FA = async (code) => {
        try {
            setLoading(true);
            setError(null);
            await authService.disable2FA(code);
        } catch (error) {
            setError(error.message);
            throw error;
        } finally {
            setLoading(false);
        }
    };

    const hasPermission = (permission) => {
        return authService.hasPermission(permission);
    };

    const hasRole = (role) => {
        return authService.hasRole(role);
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
        updateProfile,
        enable2FA,
        verify2FA,
        disable2FA,
        hasPermission,
        hasRole
    };

    return (
        <AuthContext.Provider value={value}>
            {!loading && children}
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