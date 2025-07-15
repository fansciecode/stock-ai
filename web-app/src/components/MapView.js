import React, { useState, useEffect } from 'react';
import './MapView.css';

/**
 * MapView Component
 * 
 * Displays events on a map using Leaflet.
 * This component is designed to match the Android and iOS map view functionality.
 */
const MapView = ({ events, userLocation, onEventSelect }) => {
  const [mapInitialized, setMapInitialized] = useState(false);
  const [map, setMap] = useState(null);
  const [markers, setMarkers] = useState([]);

  // Initialize map
  useEffect(() => {
    // We need to dynamically import Leaflet since it's a client-side library
    const initMap = async () => {
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        await import('leaflet/dist/leaflet.css');
        
        // Create map if it doesn't exist yet
        if (!mapInitialized) {
          // Default center if no user location
          const defaultCenter = [40.7128, -74.0060]; // New York
          const center = userLocation 
            ? [userLocation.latitude, userLocation.longitude] 
            : defaultCenter;
          
          // Create map
          const mapInstance = L.map('map').setView(center, 12);
          
          // Add tile layer (OpenStreetMap)
          L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
            attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          }).addTo(mapInstance);
          
          // Add user location marker if available
          if (userLocation) {
            L.circleMarker(
              [userLocation.latitude, userLocation.longitude],
              {
                color: '#1976d2',
                fillColor: '#1976d2',
                fillOpacity: 0.8,
                radius: 8
              }
            ).addTo(mapInstance);
          }
          
          setMap(mapInstance);
          setMapInitialized(true);
        }
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    };
    
    initMap();
    
    // Cleanup function
    return () => {
      if (map) {
        map.remove();
      }
    };
  }, [userLocation]);

  // Add event markers
  useEffect(() => {
    const addMarkers = async () => {
      if (!map || !events.length) return;
      
      try {
        // Dynamically import Leaflet
        const L = await import('leaflet');
        
        // Clear existing markers
        markers.forEach(marker => marker.remove());
        const newMarkers = [];
        
        // Add markers for each event
        events.forEach(event => {
          if (event.location && event.location.coordinates) {
            // Create marker
            const marker = L.marker(
              [event.location.coordinates[1], event.location.coordinates[0]],
              {
                title: event.title
              }
            ).addTo(map);
            
            // Add popup
            marker.bindPopup(`
              <div class="map-popup">
                <h3>${event.title}</h3>
                <p>${event.description.substring(0, 100)}${event.description.length > 100 ? '...' : ''}</p>
                <button class="popup-button">View Details</button>
              </div>
            `);
            
            // Add click handler
            marker.on('click', () => {
              // Open popup
              marker.openPopup();
              
              // Add click handler to button
              setTimeout(() => {
                const button = document.querySelector('.popup-button');
                if (button) {
                  button.addEventListener('click', () => {
                    onEventSelect(event.id);
                  });
                }
              }, 0);
            });
            
            newMarkers.push(marker);
          }
        });
        
        setMarkers(newMarkers);
        
        // Fit bounds to show all markers
        if (newMarkers.length > 0) {
          const group = L.featureGroup(newMarkers);
          map.fitBounds(group.getBounds().pad(0.1));
        }
      } catch (error) {
        console.error('Error adding markers:', error);
      }
    };
    
    if (map) {
      addMarkers();
    }
  }, [map, events, onEventSelect]);

  return (
    <div id="map" className="map-container"></div>
  );
};

export default MapView; 