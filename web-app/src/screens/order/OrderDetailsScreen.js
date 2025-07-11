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
  Chip,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const OrderDetailsScreen = () => {
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchOrderDetails = async () => {
      try {
        setLoading(true);
        const { data } = await axios.get(`/api/orders/${orderId}`);
        setOrder(data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch order details');
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId]);

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
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
        </Box>
      </Container>
    );
  }

  if (!order) {
    return (
      <Container maxWidth="md">
        <Box my={4} textAlign="center">
          <Typography variant="h5" gutterBottom>
            Order not found
          </Typography>
          <Button 
            variant="contained" 
            color="primary" 
            onClick={() => navigate('/orders')}
          >
            Back to Orders
          </Button>
        </Box>
      </Container>
    );
  }

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Button 
          variant="outlined" 
          onClick={() => navigate('/orders')} 
          sx={{ mb: 3 }}
        >
          Back to Orders
        </Button>
        
        <Typography variant="h4" gutterBottom>
          Order Details
        </Typography>
        <Divider sx={{ mb: 3 }} />
        
        <Paper elevation={3} sx={{ p: 3, mb: 3 }}>
          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Typography variant="h6" gutterBottom>
                Order #{order._id.substring(0, 8)}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                Placed on: {new Date(order.createdAt).toLocaleDateString()}
              </Typography>
            </Grid>
            <Grid item xs={12} sm={6} sx={{ textAlign: { sm: 'right' } }}>
              <Chip 
                label={order.status} 
                color={
                  order.status === 'COMPLETED' 
                    ? 'success' 
                    : order.status === 'PENDING' 
                      ? 'warning' 
                      : 'info'
                }
                sx={{ mb: 1 }}
              />
              <Typography variant="h6" color="primary">
                Total: ${order.totalAmount.toFixed(2)}
              </Typography>
            </Grid>
          </Grid>
        </Paper>
        
        <Grid container spacing={3}>
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Items
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <List>
                {order.orderItems && order.orderItems.map((item, index) => (
                  <ListItem 
                    key={index}
                    divider={index < order.orderItems.length - 1}
                    sx={{ px: 0 }}
                  >
                    <Grid container spacing={2}>
                      <Grid item xs={2} sm={1}>
                        <Box 
                          component="img"
                          src={item.image || 'https://via.placeholder.com/50'}
                          alt={item.name}
                          sx={{ width: '100%', maxWidth: 50, borderRadius: 1 }}
                        />
                      </Grid>
                      <Grid item xs={6} sm={7}>
                        <ListItemText 
                          primary={item.name}
                          secondary={`Quantity: ${item.quantity}`}
                        />
                      </Grid>
                      <Grid item xs={4} sm={4} textAlign="right">
                        <Typography variant="body1">
                          ${(item.price * item.quantity).toFixed(2)}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          ${item.price.toFixed(2)} each
                        </Typography>
                      </Grid>
                    </Grid>
                  </ListItem>
                ))}
              </List>
            </Paper>
          </Grid>
          
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Order Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              <Box sx={{ mb: 2 }}>
                <Grid container spacing={1}>
                  <Grid item xs={8}>
                    <Typography variant="body1">Subtotal:</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="body1">
                      ${order.pricing?.subtotal?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={8}>
                    <Typography variant="body1">Tax:</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="body1">
                      ${order.pricing?.tax?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={8}>
                    <Typography variant="body1">Shipping:</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="body1">
                      ${order.pricing?.shipping?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                  
                  <Grid item xs={8}>
                    <Typography variant="body1">Discount:</Typography>
                  </Grid>
                  <Grid item xs={4} textAlign="right">
                    <Typography variant="body1" color="error">
                      -${order.pricing?.discount?.toFixed(2) || '0.00'}
                    </Typography>
                  </Grid>
                </Grid>
              </Box>
              <Divider sx={{ mb: 2 }} />
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <Typography variant="h6">Total:</Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="h6" color="primary">
                    ${order.totalAmount.toFixed(2)}
                  </Typography>
                </Grid>
              </Grid>
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default OrderDetailsScreen; 