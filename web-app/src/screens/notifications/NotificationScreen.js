import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  IconButton,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  ListItemSecondaryAction,
  Avatar,
  Badge,
  Tabs,
  Tab,
  CircularProgress,
  Chip,
  Menu,
  MenuItem
} from '@mui/material';
import {
  Notifications,
  DeleteOutline,
  CheckCircleOutline,
  ErrorOutline,
  InfoOutlined,
  EventAvailable,
  ShoppingBag,
  Message,
  MoreVert,
  ArrowBack
} from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`notification-tabpanel-${index}`}
      aria-labelledby={`notification-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ py: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const NotificationScreen = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedNotificationId, setSelectedNotificationId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    fetchNotifications();
  }, []);

  const fetchNotifications = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/notifications');
      setNotifications(data);
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to fetch notifications');
      setLoading(false);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleMenuClick = (event, notificationId) => {
    setAnchorEl(event.currentTarget);
    setSelectedNotificationId(notificationId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedNotificationId(null);
  };

  const handleMarkAsRead = async () => {
    try {
      await axios.patch(`/api/notifications/${selectedNotificationId}`, { read: true });
      
      // Update the notification in the local state
      setNotifications(notifications.map(notification => 
        notification._id === selectedNotificationId 
          ? { ...notification, read: true } 
          : notification
      ));
      
      handleMenuClose();
    } catch (err) {
      console.error('Failed to mark notification as read:', err);
    }
  };

  const handleDeleteNotification = async () => {
    try {
      await axios.delete(`/api/notifications/${selectedNotificationId}`);
      
      // Remove the notification from the local state
      setNotifications(notifications.filter(notification => 
        notification._id !== selectedNotificationId
      ));
      
      handleMenuClose();
    } catch (err) {
      console.error('Failed to delete notification:', err);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await axios.patch('/api/notifications/mark-all-read');
      
      // Update all notifications in the local state
      setNotifications(notifications.map(notification => ({ ...notification, read: true })));
    } catch (err) {
      console.error('Failed to mark all notifications as read:', err);
    }
  };

  const handleClearAll = async () => {
    try {
      await axios.delete('/api/notifications/clear-all');
      
      // Clear all notifications from the local state
      setNotifications([]);
    } catch (err) {
      console.error('Failed to clear all notifications:', err);
    }
  };

  const handleNotificationClick = (notification) => {
    // Mark as read when clicked
    if (!notification.read) {
      handleMarkAsRead(notification._id);
    }
    
    // Navigate based on notification type
    switch (notification.type) {
      case 'EVENT':
        navigate(`/event/${notification.entityId}`);
        break;
      case 'ORDER':
        navigate(`/order/${notification.entityId}`);
        break;
      case 'MESSAGE':
        navigate(`/chat/${notification.entityId}`);
        break;
      default:
        navigate('/dashboard');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'EVENT':
        return <EventAvailable color="primary" />;
      case 'ORDER':
        return <ShoppingBag color="secondary" />;
      case 'MESSAGE':
        return <Message color="info" />;
      case 'ALERT':
        return <ErrorOutline color="error" />;
      default:
        return <InfoOutlined color="action" />;
    }
  };

  const getFilteredNotifications = () => {
    switch (tabValue) {
      case 0: // All
        return notifications;
      case 1: // Unread
        return notifications.filter(notification => !notification.read);
      case 2: // Events
        return notifications.filter(notification => notification.type === 'EVENT');
      case 3: // Orders
        return notifications.filter(notification => notification.type === 'ORDER');
      case 4: // Messages
        return notifications.filter(notification => notification.type === 'MESSAGE');
      default:
        return notifications;
    }
  };

  // Use demo data if no notifications are available
  const demoNotifications = [
    {
      _id: '1',
      title: 'New Event Invitation',
      message: 'You have been invited to "Summer Tech Conference 2023"',
      createdAt: new Date(Date.now() - 2 * 60 * 60 * 1000).toISOString(),
      read: false,
      type: 'EVENT',
      entityId: 'event-123'
    },
    {
      _id: '2',
      title: 'Order Confirmed',
      message: 'Your order #12345 has been confirmed and is being processed',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
      read: true,
      type: 'ORDER',
      entityId: 'order-123'
    },
    {
      _id: '3',
      title: 'New Message',
      message: 'You have a new message from Event Organizer',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      type: 'MESSAGE',
      entityId: 'chat-123'
    },
    {
      _id: '4',
      title: 'System Alert',
      message: 'Your subscription will expire in 7 days. Please renew to avoid service interruption.',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      read: false,
      type: 'ALERT',
      entityId: null
    }
  ];

  const displayNotifications = notifications.length > 0 ? notifications : demoNotifications;
  const filteredNotifications = tabValue === 0 ? displayNotifications : getFilteredNotifications();
  const unreadCount = displayNotifications.filter(notification => !notification.read).length;

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="80vh">
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" color="error" gutterBottom>
            {error}
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={fetchNotifications}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="md">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Notifications
          </Typography>
          {unreadCount > 0 && (
            <Badge 
              badgeContent={unreadCount} 
              color="error"
              sx={{ ml: 2 }}
            >
              <Notifications color="action" />
            </Badge>
          )}
          <Box sx={{ flexGrow: 1 }} />
          <Button 
            variant="outlined" 
            size="small" 
            onClick={handleMarkAllAsRead}
            sx={{ mr: 1 }}
          >
            Mark All Read
          </Button>
          <Button 
            variant="outlined" 
            color="error" 
            size="small" 
            onClick={handleClearAll}
          >
            Clear All
          </Button>
        </Box>

        <Paper elevation={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All" />
            <Tab 
              label={
                <Box display="flex" alignItems="center">
                  Unread
                  {unreadCount > 0 && (
                    <Chip 
                      label={unreadCount} 
                      color="error" 
                      size="small" 
                      sx={{ ml: 1 }}
                    />
                  )}
                </Box>
              } 
            />
            <Tab label="Events" />
            <Tab label="Orders" />
            <Tab label="Messages" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <NotificationList 
              notifications={filteredNotifications} 
              handleMenuClick={handleMenuClick} 
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={1}>
            <NotificationList 
              notifications={filteredNotifications} 
              handleMenuClick={handleMenuClick} 
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
              emptyMessage="No unread notifications"
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            <NotificationList 
              notifications={filteredNotifications} 
              handleMenuClick={handleMenuClick} 
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
              emptyMessage="No event notifications"
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            <NotificationList 
              notifications={filteredNotifications} 
              handleMenuClick={handleMenuClick} 
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
              emptyMessage="No order notifications"
            />
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            <NotificationList 
              notifications={filteredNotifications} 
              handleMenuClick={handleMenuClick} 
              handleNotificationClick={handleNotificationClick}
              getNotificationIcon={getNotificationIcon}
              emptyMessage="No message notifications"
            />
          </TabPanel>
        </Paper>
      </Box>

      <Menu
        anchorEl={anchorEl}
        open={Boolean(anchorEl)}
        onClose={handleMenuClose}
      >
        <MenuItem onClick={handleMarkAsRead}>Mark as Read</MenuItem>
        <MenuItem onClick={handleDeleteNotification}>Delete</MenuItem>
      </Menu>
    </Container>
  );
};

// Helper component for notification list
const NotificationList = ({ 
  notifications, 
  handleMenuClick, 
  handleNotificationClick, 
  getNotificationIcon,
  emptyMessage = "No notifications"
}) => {
  if (notifications.length === 0) {
    return (
      <Box textAlign="center" py={3}>
        <Typography color="textSecondary">{emptyMessage}</Typography>
      </Box>
    );
  }

  const formatTime = (dateString) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffMinutes < 1) return 'Just now';
    if (diffMinutes < 60) return `${diffMinutes}m ago`;
    
    const diffHours = Math.floor(diffMinutes / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    
    const diffDays = Math.floor(diffHours / 24);
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString();
  };

  return (
    <List sx={{ width: '100%', bgcolor: 'background.paper' }}>
      {notifications.map((notification) => (
        <Paper 
          key={notification._id} 
          elevation={notification.read ? 0 : 1}
          sx={{ 
            mb: 1, 
            bgcolor: notification.read ? 'background.paper' : 'action.hover' 
          }}
        >
          <ListItem 
            alignItems="flex-start" 
            button 
            onClick={() => handleNotificationClick(notification)}
            sx={{ py: 2 }}
          >
            <ListItemAvatar>
              <Avatar sx={{ bgcolor: notification.read ? 'action.disabledBackground' : 'primary.light' }}>
                {getNotificationIcon(notification.type)}
              </Avatar>
            </ListItemAvatar>
            
            <ListItemText
              primary={
                <Box display="flex" alignItems="center">
                  <Typography 
                    variant="subtitle1" 
                    component="span" 
                    fontWeight={notification.read ? 'normal' : 'bold'}
                  >
                    {notification.title}
                  </Typography>
                  {!notification.read && (
                    <Chip 
                      label="New" 
                      size="small" 
                      color="primary" 
                      sx={{ ml: 1, height: 20 }} 
                    />
                  )}
                </Box>
              }
              secondary={
                <>
                  <Typography
                    component="span"
                    variant="body2"
                    color="text.primary"
                    sx={{ display: 'block', mb: 1 }}
                  >
                    {notification.message}
                  </Typography>
                  <Typography
                    component="span"
                    variant="caption"
                    color="text.secondary"
                  >
                    {formatTime(notification.createdAt)}
                  </Typography>
                </>
              }
            />
            
            <ListItemSecondaryAction>
              <IconButton edge="end" onClick={(e) => handleMenuClick(e, notification._id)}>
                <MoreVert />
              </IconButton>
            </ListItemSecondaryAction>
          </ListItem>
        </Paper>
      ))}
    </List>
  );
};

export default NotificationScreen; 