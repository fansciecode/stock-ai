import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Container,
  Typography,
  Box,
  Card,
  CardContent,
  CardMedia,
  Button,
  Grid,
  IconButton,
  CircularProgress,
  Alert,
  Chip,
  TextField,
  FormControl,
  InputLabel,
  Select,
  MenuItem,
  Pagination,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  DialogContentText,
  Paper,
  Divider,
  List,
  ListItem,
  ListItemText
} from '@mui/material';
import {
  ArrowBack,
  Search,
  LocationOn,
  DateRange,
  Category,
  AttachMoney,
  Person,
  Event,
  FilterList,
  Refresh,
  BookmarkBorder,
  Share,
  Phone,
  Email
} from '@mui/icons-material';
import { externalEventService } from '../../services/ExternalEventService';
import './ExternalEventScreen.css';

const ExternalEventScreen = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // State
  const [events, setEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedEvent, setSelectedEvent] = useState(null);
  const [registrationDialog, setRegistrationDialog] = useState(false);
  const [registrationData, setRegistrationData] = useState({
    name: '',
    email: '',
    phone: '',
    numberOfTickets: 1
  });
  const [registrationStatus, setRegistrationStatus] = useState('NONE');

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedLocation, setSelectedLocation] = useState('');
  const [selectedDate, setSelectedDate] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  useEffect(() => {
    loadInitialData();
  }, []);

  useEffect(() => {
    loadEvents();
  }, [selectedCategory, selectedLocation, selectedDate, currentPage]);

  const loadInitialData = async () => {
    try {
      setLoading(true);

      // Load categories
      const categoriesData = await externalEventService.getCategories();
      setCategories(categoriesData);

      // Load initial events
      await loadEvents();
    } catch (err) {
      setError(err.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const loadEvents = async (page = currentPage) => {
    try {
      setLoading(true);
      setError(null);

      const params = {
        category: selectedCategory || undefined,
        location: selectedLocation || undefined,
        date: selectedDate || undefined,
        page: page,
        query: searchQuery || undefined
      };

      const response = await externalEventService.getExternalEvents(params);

      if (page === 1) {
        setEvents(response.events);
      } else {
        setEvents(prev => [...prev, ...response.events]);
      }

      setCurrentPage(response.currentPage);
      setTotalPages(response.totalPages);
    } catch (err) {
      setError(err.message || 'Failed to load events');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = () => {
    setCurrentPage(1);
    loadEvents(1);
  };

  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setCurrentPage(1);
  };

  const handleLocationChange = (location) => {
    setSelectedLocation(location);
    setCurrentPage(1);
  };

  const handleDateChange = (date) => {
    setSelectedDate(date);
    setCurrentPage(1);
  };

  const handlePageChange = (event, page) => {
    setCurrentPage(page);
    loadEvents(page);
  };

  const handleEventSelect = async (event) => {
    try {
      const eventDetails = await externalEventService.getExternalEventDetails('external', event.id);
      setSelectedEvent(eventDetails.data);
    } catch (err) {
      console.error('Failed to load event details:', err);
      setSelectedEvent(event);
    }
  };

  const handleRegistration = () => {
    if (!selectedEvent) return;
    setRegistrationDialog(true);
  };

  const handleRegistrationSubmit = async () => {
    try {
      setRegistrationStatus('IN_PROGRESS');

      const request = {
        name: registrationData.name,
        email: registrationData.email,
        phone: registrationData.phone,
        numberOfTickets: registrationData.numberOfTickets
      };

      const response = await externalEventService.registerForEvent(selectedEvent.id, request);

      if (response.success) {
        setRegistrationStatus('SUCCESS');
        setRegistrationDialog(false);
        alert(`Registration successful! Confirmation code: ${response.data.confirmationCode}`);
      } else {
        setRegistrationStatus('ERROR');
        alert('Registration failed. Please try again.');
      }
    } catch (err) {
      setRegistrationStatus('ERROR');
      alert('Registration failed: ' + err.message);
    }
  };

  const handleBack = () => {
    navigate(-1);
  };

  const clearFilters = () => {
    setSelectedCategory('');
    setSelectedLocation('');
    setSelectedDate('');
    setSearchQuery('');
    setCurrentPage(1);
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Date not specified';
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
      });
    } catch (error) {
      return dateString;
    }
  };

  const formatPrice = (price) => {
    if (!price || price === 0) return 'Free';
    return `$${price.toFixed(2)}`;
  };

  if (loading && events.length === 0) {
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

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box display="flex" alignItems="center" mb={4}>
        <IconButton onClick={handleBack} sx={{ mr: 1 }}>
          <ArrowBack />
        </IconButton>
        <Typography variant="h4" component="h1" fontWeight="bold">
          External Events
        </Typography>
      </Box>

      {/* Search and Filters */}
      <Paper elevation={2} sx={{ p: 3, mb: 3 }}>
        <Grid container spacing={3}>
          {/* Search */}
          <Grid item xs={12} md={6}>
            <TextField
              fullWidth
              label="Search events..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              InputProps={{
                startAdornment: <Search sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          {/* Search Button */}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="contained"
              onClick={handleSearch}
              sx={{ height: 56 }}
            >
              Search
            </Button>
          </Grid>

          {/* Clear Filters */}
          <Grid item xs={12} md={2}>
            <Button
              fullWidth
              variant="outlined"
              onClick={clearFilters}
              sx={{ height: 56 }}
              startIcon={<Refresh />}
            >
              Clear
            </Button>
          </Grid>

          {/* Categories */}
          <Grid item xs={12} md={4}>
            <FormControl fullWidth>
              <InputLabel>Category</InputLabel>
              <Select
                value={selectedCategory}
                onChange={(e) => handleCategoryChange(e.target.value)}
                label="Category"
              >
                <MenuItem value="">All Categories</MenuItem>
                {categories.map((category) => (
                  <MenuItem key={category.id} value={category.id}>
                    {category.name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Grid>

          {/* Location */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Location"
              value={selectedLocation}
              onChange={(e) => handleLocationChange(e.target.value)}
              InputProps={{
                startAdornment: <LocationOn sx={{ mr: 1, color: 'text.secondary' }} />
              }}
            />
          </Grid>

          {/* Date */}
          <Grid item xs={12} md={4}>
            <TextField
              fullWidth
              label="Date"
              type="date"
              value={selectedDate}
              onChange={(e) => handleDateChange(e.target.value)}
              InputLabelProps={{
                shrink: true,
              }}
            />
          </Grid>
        </Grid>
      </Paper>

      {/* Error */}
      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {/* Events Grid */}
      <Grid container spacing={3}>
        {events.map((event) => (
          <Grid item xs={12} md={6} lg={4} key={event.id}>
            <Card
              sx={{
                height: '100%',
                display: 'flex',
                flexDirection: 'column',
                transition: 'transform 0.2s, box-shadow 0.2s',
                '&:hover': {
                  transform: 'translateY(-4px)',
                  boxShadow: 6
                }
              }}
            >
              {/* Event Image */}
              {event.imageUrl && (
                <CardMedia
                  component="img"
                  height="200"
                  image={event.imageUrl}
                  alt={event.title}
                />
              )}

              <CardContent sx={{ flexGrow: 1 }}>
                {/* Event Title */}
                <Typography variant="h6" component="h2" gutterBottom fontWeight="bold">
                  {event.title}
                </Typography>

                {/* Event Description */}
                <Typography
                  variant="body2"
                  color="text.secondary"
                  paragraph
                  sx={{
                    display: '-webkit-box',
                    WebkitLineClamp: 3,
                    WebkitBoxOrient: 'vertical',
                    overflow: 'hidden'
                  }}
                >
                  {event.description}
                </Typography>

                {/* Event Details */}
                <Box mb={2}>
                  <Box display="flex" alignItems="center" mb={1}>
                    <DateRange sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatDate(event.date)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <LocationOn sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.location?.address || 'Location not specified'}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center" mb={1}>
                    <AttachMoney sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {formatPrice(event.price)}
                    </Typography>
                  </Box>

                  <Box display="flex" alignItems="center">
                    <Person sx={{ mr: 1, fontSize: 16, color: 'text.secondary' }} />
                    <Typography variant="body2" color="text.secondary">
                      {event.organizer}
                    </Typography>
                  </Box>
                </Box>

                {/* Category */}
                <Box mb={2}>
                  <Chip
                    label={event.category}
                    color="primary"
                    size="small"
                    variant="outlined"
                  />
                </Box>

                {/* Actions */}
                <Box display="flex" gap={1}>
                  <Button
                    variant="contained"
                    fullWidth
                    onClick={() => handleEventSelect(event)}
                  >
                    View Details
                  </Button>
                  <IconButton
                    onClick={() => {
                      // Handle bookmark
                      console.log('Bookmark event:', event.id);
                    }}
                  >
                    <BookmarkBorder />
                  </IconButton>
                  <IconButton
                    onClick={() => {
                      // Handle share
                      if (navigator.share) {
                        navigator.share({
                          title: event.title,
                          text: event.description,
                          url: window.location.href
                        });
                      }
                    }}
                  >
                    <Share />
                  </IconButton>
                </Box>
              </CardContent>
            </Card>
          </Grid>
        ))}
      </Grid>

      {/* Empty State */}
      {events.length === 0 && !loading && (
        <Box
          display="flex"
          flexDirection="column"
          alignItems="center"
          justifyContent="center"
          minHeight="300px"
        >
          <Event sx={{ fontSize: 64, color: 'text.secondary', mb: 2 }} />
          <Typography variant="h6" color="text.secondary">
            No events found
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Try adjusting your search criteria
          </Typography>
        </Box>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <Box display="flex" justifyContent="center" mt={4}>
          <Pagination
            count={totalPages}
            page={currentPage}
            onChange={handlePageChange}
            color="primary"
            size="large"
          />
        </Box>
      )}

      {/* Event Details Dialog */}
      <Dialog
        open={!!selectedEvent}
        onClose={() => setSelectedEvent(null)}
        maxWidth="md"
        fullWidth
      >
        {selectedEvent && (
          <>
            <DialogTitle>
              <Box display="flex" alignItems="center" justifyContent="space-between">
                <Typography variant="h5" component="h2">
                  {selectedEvent.title}
                </Typography>
                <IconButton onClick={() => setSelectedEvent(null)}>
                  <ArrowBack />
                </IconButton>
              </Box>
            </DialogTitle>

            <DialogContent>
              {selectedEvent.imageUrl && (
                <Box mb={3}>
                  <img
                    src={selectedEvent.imageUrl}
                    alt={selectedEvent.title}
                    style={{
                      width: '100%',
                      height: 200,
                      objectFit: 'cover',
                      borderRadius: 8
                    }}
                  />
                </Box>
              )}

              <Typography variant="body1" paragraph>
                {selectedEvent.description}
              </Typography>

              <Divider sx={{ my: 2 }} />

              <List>
                <ListItem>
                  <DateRange sx={{ mr: 2 }} />
                  <ListItemText
                    primary="Date"
                    secondary={formatDate(selectedEvent.date)}
                  />
                </ListItem>
                <ListItem>
                  <LocationOn sx={{ mr: 2 }} />
                  <ListItemText
                    primary="Location"
                    secondary={selectedEvent.location?.address || 'Location not specified'}
                  />
                </ListItem>
                <ListItem>
                  <AttachMoney sx={{ mr: 2 }} />
                  <ListItemText
                    primary="Price"
                    secondary={formatPrice(selectedEvent.price)}
                  />
                </ListItem>
                <ListItem>
                  <Person sx={{ mr: 2 }} />
                  <ListItemText
                    primary="Organizer"
                    secondary={selectedEvent.organizer}
                  />
                </ListItem>
              </List>
            </DialogContent>

            <DialogActions>
              <Button onClick={() => setSelectedEvent(null)}>
                Close
              </Button>
              <Button
                variant="contained"
                onClick={handleRegistration}
                disabled={registrationStatus === 'IN_PROGRESS'}
              >
                Register
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Registration Dialog */}
      <Dialog
        open={registrationDialog}
        onClose={() => setRegistrationDialog(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>
          Register for Event
        </DialogTitle>
        <DialogContent>
          <DialogContentText sx={{ mb: 3 }}>
            Please fill in your details to register for this event.
          </DialogContentText>

          <Grid container spacing={2}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Full Name"
                value={registrationData.name}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  name: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Email"
                type="email"
                value={registrationData.email}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  email: e.target.value
                })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Phone Number"
                value={registrationData.phone}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  phone: e.target.value
                })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Number of Tickets"
                type="number"
                value={registrationData.numberOfTickets}
                onChange={(e) => setRegistrationData({
                  ...registrationData,
                  numberOfTickets: parseInt(e.target.value) || 1
                })}
                inputProps={{ min: 1 }}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setRegistrationDialog(false)}>
            Cancel
          </Button>
          <Button
            onClick={handleRegistrationSubmit}
            variant="contained"
            disabled={
              registrationStatus === 'IN_PROGRESS' ||
              !registrationData.name ||
              !registrationData.email
            }
          >
            {registrationStatus === 'IN_PROGRESS' ? 'Registering...' : 'Register'}
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
};

export default ExternalEventScreen;
