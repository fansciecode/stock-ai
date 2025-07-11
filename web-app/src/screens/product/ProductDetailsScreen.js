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
  Rating,
  Tabs,
  Tab,
  TextField,
  Chip,
  Stack,
  List,
  ListItem,
  ListItemText,
  ListItemAvatar,
  Avatar,
  IconButton
} from '@mui/material';
import {
  Favorite,
  FavoriteBorder,
  Share,
  AddShoppingCart,
  Remove,
  Add
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

function TabPanel(props) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`product-tabpanel-${index}`}
      aria-labelledby={`product-tab-${index}`}
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

const ProductDetailsScreen = () => {
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [tabValue, setTabValue] = useState(0);
  const [reviews, setReviews] = useState([]);
  const [isFavorite, setIsFavorite] = useState(false);
  const [reviewText, setReviewText] = useState('');
  const [rating, setRating] = useState(5);
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();

  useEffect(() => {
    const fetchProductDetails = async () => {
      try {
        setLoading(true);
        // If productId is available in params, use it, otherwise use a dummy ID for demo
        const id = productId || '60f7b0b9e4b0b7b4b7b4b7b4';
        const { data } = await axios.get(`/api/products/${id}`);
        setProduct(data);
        
        // Fetch reviews for this product
        const reviewsResponse = await axios.get(`/api/products/${id}/reviews`);
        setReviews(reviewsResponse.data);
        
        // Check if this product is in user's favorites
        if (user) {
          const favResponse = await axios.get(`/api/users/favorites`);
          setIsFavorite(favResponse.data.some(fav => fav._id === id));
        }
        
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to fetch product details');
        setLoading(false);
      }
    };

    fetchProductDetails();
  }, [productId, user]);

  const handleQuantityChange = (action) => {
    if (action === 'increment') {
      setQuantity(prev => prev + 1);
    } else if (action === 'decrement' && quantity > 1) {
      setQuantity(prev => prev - 1);
    }
  };

  const handleTabChange = (event, newValue) => {
    setTabValue(newValue);
  };

  const handleAddToCart = async () => {
    try {
      await axios.post('/api/cart', {
        productId: product._id,
        quantity
      });
      // Show success notification or redirect to cart
      navigate('/cart');
    } catch (err) {
      console.error('Failed to add to cart:', err);
      // Show error notification
    }
  };

  const handleToggleFavorite = async () => {
    try {
      if (isFavorite) {
        await axios.delete(`/api/users/favorites/${product._id}`);
      } else {
        await axios.post('/api/users/favorites', { productId: product._id });
      }
      setIsFavorite(!isFavorite);
    } catch (err) {
      console.error('Failed to update favorites:', err);
      // Show error notification
    }
  };

  const handleSubmitReview = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`/api/products/${product._id}/reviews`, {
        rating,
        comment: reviewText
      });
      setReviews([...reviews, response.data]);
      setReviewText('');
      setRating(5);
    } catch (err) {
      console.error('Failed to submit review:', err);
      // Show error notification
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
            onClick={() => navigate(-1)}
          >
            Go Back
          </Button>
        </Box>
      </Container>
    );
  }

  // For demonstration, use dummy data if product is null
  const demoProduct = {
    _id: '60f7b0b9e4b0b7b4b7b4b7b4',
    name: 'Premium Event Ticket',
    description: 'Access to an exclusive premium event with VIP treatment and special amenities.',
    price: 199.99,
    images: ['https://via.placeholder.com/600x400?text=Premium+Event'],
    category: 'Event Tickets',
    rating: 4.8,
    numReviews: 24,
    inStock: true,
    features: [
      'VIP Access',
      'Reserved Seating',
      'Complimentary Refreshments',
      'Meet & Greet Opportunity',
      'Exclusive Merchandise'
    ]
  };

  const displayProduct = product || demoProduct;
  
  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Button 
          variant="outlined" 
          onClick={() => navigate(-1)} 
          sx={{ mb: 3 }}
        >
          Back
        </Button>

        <Grid container spacing={4}>
          <Grid item xs={12} md={6}>
            <Paper elevation={0} sx={{ borderRadius: 2, overflow: 'hidden' }}>
              <Box
                component="img"
                src={displayProduct.images?.[0] || "https://via.placeholder.com/600x400?text=Product+Image"}
                alt={displayProduct.name}
                sx={{ width: '100%', height: 'auto' }}
              />
            </Paper>
            
            {displayProduct.images?.length > 1 && (
              <Box mt={2} display="flex" gap={1} flexWrap="wrap">
                {displayProduct.images.slice(1).map((img, index) => (
                  <Box
                    key={index}
                    component="img"
                    src={img}
                    alt={`${displayProduct.name} view ${index + 2}`}
                    sx={{ 
                      width: 80, 
                      height: 80, 
                      objectFit: 'cover',
                      borderRadius: 1,
                      cursor: 'pointer',
                      '&:hover': { opacity: 0.8 }
                    }}
                  />
                ))}
              </Box>
            )}
          </Grid>
          
          <Grid item xs={12} md={6}>
            <Typography variant="h4" gutterBottom>
              {displayProduct.name}
            </Typography>
            
            <Box display="flex" alignItems="center" mb={1}>
              <Rating value={displayProduct.rating} precision={0.5} readOnly />
              <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                ({displayProduct.numReviews} reviews)
              </Typography>
            </Box>
            
            <Typography variant="h5" color="primary" gutterBottom>
              ${displayProduct.price.toFixed(2)}
            </Typography>
            
            <Typography variant="body1" paragraph>
              {displayProduct.description}
            </Typography>
            
            {displayProduct.features && (
              <Box mb={3}>
                <Typography variant="subtitle1" gutterBottom>
                  Features:
                </Typography>
                <List dense>
                  {displayProduct.features.map((feature, index) => (
                    <ListItem key={index} disableGutters>
                      <ListItemText primary={feature} />
                    </ListItem>
                  ))}
                </List>
              </Box>
            )}
            
            <Box mb={3}>
              <Typography variant="subtitle1" gutterBottom>
                Availability:
              </Typography>
              <Chip 
                label={displayProduct.inStock ? 'In Stock' : 'Out of Stock'} 
                color={displayProduct.inStock ? 'success' : 'error'}
              />
            </Box>
            
            {displayProduct.inStock && (
              <>
                <Box display="flex" alignItems="center" mb={3}>
                  <Typography variant="subtitle1" sx={{ mr: 2 }}>
                    Quantity:
                  </Typography>
                  <Box display="flex" alignItems="center" border={1} borderColor="divider" borderRadius={1}>
                    <IconButton 
                      size="small" 
                      onClick={() => handleQuantityChange('decrement')}
                      disabled={quantity <= 1}
                    >
                      <Remove fontSize="small" />
                    </IconButton>
                    <Typography sx={{ px: 2 }}>
                      {quantity}
                    </Typography>
                    <IconButton 
                      size="small" 
                      onClick={() => handleQuantityChange('increment')}
                    >
                      <Add fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
                
                <Stack direction="row" spacing={2} mb={3}>
                  <Button 
                    variant="contained" 
                    color="primary"
                    size="large"
                    startIcon={<AddShoppingCart />}
                    onClick={handleAddToCart}
                    fullWidth
                  >
                    Add to Cart
                  </Button>
                  <IconButton 
                    color="primary" 
                    onClick={handleToggleFavorite}
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    {isFavorite ? <Favorite /> : <FavoriteBorder />}
                  </IconButton>
                  <IconButton 
                    color="primary" 
                    sx={{ border: 1, borderColor: 'divider' }}
                  >
                    <Share />
                  </IconButton>
                </Stack>
              </>
            )}
            
            <Divider sx={{ my: 3 }} />
            
            <Box>
              <Typography variant="subtitle1" gutterBottom>
                Categories:
              </Typography>
              <Stack direction="row" spacing={1}>
                <Chip label={displayProduct.category} />
                {/* Add more categories if available */}
              </Stack>
            </Box>
          </Grid>
        </Grid>
        
        <Box mt={6}>
          <Paper elevation={3}>
            <Tabs
              value={tabValue}
              onChange={handleTabChange}
              indicatorColor="primary"
              textColor="primary"
              centered
            >
              <Tab label="Description" />
              <Tab label="Reviews" />
              <Tab label="Shipping & Returns" />
            </Tabs>
            
            <TabPanel value={tabValue} index={0}>
              <Typography variant="body1">
                {displayProduct.description}
                {/* Add more detailed description here */}
              </Typography>
            </TabPanel>
            
            <TabPanel value={tabValue} index={1}>
              <Box mb={4}>
                <Typography variant="h6" gutterBottom>
                  Customer Reviews
                </Typography>
                
                {reviews.length > 0 ? (
                  <List>
                    {reviews.map((review) => (
                      <ListItem key={review._id} alignItems="flex-start" divider>
                        <ListItemAvatar>
                          <Avatar>{review.user?.name?.charAt(0) || 'U'}</Avatar>
                        </ListItemAvatar>
                        <ListItemText
                          primary={
                            <Box display="flex" justifyContent="space-between">
                              <Typography variant="subtitle1">
                                {review.user?.name || 'Anonymous'}
                              </Typography>
                              <Typography variant="body2" color="text.secondary">
                                {new Date(review.createdAt).toLocaleDateString()}
                              </Typography>
                            </Box>
                          }
                          secondary={
                            <>
                              <Rating value={review.rating} size="small" readOnly />
                              <Typography variant="body2" sx={{ mt: 1 }}>
                                {review.comment}
                              </Typography>
                            </>
                          }
                        />
                      </ListItem>
                    ))}
                  </List>
                ) : (
                  <Typography>No reviews yet. Be the first to review this product!</Typography>
                )}
              </Box>
              
              {user && (
                <Box component="form" onSubmit={handleSubmitReview}>
                  <Typography variant="h6" gutterBottom>
                    Write a Review
                  </Typography>
                  <Box mb={2}>
                    <Typography component="legend">Your Rating</Typography>
                    <Rating
                      name="rating"
                      value={rating}
                      onChange={(e, newValue) => setRating(newValue)}
                    />
                  </Box>
                  <TextField
                    label="Your Review"
                    multiline
                    rows={4}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                  />
                  <Button 
                    type="submit" 
                    variant="contained" 
                    color="primary"
                    sx={{ mt: 2 }}
                  >
                    Submit Review
                  </Button>
                </Box>
              )}
            </TabPanel>
            
            <TabPanel value={tabValue} index={2}>
              <Typography variant="h6" gutterBottom>
                Shipping Information
              </Typography>
              <Typography variant="body1" paragraph>
                For physical products, shipping takes 3-5 business days. For digital products and event tickets, delivery is immediate via email.
              </Typography>
              
              <Typography variant="h6" gutterBottom>
                Return Policy
              </Typography>
              <Typography variant="body1">
                Returns are accepted within 30 days of purchase for physical products. Digital products and event tickets are non-refundable unless the event is cancelled.
              </Typography>
            </TabPanel>
          </Paper>
        </Box>
      </Box>
    </Container>
  );
};

export default ProductDetailsScreen; 