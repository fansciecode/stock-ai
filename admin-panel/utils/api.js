import axios from 'axios';

const api = axios.create({
    baseURL: process.env.REACT_APP_API_URL,
    timeout: 30000,
    withCredentials: true
});

// Request interceptor
api.interceptors.request.use(
    (config) => {
        const token = localStorage.getItem('token');
        if (token) {
            config.headers.Authorization = `Bearer ${token}`;
        }
        return config;
    },
    (error) => {
        console.error('Request Error:', error);
        return Promise.reject(error);
    }
);

// Response interceptor
api.interceptors.response.use(
    (response) => response,
    (error) => {
        if (error.response) {
            // Handle specific error cases
            switch (error.response.status) {
                case 401:
                    // Unauthorized - clear token and redirect to login
                    localStorage.removeItem('token');
                    window.location.href = '/login';
                    break;
                case 403:
                    // Forbidden - user doesn't have required permissions
                    console.error('Permission denied:', error.response.data.message);
                    break;
                case 429:
                    // Rate limit exceeded
                    console.error('Rate limit exceeded:', error.response.data.message);
                    break;
                default:
                    console.error('API Error:', error.response.data);
            }

            // Return a formatted error object
            return Promise.reject({
                status: error.response.status,
                message: error.response.data.message || 'An error occurred',
                code: error.response.data.errorCode || 'UNKNOWN_ERROR',
                timestamp: new Date().toISOString()
            });
        }

        if (error.request) {
            // Network error
            console.error('Network Error:', error.request);
            return Promise.reject({
                status: 0,
                message: 'Network error. Please check your connection.',
                code: 'NETWORK_ERROR',
                timestamp: new Date().toISOString()
            });
        }

        // Something else went wrong
        console.error('Error:', error.message);
        return Promise.reject({
            status: 500,
            message: error.message || 'An unexpected error occurred',
            code: 'UNKNOWN_ERROR',
            timestamp: new Date().toISOString()
        });
    }
);

export default api;

// Utility function to handle API errors in components
export const handleApiError = (error, enqueueSnackbar) => {
    const message = error.message || 'An unexpected error occurred';
    enqueueSnackbar(message, { 
        variant: 'error',
        autoHideDuration: 5000,
        anchorOrigin: {
            vertical: 'top',
            horizontal: 'right'
        }
    });
    return message;
};

// Auth endpoints
export const auth = {
    login: (credentials) => api.post('/auth/login', credentials),
    register: (userData) => api.post('/auth/register', userData),
    logout: () => api.post('/auth/logout'),
    forgotPassword: (email) => api.post('/auth/forgot-password', { email }),
    resetPassword: (token, password) => api.post(`/auth/reset-password/${token}`, { password }),
    validateResetToken: (token) => api.get(`/auth/validate-reset-token/${token}`),
    setup2FA: () => api.post('/auth/2fa/setup'),
    verify2FA: (code) => api.post('/auth/2fa/verify', { code }),
    refreshToken: (refreshToken) => api.post('/auth/refresh-token', { refreshToken })
};

// User endpoints
export const users = {
    getAll: (params) => api.get('/users', { params }),
    getById: (id) => api.get(`/users/${id}`),
    create: (userData) => api.post('/users', userData),
    update: (id, userData) => api.put(`/users/${id}`, userData),
    delete: (id) => api.delete(`/users/${id}`),
    updateRole: (id, role) => api.put(`/users/${id}/role`, { role }),
    block: (id) => api.put(`/users/${id}/block`),
    unblock: (id) => api.put(`/users/${id}/unblock`)
};

// Event endpoints
export const events = {
    getAll: (params) => api.get('/events', { params }),
    getById: (id) => api.get(`/events/${id}`),
    create: (eventData) => api.post('/events', eventData),
    update: (id, eventData) => api.put(`/events/${id}`, eventData),
    delete: (id) => api.delete(`/events/${id}`),
    block: (id) => api.put(`/events/${id}/block`),
    unblock: (id) => api.put(`/events/${id}/unblock`),
    getAttendees: (id) => api.get(`/events/${id}/attendees`),
    getAnalytics: (id) => api.get(`/events/${id}/analytics`)
};

// Business verification endpoints
export const verification = {
    getAll: (params) => api.get('/verifications', { params }),
    getById: (id) => api.get(`/verifications/${id}`),
    approve: (id) => api.put(`/verifications/${id}/approve`),
    reject: (id, reason) => api.put(`/verifications/${id}/reject`, { reason }),
    getDocuments: (id) => api.get(`/verifications/${id}/documents`)
};

// Financial endpoints
export const financial = {
    getTransactions: (params) => api.get('/financial/transactions', { params }),
    getRevenue: (params) => api.get('/financial/revenue', { params }),
    processRefund: (transactionId, data) => api.post(`/financial/refunds/${transactionId}`, data),
    getAnalytics: (params) => api.get('/financial/analytics', { params })
};

// Order endpoints
export const orders = {
    getAll: (params) => api.get('/orders', { params }),
    getById: (id) => api.get(`/orders/${id}`),
    update: (id, orderData) => api.put(`/orders/${id}`, orderData),
    cancel: (id, reason) => api.put(`/orders/${id}/cancel`, { reason }),
    getAnalytics: (params) => api.get('/orders/analytics', { params })
};

// Reports endpoints
export const reports = {
    getOverview: (params) => api.get('/reports/overview', { params }),
    getEventMetrics: (params) => api.get('/reports/events', { params }),
    getUserMetrics: (params) => api.get('/reports/users', { params }),
    getRevenueMetrics: (params) => api.get('/reports/revenue', { params }),
    exportReport: (type, params) => api.get(`/reports/export/${type}`, { 
        params,
        responseType: 'blob'
    })
};

// Role & Permission endpoints
export const roles = {
    getAll: () => api.get('/roles'),
    getById: (id) => api.get(`/roles/${id}`),
    create: (roleData) => api.post('/roles', roleData),
    update: (id, roleData) => api.put(`/roles/${id}`, roleData),
    delete: (id) => api.delete(`/roles/${id}`),
    getPermissions: () => api.get('/permissions')
};

// Settings endpoints
export const settings = {
    getAll: () => api.get('/settings'),
    update: (settingsData) => api.put('/settings', settingsData),
    getEmailTemplates: () => api.get('/settings/email-templates'),
    updateEmailTemplate: (id, templateData) => api.put(`/settings/email-templates/${id}`, templateData),
    testEmailTemplate: (id) => api.post(`/settings/email-templates/${id}/test`)
}; 