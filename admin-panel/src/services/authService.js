import jwtDecode from 'jwt-decode';
import axiosInstance from './api';

class AuthService {
    constructor() {
        try {
            this.token = localStorage.getItem('adminToken');
            this.user = this.token ? jwtDecode(this.token) : null;
        } catch (error) {
            console.error('Error initializing auth service:', error);
            this.token = null;
            this.user = null;
        }
    }

    async login(email, password) {
        try {
            const response = await axiosInstance.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            if (token) {
                localStorage.setItem('adminToken', token);
                this.token = token;
                this.user = user || (token ? jwtDecode(token) : null);
            }
            
            return this.user;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async register(userData) {
        try {
            const response = await axiosInstance.post('/auth/register', userData);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async forgotPassword(email) {
        try {
            await axiosInstance.post('/auth/forgot-password', { email });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password reset request failed');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await axiosInstance.post(`/auth/reset-password/${token}`, { password: newPassword });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password reset failed');
        }
    }

    async verifyResetToken(token) {
        try {
            const response = await axiosInstance.get(`/auth/verify-reset-token/${token}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Invalid or expired token');
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            await axiosInstance.post('/users/change-password', { oldPassword, newPassword });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password change failed');
        }
    }

    logout() {
        try {
            axiosInstance.post('/auth/logout').catch(err => console.log('Logout API error:', err));
        } catch (error) {
            console.error('Logout error:', error);
        } finally {
            localStorage.removeItem('adminToken');
            this.token = null;
            this.user = null;
            window.location.href = '/login';
        }
    }

    isAuthenticated() {
        return !!this.token && !this.isTokenExpired();
    }

    isTokenExpired() {
        if (!this.token) return true;
        try {
            const decoded = jwtDecode(this.token);
            return decoded.exp < Date.now() / 1000;
        } catch (error) {
            return true;
        }
    }

    hasPermission(permission) {
        if (!this.user || !this.user.permissions) return false;
        return this.user.permissions.includes(permission);
    }

    hasRole(role) {
        if (!this.user || !this.user.roles) return false;
        return this.user.roles.includes(role);
    }

    getUser() {
        return this.user || null;
    }

    async refreshToken() {
        try {
            const response = await axiosInstance.post('/auth/refresh-token');
            const { token } = response.data;
            
            if (token) {
                localStorage.setItem('adminToken', token);
                this.token = token;
                this.user = jwtDecode(token);
                return true;
            }
            return false;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await axiosInstance.put('/users/profile', profileData);
            if (this.user && response.data) {
                this.user = { ...this.user, ...response.data };
            }
            return this.user;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Profile update failed');
        }
    }

    async verifyEmail(token) {
        try {
            const response = await axiosInstance.get(`/auth/verify-email/${token}`);
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Email verification failed');
        }
    }
}

// Create an instance before exporting
const authServiceInstance = new AuthService();
export default authServiceInstance; 