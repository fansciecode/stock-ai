import React, { useState, useEffect } from 'react';
import {
  Container,
  Typography,
  Box,
  Grid,
  Card,
  CardContent,
  CardMedia,
  Button,
  CircularProgress,
  TextField,
  InputAdornment,
  IconButton,
  Chip,
  Paper
} from '@mui/material';
import {
  Search as SearchIcon,
  ArrowBack as ArrowBackIcon,
  MusicNote,
  LocalMovies,
  Restaurant,
  SportsBasketball,
  Celebration,
  School,
  BusinessCenter,
  ChildCare,
  HealthAndSafety,
  EmojiEvents,
  Theaters,
  Brush
} from '@mui/icons-material';
import { useNavigate, useLocation } from 'react-router-dom';
import axios from 'axios';

const CategorySelectionScreen = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [categories, setCategories] = useState([]);
  const [popularCategories, setPopularCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategories, setSelectedCategories] = useState([]);

  // Check if we have a return path
  const returnPath = new URLSearchParams(location.search).get('returnTo') || '/events';
  const multiSelect = new URLSearchParams(location.search).get('multi') === 'true';
  
  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const { data } = await axios.get('/api/categories');
      setCategories(data);
      
      // Get popular categories
      const popularData = await axios.get('/api/categories/popular');
      setPopularCategories(popularData.data);
      
      setLoading(false);
    } catch (err) {
      console.error('Failed to fetch categories:', err);
      // For demo, use mock data
      setCategories(getCategoryIcons(demoCategories));
      setPopularCategories(getCategoryIcons(demoPopularCategories));
      setLoading(false);
    }
  };

  const handleCategorySelect = (category) => {
    if (multiSelect) {
      if (selectedCategories.some(cat => cat._id === category._id)) {
        setSelectedCategories(selectedCategories.filter(cat => cat._id !== category._id));
      } else {
        setSelectedCategories([...selectedCategories, category]);
      }
    } else {
      // Return to the previous screen with the selected category
      navigate(`${returnPath}?category=${category._id}`);
    }
  };

  const handleApplyFilters = () => {
    if (selectedCategories.length > 0) {
      const categoryIds = selectedCategories.map(cat => cat._id).join(',');
      navigate(`${returnPath}?categories=${categoryIds}`);
    } else {
      navigate(returnPath);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const getCategoryIcon = (categoryName) => {
    const name = categoryName.toLowerCase();
    if (name.includes('music')) return <MusicNote />;
    if (name.includes('movie') || name.includes('film')) return <LocalMovies />;
    if (name.includes('food') || name.includes('culinary')) return <Restaurant />;
    if (name.includes('sport')) return <SportsBasketball />;
    if (name.includes('party') || name.includes('festival')) return <Celebration />;
    if (name.includes('education') || name.includes('workshop')) return <School />;
    if (name.includes('business') || name.includes('career')) return <BusinessCenter />;
    if (name.includes('family') || name.includes('kids')) return <ChildCare />;
    if (name.includes('health') || name.includes('wellness')) return <HealthAndSafety />;
    if (name.includes('competition')) return <EmojiEvents />;
    if (name.includes('performance') || name.includes('theater')) return <Theaters />;
    if (name.includes('art')) return <Brush />;
    return <Celebration />;
  };

  // Add icons to categories
  const getCategoryIcons = (categoryList) => {
    return categoryList.map(category => ({
      ...category,
      icon: getCategoryIcon(category.name)
    }));
  };

  // Filter categories based on search query
  const filteredCategories = searchQuery 
    ? categories.filter(category => 
        category.name.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : categories;

  // Demo data
  const demoCategories = [
    { _id: 'cat1', name: 'Music Concerts', count: 156 },
    { _id: 'cat2', name: 'Food & Drink Festivals', count: 98 },
    { _id: 'cat3', name: 'Sports Events', count: 87 },
    { _id: 'cat4', name: 'Art Exhibitions', count: 75 },
    { _id: 'cat5', name: 'Business Conferences', count: 64 },
    { _id: 'cat6', name: 'Workshops & Classes', count: 59 },
    { _id: 'cat7', name: 'Family & Kids', count: 47 },
    { _id: 'cat8', name: 'Theater & Performance', count: 42 },
    { _id: 'cat9', name: 'Health & Wellness', count: 38 },
    { _id: 'cat10', name: 'Film Screenings', count: 35 },
    { _id: 'cat11', name: 'Charity & Fundraisers', count: 29 },
    { _id: 'cat12', name: 'Parties & Nightlife', count: 27 }
  ];

  const demoPopularCategories = [
    { _id: 'cat1', name: 'Music Concerts', count: 156 },
    { _id: 'cat2', name: 'Food & Drink Festivals', count: 98 },
    { _id: 'cat3', name: 'Sports Events', count: 87 },
    { _id: 'cat8', name: 'Theater & Performance', count: 42 }
  ];

  return (
    <Container maxWidth="lg">
      <Box my={4}>
        <Box display="flex" alignItems="center" mb={3}>
          <IconButton onClick={handleBack} sx={{ mr: 1 }}>
            <ArrowBackIcon />
          </IconButton>
          <Typography variant="h4" component="h1">
            Event Categories
          </Typography>
        </Box>

        <Box mb={4}>
          <TextField
            fullWidth
            placeholder="Search categories..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchIcon />
                </InputAdornment>
              ),
            }}
            variant="outlined"
          />
        </Box>

        {loading ? (
          <Box display="flex" justifyContent="center" my={6}>
            <CircularProgress />
          </Box>
        ) : (
          <>
            {searchQuery === '' && (
              <Box mb={6}>
                <Typography variant="h5" gutterBottom>
                  Popular Categories
                </Typography>
                <Grid container spacing={2} mb={4}>
                  {popularCategories.map((category) => (
                    <Grid item xs={6} sm={4} md={3} key={category._id}>
                      <Card 
                        elevation={2}
                        onClick={() => handleCategorySelect(category)}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: 6
                          },
                          bgcolor: selectedCategories.some(cat => cat._id === category._id) 
                            ? 'primary.light' 
                            : 'background.paper'
                        }}
                      >
                        <Box 
                          display="flex" 
                          flexDirection="column" 
                          alignItems="center"
                          p={2}
                        >
                          <Box 
                            sx={{ 
                              color: 'primary.main',
                              fontSize: '2.5rem',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              mb: 1
                            }}
                          >
                            {category.icon}
                          </Box>
                          <Typography 
                            variant="subtitle1" 
                            align="center"
                            fontWeight="medium"
                          >
                            {category.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            align="center"
                          >
                            {category.count} events
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              </Box>
            )}

            <Box>
              <Typography variant="h5" gutterBottom>
                {searchQuery ? 'Search Results' : 'All Categories'}
              </Typography>
              
              {filteredCategories.length === 0 ? (
                <Paper elevation={0} variant="outlined" sx={{ p: 3, textAlign: 'center' }}>
                  <Typography variant="body1">
                    No categories found matching "{searchQuery}"
                  </Typography>
                  <Button 
                    variant="outlined" 
                    sx={{ mt: 2 }}
                    onClick={() => setSearchQuery('')}
                  >
                    Clear Search
                  </Button>
                </Paper>
              ) : (
                <Grid container spacing={2}>
                  {filteredCategories.map((category) => (
                    <Grid item xs={6} sm={4} md={3} lg={2} key={category._id}>
                      <Card 
                        elevation={1}
                        onClick={() => handleCategorySelect(category)}
                        sx={{ 
                          cursor: 'pointer',
                          transition: 'transform 0.2s',
                          '&:hover': {
                            transform: 'scale(1.03)',
                            boxShadow: 3
                          },
                          bgcolor: selectedCategories.some(cat => cat._id === category._id) 
                            ? 'primary.light' 
                            : 'background.paper'
                        }}
                      >
                        <Box 
                          display="flex" 
                          flexDirection="column" 
                          alignItems="center"
                          p={2}
                        >
                          <Box 
                            sx={{ 
                              color: 'primary.main',
                              fontSize: '2rem',
                              display: 'flex',
                              justifyContent: 'center',
                              alignItems: 'center',
                              mb: 1
                            }}
                          >
                            {category.icon}
                          </Box>
                          <Typography 
                            variant="body1" 
                            align="center"
                            fontWeight="medium"
                          >
                            {category.name}
                          </Typography>
                          <Typography 
                            variant="body2" 
                            color="text.secondary"
                            align="center"
                          >
                            {category.count} events
                          </Typography>
                        </Box>
                      </Card>
                    </Grid>
                  ))}
                </Grid>
              )}
            </Box>
            
            {multiSelect && (
              <Box mt={4} display="flex" justifyContent="space-between" alignItems="center">
                <Box>
                  {selectedCategories.length > 0 && (
                    <Box display="flex" flexWrap="wrap" gap={1}>
                      {selectedCategories.map(category => (
                        <Chip 
                          key={category._id}
                          label={category.name}
                          onDelete={() => handleCategorySelect(category)}
                          color="primary"
                        />
                      ))}
                    </Box>
                  )}
                </Box>
                <Button 
                  variant="contained" 
                  color="primary"
                  onClick={handleApplyFilters}
                  disabled={selectedCategories.length === 0}
                >
                  Apply Filters
                </Button>
              </Box>
            )}
          </>
        )}
      </Box>
    </Container>
  );
};

export default CategorySelectionScreen; 