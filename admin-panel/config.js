// API Configuration
export const API_BASE_URL = process.env.REACT_APP_API_BASE_URL || 'http://localhost:3000';

// Authentication
export const AUTH_TOKEN_KEY = 'auth_token';
export const REFRESH_TOKEN_KEY = 'refresh_token';

// Date Formats
export const DATE_FORMAT = 'YYYY-MM-DD';
export const DATETIME_FORMAT = 'YYYY-MM-DD HH:mm:ss';

// Pagination
export const DEFAULT_PAGE_SIZE = 10;
export const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

// Chart Colors
export const CHART_COLORS = {
    primary: '#1976d2',
    secondary: '#dc004e',
    success: '#4caf50',
    warning: '#ff9800',
    error: '#f44336',
    info: '#2196f3'
};

// Alert Types
export const ALERT_TYPES = {
    INFO: 'info',
    SUCCESS: 'success',
    WARNING: 'warning',
    ERROR: 'error'
};

// Time Ranges
export const TIME_RANGES = {
    TODAY: 'today',
    YESTERDAY: 'yesterday',
    LAST_7_DAYS: 'last_7_days',
    LAST_30_DAYS: 'last_30_days',
    THIS_MONTH: 'this_month',
    LAST_MONTH: 'last_month',
    THIS_YEAR: 'this_year',
    CUSTOM: 'custom'
};

// Export Types
export const EXPORT_TYPES = {
    CSV: 'csv',
    EXCEL: 'excel',
    PDF: 'pdf'
};

// Notification Settings
export const NOTIFICATION_TYPES = {
    SYSTEM: 'system',
    FRAUD_ALERT: 'fraud_alert',
    ORDER_UPDATE: 'order_update',
    USER_ACTIVITY: 'user_activity',
    PERFORMANCE_ALERT: 'performance_alert'
};

// Cache Duration (in minutes)
export const CACHE_DURATION = {
    SHORT: 5,
    MEDIUM: 15,
    LONG: 60
};

// Feature Flags
export const FEATURES = {
    AI_INSIGHTS: true,
    REAL_TIME_MONITORING: true,
    PREDICTIVE_ANALYTICS: true,
    CUSTOM_DASHBOARDS: true,
    AUTOMATED_REPORTS: true
};

// API Endpoints
export const ENDPOINTS = {
    AUTH: {
        LOGIN: '/auth/login',
        LOGOUT: '/auth/logout',
        REFRESH: '/auth/refresh',
        PROFILE: '/auth/profile'
    },
    ANALYTICS: {
        OVERVIEW: '/analytics/overview',
        TRENDING: '/analytics/trending',
        ENGAGEMENT: '/analytics/engagement',
        SALES: '/analytics/sales',
        FRAUD: '/analytics/fraud',
        DELIVERY: '/analytics/delivery'
    },
    MANAGEMENT: {
        USERS: '/management/users',
        EVENTS: '/management/events',
        ORDERS: '/management/orders',
        ROLES: '/management/roles'
    },
    SETTINGS: {
        GENERAL: '/settings/general',
        SECURITY: '/settings/security',
        NOTIFICATIONS: '/settings/notifications',
        INTEGRATIONS: '/settings/integrations'
    }
};

// Error Messages
export const ERROR_MESSAGES = {
    NETWORK_ERROR: 'Network error occurred. Please check your connection.',
    UNAUTHORIZED: 'You are not authorized to perform this action.',
    SESSION_EXPIRED: 'Your session has expired. Please log in again.',
    INVALID_REQUEST: 'Invalid request. Please try again.',
    SERVER_ERROR: 'Server error occurred. Please try again later.'
};

// Validation Rules
export const VALIDATION = {
    PASSWORD_MIN_LENGTH: 8,
    PASSWORD_PATTERN: /^(?=.*[A-Za-z])(?=.*\d)[A-Za-z\d]{8,}$/,
    EMAIL_PATTERN: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
    PHONE_PATTERN: /^\+?[\d\s-]{10,}$/
};

// File Upload
export const UPLOAD = {
    MAX_FILE_SIZE: 5 * 1024 * 1024, // 5MB
    ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    MAX_FILES: 5
};

// Dashboard Layout
export const DASHBOARD_LAYOUT = {
    BREAKPOINTS: {
        xs: 0,
        sm: 600,
        md: 960,
        lg: 1280,
        xl: 1920
    },
    GRID_SPACING: 3,
    CARD_HEIGHT: 400
};

// Theme Settings
export const THEME = {
    DARK_MODE: 'dark',
    LIGHT_MODE: 'light',
    PRIMARY_COLOR: '#1976d2',
    SECONDARY_COLOR: '#dc004e'
}; 