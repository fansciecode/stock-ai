import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Paper,
  Divider,
  Button,
  Grid,
  CircularProgress,
  Tabs,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Chip,
  IconButton,
  Menu,
  MenuItem
} from '@mui/material';
import { MoreVert as MoreVertIcon } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`order-tabpanel-${index}`}
      aria-labelledby={`order-tab-${index}`}
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

const OrderManagementScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedOrderId, setSelectedOrderId] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        // For a business user, we would fetch their orders
        const { data } = await axios.get('/api/business/orders');
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleMenuClick = (event, orderId) => {
    setAnchorEl(event.currentTarget);
    setSelectedOrderId(orderId);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
    setSelectedOrderId(null);
  };

  const handleViewDetails = () => {
    navigate(`/order/${selectedOrderId}`);
    handleMenuClose();
  };

  const handleUpdateStatus = async (status) => {
    try {
      await axios.put(`/api/orders/${selectedOrderId}/status`, { status });
      
      // Update the order status in the local state
      setOrders(orders.map(order => 
        order._id === selectedOrderId 
          ? { ...order, status } 
          : order
      ));
      
      handleMenuClose();
    } catch (err) {
      console.error('Failed to update order status:', err);
      // You might want to show an error message to the user
    }
  };

  const getStatusColor = (status) => {
    switch (status) {
      case 'PENDING':
        return 'warning';
      case 'PROCESSING':
        return 'info';
      case 'SHIPPED':
        return 'primary';
      case 'DELIVERED':
        return 'success';
      case 'CANCELLED':
        return 'error';
      default:
        return 'default';
    }
  };

  const filteredOrders = () => {
    switch (tabValue) {
      case 0: // All
        return orders;
      case 1: // Pending
        return orders.filter(order => order.status === 'PENDING');
      case 2: // Processing
        return orders.filter(order => order.status === 'PROCESSING');
      case 3: // Shipped
        return orders.filter(order => order.status === 'SHIPPED');
      case 4: // Delivered
        return orders.filter(order => order.status === 'DELIVERED');
      case 5: // Cancelled
        return orders.filter(order => order.status === 'CANCELLED');
      default:
        return orders;
    }
  };

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
            onClick={() => window.location.reload()}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Typography variant="h4" gutterBottom>
          Order Management
        </Typography>
        <Divider sx={{ mb: 3 }} />

        <Paper elevation={3}>
          <Tabs
            value={tabValue}
            onChange={handleTabChange}
            indicatorColor="primary"
            textColor="primary"
            variant="scrollable"
            scrollButtons="auto"
          >
            <Tab label="All Orders" />
            <Tab label="Pending" />
            <Tab label="Processing" />
            <Tab label="Shipped" />
            <Tab label="Delivered" />
            <Tab label="Cancelled" />
          </Tabs>

          <TabPanel value={tabValue} index={0}>
            <TableContainer>
              <Table sx={{ minWidth: 650 }}>
                <TableHead>
                  <TableRow>
                    <TableCell>Order ID</TableCell>
                    <TableCell>Date</TableCell>
                    <TableCell>Customer</TableCell>
                    <TableCell>Amount</TableCell>
                    <TableCell>Status</TableCell>
                    <TableCell>Actions</TableCell>
                  </TableRow>
                </TableHead>
                <TableBody>
                  {filteredOrders().length > 0 ? (
                    filteredOrders().map((order) => (
                      <TableRow key={order._id}>
                        <TableCell component="th" scope="row">
                          #{order._id.substring(0, 8)}
                        </TableCell>
                        <TableCell>
                          {new Date(order.createdAt).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          {order.customer?.name || 'N/A'}
                        </TableCell>
                        <TableCell>
                          ${order.totalAmount?.toFixed(2) || '0.00'}
                        </TableCell>
                        <TableCell>
                          <Chip 
                            label={order.status} 
                            color={getStatusColor(order.status)}
                            size="small"
                          />
                        </TableCell>
                        <TableCell>
                          <IconButton 
                            size="small"
                            onClick={(e) => handleMenuClick(e, order._id)}
                          >
                            <MoreVertIcon />
                          </IconButton>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={6} align="center">
                        No orders found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </TableContainer>
          </TabPanel>

          {/* The same table content would be in each tab, 
              but with filtered data based on the selected tab */}
          <TabPanel value={tabValue} index={1}>
            {/* Pending Orders Content */}
            {/* Same table structure as above, but showing only pending orders */}
          </TabPanel>
          
          <TabPanel value={tabValue} index={2}>
            {/* Processing Orders Content */}
          </TabPanel>
          
          <TabPanel value={tabValue} index={3}>
            {/* Shipped Orders Content */}
          </TabPanel>
          
          <TabPanel value={tabValue} index={4}>
            {/* Delivered Orders Content */}
          </TabPanel>
          
          <TabPanel value={tabValue} index={5}>
            {/* Cancelled Orders Content */}
          </TabPanel>
        </Paper>

        <Menu
          anchorEl={anchorEl}
          open={Boolean(anchorEl)}
          onClose={handleMenuClose}
        >
          <MenuItem onClick={handleViewDetails}>View Details</MenuItem>
          <MenuItem onClick={() => handleUpdateStatus('PROCESSING')}>Mark as Processing</MenuItem>
          <MenuItem onClick={() => handleUpdateStatus('SHIPPED')}>Mark as Shipped</MenuItem>
          <MenuItem onClick={() => handleUpdateStatus('DELIVERED')}>Mark as Delivered</MenuItem>
          <MenuItem onClick={() => handleUpdateStatus('CANCELLED')}>Cancel Order</MenuItem>
        </Menu>
      </Box>
    </Container>
  );
};

export default OrderManagementScreen; 