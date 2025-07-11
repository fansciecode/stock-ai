import React, { createContext, useContext, useState, useEffect } from 'react';
import { notification } from 'antd';

const NotificationContext = createContext();

export const useNotification = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotification must be used within a NotificationProvider');
  }
  return context;
};

export const NotificationProvider = ({ children }) => {
  const [notifications, setNotifications] = useState([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);

  // Configure notification settings
  useEffect(() => {
    notification.config({
      placement: 'topRight',
      duration: 4.5,
      maxCount: 3,
    });
  }, []);

  // Load notifications from localStorage on mount
  useEffect(() => {
    const savedNotifications = localStorage.getItem('notifications');
    if (savedNotifications) {
      const parsedNotifications = JSON.parse(savedNotifications);
      setNotifications(parsedNotifications);
      setUnreadCount(parsedNotifications.filter(n => !n.read).length);
    }
  }, []);

  // Save notifications to localStorage whenever they change
  useEffect(() => {
    if (notifications.length > 0) {
      localStorage.setItem('notifications', JSON.stringify(notifications));
    }
  }, [notifications]);

  const showNotification = (type, title, message, options = {}) => {
    const notificationData = {
      id: Date.now(),
      type,
      title,
      message,
      timestamp: new Date().toISOString(),
      read: false,
      ...options
    };

    // Add to notifications list
    setNotifications(prev => [notificationData, ...prev]);
    setUnreadCount(prev => prev + 1);

    // Show antd notification
    notification[type]({
      message: title,
      description: message,
      duration: options.duration || 4.5,
      ...options
    });
  };

  const showSuccess = (title, message, options = {}) => {
    showNotification('success', title, message, options);
  };

  const showError = (title, message, options = {}) => {
    showNotification('error', title, message, options);
  };

  const showWarning = (title, message, options = {}) => {
    showNotification('warning', title, message, options);
  };

  const showInfo = (title, message, options = {}) => {
    showNotification('info', title, message, options);
  };

  const markAsRead = (notificationId) => {
    setNotifications(prev =>
      prev.map(n =>
        n.id === notificationId ? { ...n, read: true } : n
      )
    );
    setUnreadCount(prev => Math.max(0, prev - 1));
  };

  const markAllAsRead = () => {
    setNotifications(prev =>
      prev.map(n => ({ ...n, read: true }))
    );
    setUnreadCount(0);
  };

  const deleteNotification = (notificationId) => {
    setNotifications(prev => {
      const notification = prev.find(n => n.id === notificationId);
      if (notification && !notification.read) {
        setUnreadCount(prevCount => Math.max(0, prevCount - 1));
      }
      return prev.filter(n => n.id !== notificationId);
    });
  };

  const clearAllNotifications = () => {
    setNotifications([]);
    setUnreadCount(0);
    localStorage.removeItem('notifications');
  };

  const getNotificationsByType = (type) => {
    return notifications.filter(n => n.type === type);
  };

  const getUnreadNotifications = () => {
    return notifications.filter(n => !n.read);
  };

  const getRecentNotifications = (limit = 5) => {
    return notifications.slice(0, limit);
  };

  // Real-time notification handler (can be used with WebSocket)
  const handleRealtimeNotification = (data) => {
    showNotification(
      data.type || 'info',
      data.title || 'New Notification',
      data.message || 'You have a new notification',
      {
        duration: data.duration || 6,
        onClick: () => {
          if (data.onClick) {
            data.onClick();
          }
        }
      }
    );
  };

  const value = {
    notifications,
    unreadCount,
    isLoading,
    showNotification,
    showSuccess,
    showError,
    showWarning,
    showInfo,
    markAsRead,
    markAllAsRead,
    deleteNotification,
    clearAllNotifications,
    getNotificationsByType,
    getUnreadNotifications,
    getRecentNotifications,
    handleRealtimeNotification
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};
