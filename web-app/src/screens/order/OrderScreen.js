import React, { useState, useEffect } from 'react';
import { 
  Container, 
  Typography, 
  Box, 
  Paper, 
  Divider, 
  Button, 
  Grid,
  CircularProgress
} from '@mui/material';
import { useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const OrderScreen = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get('/api/orders');
        setOrders(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch orders');
        setLoading(false);
      }
    };

    fetchOrders();
  }, []);

  const handleOrderDetails = (orderId) => {
    navigate(`/order/${orderId}`);
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
          My Orders
        </Typography>
        <Divider sx={{ mb: 3 }} />

        {orders.length === 0 ? (
          <Paper elevation={3} sx={{ p: 3, textAlign: 'center' }}>
            <Typography variant="h6">You don't have any orders yet</Typography>
            <Button 
              variant="contained" 
              color="primary" 
              sx={{ mt: 2 }}
              onClick={() => navigate('/events')}
            >
              Browse Events
            </Button>
          </Paper>
        ) : (
          <Grid container spacing={3}>
            {orders.map((order) => (
              <Grid item xs={12} key={order._id}>
                <Paper 
                  elevation={2} 
                  sx={{ 
                    p: 3, 
                    '&:hover': { 
                      boxShadow: 6,
                      cursor: 'pointer'
                    }
                  }}
                  onClick={() => handleOrderDetails(order._id)}
                >
                  <Grid container spacing={2}>
                    <Grid item xs={12} sm={8}>
                      <Typography variant="h6">
                        Order #{order._id.substring(0, 8)}
                      </Typography>
                      <Typography variant="body2" color="text.secondary">
                        Placed on: {new Date(order.createdAt).toLocaleDateString()}
                      </Typography>
                    </Grid>
                    <Grid item xs={12} sm={4} textAlign="right">
                      <Typography variant="h6" color="primary">
                        ${order.totalAmount.toFixed(2)}
                      </Typography>
                      <Typography 
                        variant="body2" 
                        sx={{ 
                          color: order.status === 'COMPLETED' 
                            ? 'success.main' 
                            : order.status === 'PENDING' 
                              ? 'warning.main' 
                              : 'info.main'
                        }}
                      >
                        {order.status}
                      </Typography>
                    </Grid>
                  </Grid>
                </Paper>
              </Grid>
            ))}
          </Grid>
        )}
      </Box>
    </Container>
  );
};

export default OrderScreen; 