import React, { createContext, useContext, useState, useEffect } from 'react';
import { message } from 'antd';

const LocationContext = createContext();

export const useLocation = () => {
  const context = useContext(LocationContext);
  if (!context) {
    throw new Error('useLocation must be used within a LocationProvider');
  }
  return context;
};

export const LocationProvider = ({ children }) => {
  const [currentLocation, setCurrentLocation] = useState(null);
  const [selectedLocation, setSelectedLocation] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const [permissionStatus, setPermissionStatus] = useState('prompt');
  const [locationHistory, setLocationHistory] = useState([]);

  // Load saved location data on mount
  useEffect(() => {
    const savedLocation = localStorage.getItem('selectedLocation');
    const savedHistory = localStorage.getItem('locationHistory');

    if (savedLocation) {
      setSelectedLocation(JSON.parse(savedLocation));
    }

    if (savedHistory) {
      setLocationHistory(JSON.parse(savedHistory));
    }
  }, []);

  // Save location data to localStorage
  useEffect(() => {
    if (selectedLocation) {
      localStorage.setItem('selectedLocation', JSON.stringify(selectedLocation));
    }
  }, [selectedLocation]);

  useEffect(() => {
    if (locationHistory.length > 0) {
      localStorage.setItem('locationHistory', JSON.stringify(locationHistory));
    }
  }, [locationHistory]);

  // Check geolocation permission status
  const checkPermissionStatus = async () => {
    if ('permissions' in navigator) {
      try {
        const permission = await navigator.permissions.query({ name: 'geolocation' });
        setPermissionStatus(permission.state);
        return permission.state;
      } catch (error) {
        console.error('Error checking geolocation permission:', error);
        return 'prompt';
      }
    }
    return 'prompt';
  };

  // Get current location using browser geolocation API
  const getCurrentLocation = () => {
    return new Promise((resolve, reject) => {
      if (!navigator.geolocation) {
        reject(new Error('Geolocation is not supported by this browser'));
        return;
      }

      setIsLoading(true);
      setError(null);

      navigator.geolocation.getCurrentPosition(
        (position) => {
          const location = {
            latitude: position.coords.latitude,
            longitude: position.coords.longitude,
            accuracy: position.coords.accuracy,
            timestamp: new Date().toISOString(),
          };

          setCurrentLocation(location);
          setIsLoading(false);
          resolve(location);
        },
        (error) => {
          const errorMessage = getLocationErrorMessage(error);
          setError(errorMessage);
          setIsLoading(false);
          reject(new Error(errorMessage));
        },
        {
          enableHighAccuracy: true,
          timeout: 10000,
          maximumAge: 600000, // 10 minutes
        }
      );
    });
  };

  // Get location error message
  const getLocationErrorMessage = (error) => {
    switch (error.code) {
      case error.PERMISSION_DENIED:
        return 'Location access denied by user';
      case error.POSITION_UNAVAILABLE:
        return 'Location information is unavailable';
      case error.TIMEOUT:
        return 'Location request timed out';
      default:
        return 'An unknown error occurred while retrieving location';
    }
  };

  // Request location permission and get current location
  const requestLocationPermission = async () => {
    try {
      const permission = await checkPermissionStatus();

      if (permission === 'granted') {
        return await getCurrentLocation();
      } else if (permission === 'prompt') {
        return await getCurrentLocation();
      } else {
        throw new Error('Location permission denied');
      }
    } catch (error) {
      message.error(error.message);
      throw error;
    }
  };

  // Watch user location changes
  const watchLocation = () => {
    if (!navigator.geolocation) {
      message.error('Geolocation is not supported by this browser');
      return null;
    }

    const watchId = navigator.geolocation.watchPosition(
      (position) => {
        const location = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy,
          timestamp: new Date().toISOString(),
        };

        setCurrentLocation(location);
      },
      (error) => {
        const errorMessage = getLocationErrorMessage(error);
        setError(errorMessage);
      },
      {
        enableHighAccuracy: true,
        timeout: 10000,
        maximumAge: 600000,
      }
    );

    return watchId;
  };

  // Stop watching location
  const stopWatchingLocation = (watchId) => {
    if (watchId && navigator.geolocation) {
      navigator.geolocation.clearWatch(watchId);
    }
  };

  // Reverse geocoding - convert coordinates to address
  const reverseGeocode = async (latitude, longitude) => {
    try {
      // Using a free geocoding service (you can replace with your preferred service)
      const response = await fetch(
        `https://api.bigdatacloud.net/data/reverse-geocode-client?latitude=${latitude}&longitude=${longitude}&localityLanguage=en`
      );

      if (!response.ok) {
        throw new Error('Failed to reverse geocode');
      }

      const data = await response.json();
      return {
        address: data.display_name || `${data.locality}, ${data.principalSubdivision}`,
        city: data.locality,
        state: data.principalSubdivision,
        country: data.countryName,
        postalCode: data.postcode,
        latitude,
        longitude,
      };
    } catch (error) {
      console.error('Reverse geocoding error:', error);
      return {
        address: `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`,
        latitude,
        longitude,
      };
    }
  };

  // Set selected location
  const setLocation = async (location) => {
    try {
      let locationData = location;

      // If coordinates are provided without address, reverse geocode
      if (location.latitude && location.longitude && !location.address) {
        locationData = await reverseGeocode(location.latitude, location.longitude);
      }

      setSelectedLocation(locationData);

      // Add to history
      addToLocationHistory(locationData);

      message.success('Location set successfully');
      return locationData;
    } catch (error) {
      message.error('Failed to set location');
      throw error;
    }
  };

  // Add location to history
  const addToLocationHistory = (location) => {
    setLocationHistory(prev => {
      const filtered = prev.filter(item =>
        item.latitude !== location.latitude ||
        item.longitude !== location.longitude
      );
      return [location, ...filtered].slice(0, 10); // Keep only last 10 locations
    });
  };

  // Calculate distance between two points
  const calculateDistance = (lat1, lon1, lat2, lon2) => {
    const R = 6371; // Radius of the Earth in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat/2) * Math.sin(dLat/2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon/2) * Math.sin(dLon/2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
    const distance = R * c;
    return distance;
  };

  // Clear location data
  const clearLocation = () => {
    setSelectedLocation(null);
    setCurrentLocation(null);
    setError(null);
    localStorage.removeItem('selectedLocation');
  };

  // Clear location history
  const clearLocationHistory = () => {
    setLocationHistory([]);
    localStorage.removeItem('locationHistory');
  };

  const value = {
    currentLocation,
    selectedLocation,
    isLoading,
    error,
    permissionStatus,
    locationHistory,
    getCurrentLocation,
    requestLocationPermission,
    watchLocation,
    stopWatchingLocation,
    reverseGeocode,
    setLocation,
    clearLocation,
    clearLocationHistory,
    calculateDistance,
    checkPermissionStatus,
  };

  return (
    <LocationContext.Provider value={value}>
      {children}
    </LocationContext.Provider>
  );
};
