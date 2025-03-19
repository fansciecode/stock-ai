import { useState, useEffect, useCallback, useContext, createContext } from 'react';
import { useWebSocket } from './useWebSocket';

// Notification types
export const NOTIFICATION_TYPES = {
    SUCCESS: 'success',
    ERROR: 'error',
    WARNING: 'warning',
    INFO: 'info'
};

// Default notification settings
const defaultSettings = {
    position: 'top-right',
    autoHideDuration: 6000,
    maxNotifications: 5,
    sound: true,
    desktop: true
};

// Create Notification Context
const NotificationContext = createContext({
    notifications: [],
    settings: defaultSettings,
    showNotification: () => {},
    clearNotification: () => {},
    clearAll: () => {},
    updateSettings: () => {}
});

// Notification Provider Component
export const NotificationProvider = ({ children }) => {
    const [notifications, setNotifications] = useState([]);
    const [settings, setSettings] = useState(() => {
        const stored = localStorage.getItem('notification_settings');
        return stored ? JSON.parse(stored) : defaultSettings;
    });

    // WebSocket connection for real-time notifications
    const { lastMessage } = useWebSocket('/ws/notifications');

    // Process incoming WebSocket messages
    useEffect(() => {
        if (lastMessage?.type === 'notification') {
            showNotification(lastMessage.data);
        }
    }, [lastMessage]);

    // Show notification
    const showNotification = useCallback(({
        title,
        message,
        type = NOTIFICATION_TYPES.INFO,
        duration = settings.autoHideDuration,
        onClick,
        data = {}
    }) => {
        const notification = {
            id: Date.now(),
            title,
            message,
            type,
            duration,
            onClick,
            data,
            timestamp: new Date()
        };

        setNotifications(prev => {
            // Remove oldest notifications if exceeding max limit
            const updated = [notification, ...prev];
            return updated.slice(0, settings.maxNotifications);
        });

        // Play sound if enabled
        if (settings.sound) {
            new Audio('/notification-sound.mp3').play().catch(() => {});
        }

        // Show desktop notification if enabled and permission granted
        if (settings.desktop && Notification.permission === 'granted') {
            new Notification(title, {
                body: message,
                icon: '/notification-icon.png'
            });
        }

        // Auto-hide notification after duration
        if (duration > 0) {
            setTimeout(() => {
                clearNotification(notification.id);
            }, duration);
        }

        return notification.id;
    }, [settings]);

    // Clear specific notification
    const clearNotification = useCallback((id) => {
        setNotifications(prev => prev.filter(n => n.id !== id));
    }, []);

    // Clear all notifications
    const clearAll = useCallback(() => {
        setNotifications([]);
    }, []);

    // Update notification settings
    const updateSettings = useCallback((updates) => {
        setSettings(prev => {
            const newSettings = { ...prev, ...updates };
            localStorage.setItem('notification_settings', JSON.stringify(newSettings));
            return newSettings;
        });

        // Request desktop notification permission if enabled
        if (updates.desktop && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, []);

    // Request desktop notification permission on mount if enabled
    useEffect(() => {
        if (settings.desktop && Notification.permission === 'default') {
            Notification.requestPermission();
        }
    }, [settings.desktop]);

    const value = {
        notifications,
        settings,
        showNotification,
        clearNotification,
        clearAll,
        updateSettings
    };

    return (
        <NotificationContext.Provider value={value}>
            {children}
        </NotificationContext.Provider>
    );
};

// Custom hook to use notifications
const useNotifications = () => {
    const context = useContext(NotificationContext);
    if (!context) {
        throw new Error('useNotifications must be used within a NotificationProvider');
    }
    return context;
};

// Notification templates
export const NOTIFICATION_TEMPLATES = {
    USER_LOGIN: {
        title: 'User Login',
        message: 'User {username} logged in from {location}',
        type: NOTIFICATION_TYPES.INFO
    },
    ORDER_CREATED: {
        title: 'New Order',
        message: 'Order #{orderId} created by {customer}',
        type: NOTIFICATION_TYPES.SUCCESS
    },
    PAYMENT_FAILED: {
        title: 'Payment Failed',
        message: 'Payment failed for order #{orderId}',
        type: NOTIFICATION_TYPES.ERROR
    },
    STOCK_LOW: {
        title: 'Low Stock Alert',
        message: 'Product {product} is running low (Qty: {quantity})',
        type: NOTIFICATION_TYPES.WARNING
    },
    SYSTEM_UPDATE: {
        title: 'System Update',
        message: 'System update scheduled for {time}',
        type: NOTIFICATION_TYPES.INFO
    }
};

// Utility function to format notification message with variables
export const formatNotificationMessage = (template, variables) => {
    let message = template.message;
    Object.entries(variables).forEach(([key, value]) => {
        message = message.replace(`{${key}}`, value);
    });
    return {
        ...template,
        message
    };
};

export default useNotifications; 