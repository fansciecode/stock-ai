import axios from "axios";
import jwtDecode from "jwt-decode";

const API_URL = "/api/admin/auth";

class AuthService {
    constructor() {
        this.token = localStorage.getItem('token');
        this.user = this.token ? jwtDecode(this.token) : null;
        this.axios = axios.create({
            baseURL: '/api',
            headers: {
                'Content-Type': 'application/json'
            }
        });

        // Add token to all requests
        this.axios.interceptors.request.use((config) => {
            const token = localStorage.getItem('token');
            if (token) {
                config.headers.Authorization = `Bearer ${token}`;
            }
            return config;
        });

        // Handle token expiration
        this.axios.interceptors.response.use(
            (response) => response,
            (error) => {
                if (error.response?.status === 401) {
                    this.logout();
                    window.location.href = '/login';
                }
                return Promise.reject(error);
            }
        );
    }

    async login(email, password) {
        try {
            const response = await this.axios.post('/auth/login', { email, password });
            const { token, user } = response.data;
            
            localStorage.setItem('token', token);
            this.token = token;
            this.user = user;
            
            return user;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Login failed');
        }
    }

    async register(userData) {
        try {
            const response = await this.axios.post('/auth/register', userData);
  return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Registration failed');
        }
    }

    async forgotPassword(email) {
        try {
            await this.axios.post('/auth/forgot-password', { email });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password reset request failed');
        }
    }

    async resetPassword(token, newPassword) {
        try {
            await this.axios.post('/auth/reset-password', { token, newPassword });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password reset failed');
        }
    }

    async changePassword(oldPassword, newPassword) {
        try {
            await this.axios.post('/auth/change-password', { oldPassword, newPassword });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Password change failed');
        }
    }

    logout() {
        localStorage.removeItem('token');
        this.token = null;
        this.user = null;
        window.location.href = '/login';
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
        return this.user?.permissions?.includes(permission) || false;
    }

    hasRole(role) {
        return this.user?.roles?.includes(role) || false;
    }

    getUser() {
        return this.user;
    }

    async refreshToken() {
        try {
            const response = await this.axios.post('/auth/refresh-token');
            const { token } = response.data;
            
            localStorage.setItem('token', token);
            this.token = token;
            this.user = jwtDecode(token);
            
            return true;
        } catch (error) {
            this.logout();
            return false;
        }
    }

    async updateProfile(profileData) {
        try {
            const response = await this.axios.put('/auth/profile', profileData);
            this.user = { ...this.user, ...response.data };
            return this.user;
        } catch (error) {
            throw new Error(error.response?.data?.message || 'Profile update failed');
        }
    }

    async enable2FA() {
        try {
            const response = await this.axios.post('/auth/2fa/enable');
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '2FA enablement failed');
        }
    }

    async verify2FA(code) {
        try {
            const response = await this.axios.post('/auth/2fa/verify', { code });
            return response.data;
        } catch (error) {
            throw new Error(error.response?.data?.message || '2FA verification failed');
        }
    }

    async disable2FA(code) {
        try {
            await this.axios.post('/auth/2fa/disable', { code });
            return true;
        } catch (error) {
            throw new Error(error.response?.data?.message || '2FA disablement failed');
        }
    }
}

export default new AuthService();
