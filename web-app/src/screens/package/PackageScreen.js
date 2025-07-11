import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
  Chip,
  Paper,
  Divider,
  Tabs,
  Tab
} from "@mui/material";
import {
  ArrowBack,
  Check,
  Event,
  AttachMoney,
  LocalOffer,
  ShoppingCart,
  Info,
} from "@mui/icons-material";
import axios from 'axios';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`package-tabpanel-${index}`}
      aria-labelledby={`package-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box sx={{ p: 3 }}>
          {children}
        </Box>
      )}
    </div>
  );
}

const PackageScreen = () => {
  const navigate = useNavigate();
  const { packageId } = useParams();

  const [packageDetails, setPackageDetails] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [tabValue, setTabValue] = useState(0);
  const [purchasing, setPurchasing] = useState(false);

  useEffect(() => {
    fetchPackageDetails();
  }, [packageId]);

  const fetchPackageDetails = async () => {
    try {
      setLoading(true);
      setError(null);
      // If packageId is available in params, use it, otherwise use a dummy ID for demo
      const id = packageId || 'package-123';
      const { data } = await axios.get(`/api/packages/${id}`);
      setPackageDetails(data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load package details');
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handlePurchase = async () => {
    try {
      setPurchasing(true);
      await axios.post('/api/packages/purchase', { packageId: packageDetails._id });
      alert('Package purchased successfully!');
      navigate('/dashboard');
    } catch (err) {
      alert('Failed to purchase package: ' + (err.response?.data?.message || err.message));
    } finally {
      setPurchasing(false);
    }
  };

  const formatPrice = (price, currency = "USD") => {
    return new Intl.NumberFormat("en-US", {
      style: "currency",
      currency: currency,
    }).format(price);
  };

  if (loading) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box
          display="flex"
          justifyContent="center"
          alignItems="center"
          minHeight="400px"
        >
          <CircularProgress size={50} />
        </Box>
      </Container>
    );
  }

  if (error) {
    return (
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Box display="flex" alignItems="center" mb={2}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h5">Package Details</Typography>
        </Box>

        <Alert
          severity="error"
          action={
            <Button color="inherit" size="small" onClick={fetchPackageDetails}>
              Retry
            </Button>
          }
        >
          {error}
        </Alert>
      </Container>
    );
  }

  // Demo package data if package details is null
  const demoPackage = {
    _id: 'package-123',
    name: 'Premium Event Package',
    description: 'Host unlimited premium events with advanced features',
    price: 299.99,
    currency: 'USD',
    features: [
      'Unlimited Event Creation',
      'Premium Event Analytics',
      'Priority Customer Support',
      'Custom Branding Options',
      'Advanced Marketing Tools'
    ],
    billingCycle: 'monthly',
    eventLimit: 'Unlimited',
    discountPercentage: 15,
    popularity: 'Most Popular',
    recommended: true
  };

  const displayPackage = packageDetails || demoPackage;

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          Package Details
        </Typography>
      </Box>

      <Grid container spacing={4}>
        <Grid item xs={12} md={8}>
          <Paper elevation={3} sx={{ mb: 4, overflow: 'hidden' }}>
            <Box 
              sx={{ 
                bgcolor: 'primary.main', 
                color: 'primary.contrastText', 
                p: 3,
                position: 'relative'
              }}
            >
              <Typography variant="h5" fontWeight="bold">
                {displayPackage.name}
              </Typography>
              
              {displayPackage.recommended && (
                <Chip 
                  label="Recommended" 
                  color="secondary" 
                  size="small"
                  sx={{ 
                    position: 'absolute', 
                    top: 16, 
                    right: 16 
                  }}
                />
              )}
              
              {displayPackage.popularity && (
                <Chip 
                  label={displayPackage.popularity} 
                  color="success" 
                  size="small"
                  sx={{ mt: 1 }}
                />
              )}
              
              <Typography variant="h4" sx={{ mt: 2, mb: 1 }}>
                {formatPrice(displayPackage.price, displayPackage.currency)}
                <Typography component="span" variant="body1" sx={{ ml: 1 }}>
                  / {displayPackage.billingCycle}
                </Typography>
              </Typography>
              
              {displayPackage.discountPercentage > 0 && (
                <Box display="flex" alignItems="center" gap={1}>
                  <LocalOffer fontSize="small" />
                  <Typography variant="body2">
                    {displayPackage.discountPercentage}% discount applied
                  </Typography>
                </Box>
              )}
            </Box>

            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              variant="fullWidth"
            >
              <Tab label="Features" />
              <Tab label="Description" />
              <Tab label="FAQ" />
            </Tabs>

            <TabPanel value={tabValue} index={0}>
              <List>
                {displayPackage.features.map((feature, index) => (
                  <ListItem key={index} disableGutters>
                    <ListItemIcon sx={{ minWidth: '40px' }}>
                      <Check color="success" />
                    </ListItemIcon>
                    <ListItemText primary={feature} />
                  </ListItem>
                ))}
              </List>
            </TabPanel>

            <TabPanel value={tabValue} index={1}>
              <Typography variant="body1" paragraph>
                {displayPackage.description}
              </Typography>
              <Typography variant="body1" paragraph>
                This package allows you to create and manage events with enhanced features and capabilities.
                Ideal for businesses looking to host premium events with advanced customization options.
              </Typography>
              
              <Box sx={{ mt: 3 }}>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Event Limit
                </Typography>
                <Typography variant="body1">
                  {displayPackage.eventLimit}
                </Typography>
              </Box>
            </TabPanel>

            <TabPanel value={tabValue} index={2}>
              <Box>
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  How do I upgrade my package?
                </Typography>
                <Typography variant="body1" paragraph>
                  You can upgrade your package at any time from your account dashboard. 
                  The price difference will be prorated based on your current billing cycle.
                </Typography>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Can I downgrade my package?
                </Typography>
                <Typography variant="body1" paragraph>
                  Yes, you can downgrade your package at the end of your current billing cycle.
                </Typography>
                
                <Typography variant="subtitle1" fontWeight="bold" gutterBottom>
                  Is there a refund policy?
                </Typography>
                <Typography variant="body1" paragraph>
                  We offer a 30-day money-back guarantee if you're not satisfied with your package.
                </Typography>
              </Box>
            </TabPanel>
          </Paper>
        </Grid>

        <Grid item xs={12} md={4}>
          <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Purchase Summary
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Box sx={{ mb: 2 }}>
              <Grid container spacing={1}>
                <Grid item xs={8}>
                  <Typography variant="body1">
                    {displayPackage.name}:
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="body1">
                    {formatPrice(displayPackage.price, displayPackage.currency)}
                  </Typography>
                </Grid>
                
                {displayPackage.discountPercentage > 0 && (
                  <>
                    <Grid item xs={8}>
                      <Typography variant="body1">
                        Discount ({displayPackage.discountPercentage}%):
                      </Typography>
                    </Grid>
                    <Grid item xs={4} textAlign="right">
                      <Typography variant="body1" color="error">
                        -{formatPrice(displayPackage.price * (displayPackage.discountPercentage / 100))}
                      </Typography>
                    </Grid>
                  </>
                )}
                
                <Grid item xs={8}>
                  <Typography variant="body1">
                    Tax:
                  </Typography>
                </Grid>
                <Grid item xs={4} textAlign="right">
                  <Typography variant="body1">
                    {formatPrice(displayPackage.price * 0.1)}
                  </Typography>
                </Grid>
              </Grid>
            </Box>
            
            <Divider sx={{ mb: 2 }} />
            
            <Grid container spacing={1}>
              <Grid item xs={8}>
                <Typography variant="h6" fontWeight="bold">
                  Total:
                </Typography>
              </Grid>
              <Grid item xs={4} textAlign="right">
                <Typography variant="h6" color="primary" fontWeight="bold">
                  {formatPrice(
                    displayPackage.price - 
                    (displayPackage.price * (displayPackage.discountPercentage || 0) / 100) + 
                    (displayPackage.price * 0.1)
                  )}
                </Typography>
              </Grid>
              <Grid item xs={12}>
                <Typography variant="body2" color="text.secondary">
                  Billed {displayPackage.billingCycle}
                </Typography>
              </Grid>
            </Grid>
            
            <Button
              variant="contained"
              color="primary"
              size="large"
              fullWidth
              sx={{ mt: 3 }}
              startIcon={<ShoppingCart />}
              onClick={handlePurchase}
              disabled={purchasing}
            >
              {purchasing ? 'Processing...' : 'Purchase Now'}
            </Button>
            
            <Typography variant="body2" color="text.secondary" align="center" sx={{ mt: 2 }}>
              By purchasing, you agree to our terms and conditions.
            </Typography>
          </Paper>
          
          <Paper elevation={3} sx={{ p: 3 }}>
            <Typography variant="h6" fontWeight="bold" gutterBottom>
              Need Help?
            </Typography>
            <Divider sx={{ mb: 2 }} />
            
            <Typography variant="body2" paragraph>
              If you have any questions about our packages, please contact our support team.
            </Typography>
            
            <Button
              variant="outlined"
              fullWidth
              onClick={() => navigate('/support')}
            >
              Contact Support
            </Button>
          </Paper>
        </Grid>
      </Grid>
    </Container>
  );
};

export default PackageScreen; 