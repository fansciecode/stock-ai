import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import './Home.css';

// Services
import EventService from '../../services/eventService';
import CategoryService from '../../services/categoryService';
import { useAuth } from '../../contexts/AuthContext';

// Components
import EventCard from '../../components/EventCard';
import CategoryItem from '../../components/CategoryItem';
import MapView from '../../components/MapView';
import SearchBar from '../../components/SearchBar';
import LoadingSpinner from '../../components/LoadingSpinner';

const Home = () => {
  // Navigation
  const navigate = useNavigate();
  const { isAuthenticated, user } = useAuth();

  // State
  const [events, setEvents] = useState([]);
  const [filteredEvents, setFilteredEvents] = useState([]);
  const [categories, setCategories] = useState([]);
  const [selectedCategories, setSelectedCategories] = useState([]);
  const [userLocation, setUserLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [isMapView, setIsMapView] = useState(false);
  const [showCategoriesAsGrid, setShowCategoriesAsGrid] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Modals
  const [showLoginPrompt, setShowLoginPrompt] = useState(false);
  const [showVerificationPrompt, setShowVerificationPrompt] = useState(false);
  const [showCategorySelectionPrompt, setShowCategorySelectionPrompt] = useState(false);
  const [showLocationPrompt, setShowLocationPrompt] = useState(false);

  // Services
  const eventService = new EventService();

  // Effects
  useEffect(() => {
    loadInitialData();
    checkLocationPermission();
  }, []);

  useEffect(() => {
    updateFilteredEvents();
  }, [events, selectedCategories, searchQuery]);

  // Functions
  const loadInitialData = async () => {
    setIsLoading(true);
    setErrorMessage(null);

    try {
      // Load categories
      const categoriesData = await CategoryService.getCategories();
      setCategories(categoriesData);

      // Load events
      const eventsData = await eventService.getEvents();
      setEvents(eventsData);
      setFilteredEvents(eventsData);
    } catch (error) {
      setErrorMessage('Failed to load data. Please try again.');
      console.error('Error loading data:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const checkLocationPermission = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          const { latitude, longitude } = position.coords;
          setUserLocation({ latitude, longitude });
          calculateEventDistances({ latitude, longitude });
        },
        (error) => {
          console.error('Error getting location:', error);
          setShowLocationPrompt(true);
        }
      );
    } else {
      setErrorMessage('Geolocation is not supported by this browser.');
    }
  };

  const calculateEventDistances = (location) => {
    if (!location || events.length === 0) return;

    const eventsWithDistance = events.map(event => {
      if (event.location && event.location.coordinates) {
        const distance = getDistanceFromLatLonInKm(
          location.latitude,
          location.longitude,
          event.location.coordinates[1],
          event.location.coordinates[0]
        );
        return { ...event, distance };
      }
      return event;
    });

    // Sort events by distance
    eventsWithDistance.sort((a, b) => (a.distance || Infinity) - (b.distance || Infinity));
    setEvents(eventsWithDistance);
  };

  const updateFilteredEvents = () => {
    let filtered = [...events];

    // Filter by selected categories
    if (selectedCategories.length > 0) {
      filtered = filtered.filter(event => 
        event.category && selectedCategories.some(cat => cat.id === event.category.id)
      );
    }

    // Filter by search query
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(event => 
        event.title.toLowerCase().includes(query) ||
        event.description.toLowerCase().includes(query) ||
        (event.location?.address && event.location.address.toLowerCase().includes(query))
      );
    }

    setFilteredEvents(filtered);
  };

  const handleCategorySelect = (category) => {
    setSelectedCategories(prev => {
      const isSelected = prev.some(cat => cat.id === category.id);
      if (isSelected) {
        return prev.filter(cat => cat.id !== category.id);
      } else {
        return [...prev, category];
      }
    });
  };

  const handleSearch = (query) => {
    setSearchQuery(query);
  };

  const handleEventSelect = (eventId) => {
    navigate(`/events/${eventId}`);
  };

  const handleCreateEventClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/create-event');
  };

  const handleNotificationClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/notifications');
  };

  const handleProfileClick = () => {
    if (!isAuthenticated) {
      setShowLoginPrompt(true);
      return;
    }
    navigate('/profile');
  };

  const handleBrowseEventsClick = () => {
    navigate('/browse-events');
  };

  // Helper function to calculate distance
  const getDistanceFromLatLonInKm = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the earth in km
    const dLat = deg2rad(lat2 - lat1);
    const dLon = deg2rad(lon2 - lon1);
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    const d = R * c; // Distance in km
    return d * 1000; // Convert to meters
  };

  const deg2rad = (deg) => {
    return deg * (Math.PI / 180);
  };

  const formatDistance = (meters) => {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    } else {
      return `${(meters / 1000).toFixed(1)}km`;
    }
  };

  // Render
  return (
    <div className="home-container">
      {/* Top Bar */}
      <div className="top-bar">
        <h1 className="app-title">IBCM</h1>
        <div className="top-bar-actions">
          <button 
            className="icon-button" 
            onClick={handleNotificationClick}
            aria-label="Notifications"
          >
            <i className="fas fa-bell"></i>
          </button>
          <button 
            className="icon-button" 
            onClick={handleProfileClick}
            aria-label="Profile"
          >
            <i className="fas fa-user-circle"></i>
          </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="search-container">
        <SearchBar onSearch={handleSearch} />
      </div>

      {/* Categories */}
      <div className="categories-section">
        <div className="section-header">
          <h2>Categories</h2>
          <button 
            className="view-toggle-button" 
            onClick={() => setShowCategoriesAsGrid(!showCategoriesAsGrid)}
          >
            {showCategoriesAsGrid ? 'Show as Row' : 'Show as Grid'}
          </button>
        </div>
        
        <div className={`categories-container ${showCategoriesAsGrid ? 'grid-view' : 'row-view'}`}>
          {categories.map(category => (
            <CategoryItem 
              key={category.id} 
              category={category} 
              isSelected={selectedCategories.some(cat => cat.id === category.id)}
              onClick={() => handleCategorySelect(category)}
            />
          ))}
        </div>
      </div>

      {/* Events Section */}
      <div className="events-section">
        <div className="section-header">
          <h2>Events Near You</h2>
          <button 
            className="view-toggle-button" 
            onClick={() => setIsMapView(!isMapView)}
          >
            <i className={`fas ${isMapView ? 'fa-list' : 'fa-map-marker-alt'}`}></i>
            {isMapView ? ' List View' : ' Map View'}
          </button>
        </div>

        {isLoading ? (
          <LoadingSpinner />
        ) : errorMessage ? (
          <div className="error-message">{errorMessage}</div>
        ) : isMapView ? (
          <div className="map-container">
            <MapView 
              events={filteredEvents} 
              userLocation={userLocation}
              onEventSelect={handleEventSelect}
            />
          </div>
        ) : (
          <div className="events-list">
            {filteredEvents.length > 0 ? (
              filteredEvents.map(event => (
                <EventCard 
                  key={event.id} 
                  event={event} 
                  onClick={() => handleEventSelect(event.id)}
                  distance={event.distance ? formatDistance(event.distance) : null}
                />
              ))
            ) : (
              <div className="no-events-message">
                <i className="fas fa-calendar-times"></i>
                <h3>No events found</h3>
                <p>Try changing your filters or location</p>
                <button 
                  className="primary-button"
                  onClick={handleBrowseEventsClick}
                >
                  Browse All Events
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Quick Actions */}
      <div className="quick-actions">
        <button 
          className="action-button"
          onClick={handleCreateEventClick}
        >
          <i className="fas fa-plus-circle"></i>
          <span>Create Event</span>
        </button>
      </div>

      {/* Modals */}
      {showLoginPrompt && (
        <div className="modal">
          <div className="modal-content">
            <h2>Login Required</h2>
            <p>Please login or sign up to continue</p>
            <div className="modal-actions">
              <button 
                className="primary-button"
                onClick={() => navigate('/login')}
              >
                Login
              </button>
              <button 
                className="secondary-button"
                onClick={() => navigate('/signup')}
              >
                Sign Up
              </button>
              <button 
                className="text-button"
                onClick={() => setShowLoginPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {showLocationPrompt && (
        <div className="modal">
          <div className="modal-content">
            <h2>Enable Location Services</h2>
            <p>To show events near you, please enable location services</p>
            <div className="modal-actions">
              <button 
                className="primary-button"
                onClick={() => {
                  setShowLocationPrompt(false);
                  // This doesn't actually open settings in a browser, but it's the equivalent action
                  alert('Please enable location services in your browser settings');
                }}
              >
                Settings
              </button>
              <button 
                className="text-button"
                onClick={() => setShowLocationPrompt(false)}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home; 