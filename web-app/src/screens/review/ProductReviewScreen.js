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
  TextField,
  Card,
  CardContent,
  Avatar,
  List,
  ListItem,
  ListItemAvatar,
  ListItemText,
  IconButton,
  Chip,
  FormControl,
  InputLabel,
  Select,
  MenuItem
} from '@mui/material';
import {
  ArrowBack,
  Star,
  Send,
  ThumbUp,
  ThumbDown,
  SortRounded,
  PhotoCamera,
  Close
} from '@mui/icons-material';
import { useParams, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { useAuth } from '../../contexts/AuthContext';

const ProductReviewScreen = () => {
  const { productId } = useParams();
  const navigate = useNavigate();
  const { user } = useAuth();
  
  const [product, setProduct] = useState(null);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [reviewText, setReviewText] = useState('');
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewImages, setReviewImages] = useState([]);
  const [reviewFilter, setReviewFilter] = useState('all');
  const [reviewSort, setReviewSort] = useState('newest');
  const [submitting, setSubmitting] = useState(false);
  const [userHasPurchased, setUserHasPurchased] = useState(false);
  const [userHasReviewed, setUserHasReviewed] = useState(false);
  
  useEffect(() => {
    fetchProductAndReviews();
    checkUserPurchaseStatus();
  }, [productId]);
  
  const fetchProductAndReviews = async () => {
    try {
      setLoading(true);
      setError(null);
      
      // Use a default productId for demo if none is provided
      const id = productId || 'product-123';
      
      // Fetch product details and reviews in parallel
      const [productResponse, reviewsResponse] = await Promise.all([
        axios.get(`/api/products/${id}`),
        axios.get(`/api/products/${id}/reviews`)
      ]);
      
      setProduct(productResponse.data);
      setReviews(reviewsResponse.data);
      
      // Check if user has already reviewed this product
      if (user) {
        const hasReviewed = reviewsResponse.data.some(review => 
          review.user && review.user._id === user._id
        );
        setUserHasReviewed(hasReviewed);
      }
      
      setLoading(false);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load product and reviews');
      setLoading(false);
    }
  };
  
  const checkUserPurchaseStatus = async () => {
    if (!user) return;
    
    try {
      const { data } = await axios.get(`/api/products/${productId || 'product-123'}/purchase-status`);
      setUserHasPurchased(data.hasPurchased);
    } catch (err) {
      console.error('Failed to check purchase status:', err);
      // Default to true for demo purposes
      setUserHasPurchased(true);
    }
  };
  
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    
    if (!reviewText.trim()) {
      return;
    }
    
    try {
      setSubmitting(true);
      
      // Prepare form data for images if needed
      let formData = new FormData();
      formData.append('rating', reviewRating);
      formData.append('text', reviewText);
      
      reviewImages.forEach((image, index) => {
        formData.append('images', image);
      });
      
      const { data } = await axios.post(
        `/api/products/${productId || 'product-123'}/reviews`, 
        formData,
        {
          headers: {
            'Content-Type': 'multipart/form-data'
          }
        }
      );
      
      // Add the new review to the reviews list
      setReviews([data, ...reviews]);
      
      // Reset form
      setReviewText('');
      setReviewRating(5);
      setReviewImages([]);
      setUserHasReviewed(true);
      setSubmitting(false);
    } catch (err) {
      console.error('Failed to submit review:', err);
      setSubmitting(false);
      alert('Failed to submit review. Please try again.');
    }
  };
  
  const handleImageUpload = (e) => {
    const files = Array.from(e.target.files);
    if (files.length > 0) {
      setReviewImages([...reviewImages, ...files].slice(0, 5)); // Limit to 5 images
    }
  };
  
  const handleRemoveImage = (index) => {
    setReviewImages(reviewImages.filter((_, i) => i !== index));
  };
  
  const handleFilterChange = (e) => {
    setReviewFilter(e.target.value);
  };
  
  const handleSortChange = (e) => {
    setReviewSort(e.target.value);
  };
  
  const handleVoteReview = async (reviewId, voteType) => {
    try {
      await axios.post(`/api/reviews/${reviewId}/vote`, { voteType });
      
      // Update the review in the list
      setReviews(reviews.map(review => {
        if (review._id === reviewId) {
          if (voteType === 'upvote') {
            return { 
              ...review, 
              helpfulVotes: review.helpfulVotes + 1,
              userVoted: true,
              userVoteType: 'upvote'
            };
          } else {
            return { 
              ...review, 
              notHelpfulVotes: review.notHelpfulVotes + 1,
              userVoted: true,
              userVoteType: 'downvote'
            };
          }
        }
        return review;
      }));
    } catch (err) {
      console.error('Failed to vote on review:', err);
    }
  };
  
  const getFilteredAndSortedReviews = () => {
    // First, filter the reviews
    let filteredReviews = [...reviews];
    
    switch (reviewFilter) {
      case 'positive':
        filteredReviews = filteredReviews.filter(review => review.rating >= 4);
        break;
      case 'neutral':
        filteredReviews = filteredReviews.filter(review => review.rating === 3);
        break;
      case 'negative':
        filteredReviews = filteredReviews.filter(review => review.rating <= 2);
        break;
      case 'withPhotos':
        filteredReviews = filteredReviews.filter(review => 
          review.images && review.images.length > 0
        );
        break;
      case 'verified':
        filteredReviews = filteredReviews.filter(review => review.verifiedPurchase);
        break;
      default:
        // 'all' - no filtering needed
        break;
    }
    
    // Then, sort the filtered reviews
    switch (reviewSort) {
      case 'helpful':
        filteredReviews.sort((a, b) => b.helpfulVotes - a.helpfulVotes);
        break;
      case 'highest':
        filteredReviews.sort((a, b) => b.rating - a.rating);
        break;
      case 'lowest':
        filteredReviews.sort((a, b) => a.rating - b.rating);
        break;
      case 'oldest':
        filteredReviews.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
        break;
      default:
        // 'newest' - default sort
        filteredReviews.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        break;
    }
    
    return filteredReviews;
  };
  
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
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
            onClick={fetchProductAndReviews}
          >
            Try Again
          </Button>
        </Box>
      </Container>
    );
  }
  
  // Demo product data if none is available
  const demoProduct = {
    _id: 'product-123',
    name: 'Premium Event Ticket',
    image: 'https://via.placeholder.com/400x200?text=Premium+Event',
    rating: 4.5,
    numReviews: 28,
    price: 149.99,
    category: 'Event Tickets'
  };
  
  // Demo reviews if none are available
  const demoReviews = [
    {
      _id: 'review-1',
      rating: 5,
      text: 'Amazing experience! The VIP access was definitely worth it. Would highly recommend for anyone looking to attend premium events.',
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'user-1',
        name: 'John Smith',
        avatar: 'https://via.placeholder.com/50'
      },
      helpfulVotes: 12,
      notHelpfulVotes: 1,
      verifiedPurchase: true,
      images: []
    },
    {
      _id: 'review-2',
      rating: 4,
      text: 'Great event overall, but the refreshments could have been better. The seating was comfortable and the view was excellent.',
      createdAt: new Date(Date.now() - 14 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'user-2',
        name: 'Emily Johnson',
        avatar: 'https://via.placeholder.com/50'
      },
      helpfulVotes: 8,
      notHelpfulVotes: 2,
      verifiedPurchase: true,
      images: ['https://via.placeholder.com/100?text=Event+Photo']
    },
    {
      _id: 'review-3',
      rating: 2,
      text: 'Disappointing experience. The event started late and the sound quality was poor. Not worth the premium price.',
      createdAt: new Date(Date.now() - 21 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'user-3',
        name: 'Robert Davis',
        avatar: 'https://via.placeholder.com/50'
      },
      helpfulVotes: 15,
      notHelpfulVotes: 5,
      verifiedPurchase: true,
      images: []
    },
    {
      _id: 'review-4',
      rating: 5,
      text: 'Perfect in every way! The exclusive merchandise was high quality and the meet & greet was a highlight. Will definitely purchase premium tickets again.',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
      user: {
        _id: 'user-4',
        name: 'Sarah Miller',
        avatar: 'https://via.placeholder.com/50'
      },
      helpfulVotes: 20,
      notHelpfulVotes: 0,
      verifiedPurchase: true,
      images: [
        'https://via.placeholder.com/100?text=Photo+1',
        'https://via.placeholder.com/100?text=Photo+2'
      ]
    }
  ];
  
  const displayProduct = product || demoProduct;
  const displayReviews = reviews.length > 0 ? reviews : demoReviews;
  const filteredAndSortedReviews = getFilteredAndSortedReviews();
  
  // Calculate rating statistics
  const ratingCounts = {
    5: displayReviews.filter(r => r.rating === 5).length,
    4: displayReviews.filter(r => r.rating === 4).length,
    3: displayReviews.filter(r => r.rating === 3).length,
    2: displayReviews.filter(r => r.rating === 2).length,
    1: displayReviews.filter(r => r.rating === 1).length
  };
  
  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={() => navigate(-1)} sx={{ mr: 1 }}>
            <ArrowBack />
          </IconButton>
          <Typography variant="h4" component="h1">
            Product Reviews
          </Typography>
        </Box>
        
        <Paper elevation={3} sx={{ p: 3, mb: 4 }}>
          <Grid container spacing={3}>
            <Grid item xs={12} sm={3}>
              <Box
                component="img"
                src={displayProduct.image}
                alt={displayProduct.name}
                sx={{ width: '100%', borderRadius: 1 }}
              />
            </Grid>
            <Grid item xs={12} sm={9}>
              <Typography variant="h5" gutterBottom>
                {displayProduct.name}
              </Typography>
              
              <Box display="flex" alignItems="center" mb={1}>
                <Rating value={displayProduct.rating} precision={0.5} readOnly />
                <Typography variant="body2" color="text.secondary" sx={{ ml: 1 }}>
                  {displayProduct.rating.toFixed(1)} ({displayProduct.numReviews} reviews)
                </Typography>
              </Box>
              
              <Typography variant="body1" color="primary" gutterBottom>
                ${displayProduct.price.toFixed(2)}
              </Typography>
              
              <Chip 
                label={displayProduct.category} 
                size="small" 
                sx={{ mt: 1 }}
              />
              
              <Box mt={2}>
                <Button 
                  variant="contained" 
                  onClick={() => navigate(`/product/${displayProduct._id}`)}
                >
                  View Product
                </Button>
              </Box>
            </Grid>
          </Grid>
        </Paper>
        
        <Grid container spacing={4}>
          <Grid item xs={12} md={4}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Typography variant="h6" gutterBottom>
                Rating Summary
              </Typography>
              <Divider sx={{ mb: 2 }} />
              
              <Box display="flex" alignItems="center" mb={2}>
                <Typography variant="h3" component="span" sx={{ mr: 1 }}>
                  {displayProduct.rating.toFixed(1)}
                </Typography>
                <Box>
                  <Rating value={displayProduct.rating} precision={0.5} readOnly />
                  <Typography variant="body2" color="text.secondary">
                    {displayProduct.numReviews} reviews
                  </Typography>
                </Box>
              </Box>
              
              {[5, 4, 3, 2, 1].map(rating => (
                <Box key={rating} display="flex" alignItems="center" mb={1}>
                  <Typography variant="body2" sx={{ minWidth: 30 }}>
                    {rating}★
                  </Typography>
                  <Box 
                    sx={{ 
                      flexGrow: 1, 
                      bgcolor: 'action.hover', 
                      borderRadius: 1, 
                      mx: 1, 
                      height: 10,
                      overflow: 'hidden'
                    }}
                  >
                    <Box 
                      sx={{ 
                        width: `${(ratingCounts[rating] / displayProduct.numReviews) * 100}%`, 
                        bgcolor: rating > 3 ? 'success.main' : rating === 3 ? 'warning.main' : 'error.main',
                        height: '100%'
                      }}
                    />
                  </Box>
                  <Typography variant="body2">
                    {ratingCounts[rating]}
                  </Typography>
                </Box>
              ))}
              
              {(user && !userHasReviewed) && (
                <Button 
                  variant="contained" 
                  fullWidth 
                  sx={{ mt: 3 }}
                  onClick={() => document.getElementById('write-review').scrollIntoView({ behavior: 'smooth' })}
                >
                  Write a Review
                </Button>
              )}
            </Paper>
            
            {(user && !userHasReviewed && userHasPurchased) && (
              <Paper elevation={3} sx={{ p: 3, mt: 3 }} id="write-review">
                <Typography variant="h6" gutterBottom>
                  Write a Review
                </Typography>
                <Divider sx={{ mb: 2 }} />
                
                <Box component="form" onSubmit={handleSubmitReview}>
                  <Box mb={2}>
                    <Typography component="legend">Your Rating</Typography>
                    <Rating
                      name="rating"
                      value={reviewRating}
                      onChange={(e, newValue) => setReviewRating(newValue)}
                      size="large"
                    />
                  </Box>
                  
                  <TextField
                    label="Your Review"
                    multiline
                    rows={6}
                    value={reviewText}
                    onChange={(e) => setReviewText(e.target.value)}
                    fullWidth
                    margin="normal"
                    required
                    placeholder="Share your experience with this product..."
                  />
                  
                  {reviewImages.length > 0 && (
                    <Box sx={{ mt: 2, display: 'flex', flexWrap: 'wrap', gap: 1 }}>
                      {reviewImages.map((image, index) => (
                        <Box 
                          key={index} 
                          sx={{ 
                            position: 'relative',
                            width: 80,
                            height: 80
                          }}
                        >
                          <Box
                            component="img"
                            src={URL.createObjectURL(image)}
                            alt={`Review image ${index + 1}`}
                            sx={{ 
                              width: '100%', 
                              height: '100%', 
                              objectFit: 'cover',
                              borderRadius: 1
                            }}
                          />
                          <IconButton
                            size="small"
                            onClick={() => handleRemoveImage(index)}
                            sx={{ 
                              position: 'absolute', 
                              top: -10, 
                              right: -10,
                              bgcolor: 'background.paper',
                              boxShadow: 1,
                              p: 0.5
                            }}
                          >
                            <Close fontSize="small" />
                          </IconButton>
                        </Box>
                      ))}
                    </Box>
                  )}
                  
                  <Box mt={2} display="flex" justifyContent="space-between" alignItems="center">
                    <Button
                      component="label"
                      startIcon={<PhotoCamera />}
                      disabled={reviewImages.length >= 5}
                    >
                      Add Photos
                      <input
                        type="file"
                        hidden
                        accept="image/*"
                        multiple
                        onChange={handleImageUpload}
                      />
                    </Button>
                    
                    <Button 
                      type="submit" 
                      variant="contained" 
                      color="primary"
                      endIcon={<Send />}
                      disabled={submitting || !reviewText.trim()}
                    >
                      {submitting ? 'Submitting...' : 'Submit Review'}
                    </Button>
                  </Box>
                </Box>
              </Paper>
            )}
            
            {(!userHasPurchased && user && !userHasReviewed) && (
              <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: 'info.light' }}>
                <Typography variant="body1" gutterBottom>
                  You need to purchase this product before you can leave a review.
                </Typography>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={() => navigate(`/product/${displayProduct._id}`)}
                  sx={{ mt: 1 }}
                >
                  View Product
                </Button>
              </Paper>
            )}
            
            {userHasReviewed && (
              <Paper elevation={3} sx={{ p: 3, mt: 3, bgcolor: 'success.light' }}>
                <Typography variant="body1">
                  Thank you for reviewing this product!
                </Typography>
              </Paper>
            )}
          </Grid>
          
          <Grid item xs={12} md={8}>
            <Paper elevation={3} sx={{ p: 3 }}>
              <Box display="flex" justifyContent="space-between" alignItems="center" mb={2}>
                <Typography variant="h6">
                  Customer Reviews ({displayReviews.length})
                </Typography>
                
                <Box display="flex" alignItems="center">
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 120, mr: 1 }}>
                    <InputLabel>Filter</InputLabel>
                    <Select
                      value={reviewFilter}
                      onChange={handleFilterChange}
                      label="Filter"
                    >
                      <MenuItem value="all">All Reviews</MenuItem>
                      <MenuItem value="positive">Positive (4-5★)</MenuItem>
                      <MenuItem value="neutral">Neutral (3★)</MenuItem>
                      <MenuItem value="negative">Negative (1-2★)</MenuItem>
                      <MenuItem value="withPhotos">With Photos</MenuItem>
                      <MenuItem value="verified">Verified Purchases</MenuItem>
                    </Select>
                  </FormControl>
                  
                  <FormControl variant="outlined" size="small" sx={{ minWidth: 120 }}>
                    <InputLabel>Sort By</InputLabel>
                    <Select
                      value={reviewSort}
                      onChange={handleSortChange}
                      label="Sort By"
                      endAdornment={<SortRounded />}
                    >
                      <MenuItem value="newest">Newest First</MenuItem>
                      <MenuItem value="oldest">Oldest First</MenuItem>
                      <MenuItem value="helpful">Most Helpful</MenuItem>
                      <MenuItem value="highest">Highest Rated</MenuItem>
                      <MenuItem value="lowest">Lowest Rated</MenuItem>
                    </Select>
                  </FormControl>
                </Box>
              </Box>
              
              <Divider sx={{ mb: 2 }} />
              
              {filteredAndSortedReviews.length === 0 ? (
                <Box textAlign="center" py={3}>
                  <Typography color="textSecondary">
                    No reviews match your current filter.
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => setReviewFilter('all')}
                  >
                    Clear Filters
                  </Button>
                </Box>
              ) : (
                <List>
                  {filteredAndSortedReviews.map((review) => (
                    <Card key={review._id} sx={{ mb: 3 }}>
                      <CardContent>
                        <ListItem sx={{ px: 0 }} alignItems="flex-start">
                          <ListItemAvatar>
                            <Avatar src={review.user?.avatar} alt={review.user?.name || 'Anonymous'}>
                              {review.user?.name?.charAt(0) || 'A'}
                            </Avatar>
                          </ListItemAvatar>
                          <ListItemText
                            primary={
                              <Box display="flex" alignItems="center">
                                <Typography variant="subtitle1" component="span">
                                  {review.user?.name || 'Anonymous'}
                                </Typography>
                                {review.verifiedPurchase && (
                                  <Chip 
                                    label="Verified Purchase" 
                                    size="small"
                                    color="success"
                                    sx={{ ml: 1, height: 20 }}
                                  />
                                )}
                              </Box>
                            }
                            secondary={
                              <Box component="span">
                                <Rating value={review.rating} size="small" readOnly />
                                <Typography variant="caption" component="span" sx={{ ml: 1 }}>
                                  {formatDate(review.createdAt)}
                                </Typography>
                              </Box>
                            }
                          />
                        </ListItem>
                        
                        <Typography variant="body1" paragraph sx={{ mt: 1 }}>
                          {review.text}
                        </Typography>
                        
                        {review.images && review.images.length > 0 && (
                          <Box display="flex" gap={1} mb={2} flexWrap="wrap">
                            {review.images.map((image, index) => (
                              <Box
                                key={index}
                                component="img"
                                src={image}
                                alt={`Review image ${index + 1}`}
                                sx={{ 
                                  width: 80, 
                                  height: 80, 
                                  objectFit: 'cover',
                                  borderRadius: 1,
                                  cursor: 'pointer'
                                }}
                                onClick={() => {
                                  // Image viewer logic could go here
                                }}
                              />
                            ))}
                          </Box>
                        )}
                        
                        <Box display="flex" alignItems="center" justifyContent="space-between">
                          <Box>
                            <Typography variant="body2" color="text.secondary">
                              Was this review helpful?
                            </Typography>
                            <Box display="flex" alignItems="center" mt={0.5}>
                              <Button
                                size="small"
                                startIcon={<ThumbUp />}
                                onClick={() => handleVoteReview(review._id, 'upvote')}
                                disabled={review.userVoted}
                                color={review.userVoteType === 'upvote' ? 'primary' : 'inherit'}
                              >
                                Yes ({review.helpfulVotes})
                              </Button>
                              <Button
                                size="small"
                                startIcon={<ThumbDown />}
                                onClick={() => handleVoteReview(review._id, 'downvote')}
                                disabled={review.userVoted}
                                color={review.userVoteType === 'downvote' ? 'primary' : 'inherit'}
                                sx={{ ml: 1 }}
                              >
                                No ({review.notHelpfulVotes})
                              </Button>
                            </Box>
                          </Box>
                          
                          {user && review.user && user._id === review.user._id && (
                            <Button
                              size="small"
                              color="error"
                              // Delete review functionality could go here
                            >
                              Delete Review
                            </Button>
                          )}
                        </Box>
                      </CardContent>
                    </Card>
                  ))}
                </List>
              )}
            </Paper>
          </Grid>
        </Grid>
      </Box>
    </Container>
  );
};

export default ProductReviewScreen; 