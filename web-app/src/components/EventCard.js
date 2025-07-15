import React from 'react';
import './EventCard.css';

/**
 * EventCard Component
 * 
 * Displays an event card with image, title, description, date, location, and distance.
 * This component is designed to match the Android and iOS event card designs.
 */
const EventCard = ({ event, onClick, distance }) => {
  // Format date
  const formatDate = (date) => {
    if (!date) return 'No date';
    const options = { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' };
    return new Date(date).toLocaleDateString('en-US', options);
  };

  return (
    <div className="event-card" onClick={() => onClick(event.id)}>
      <div className="event-image-container">
        {event.imageUrl ? (
          <img 
            src={event.imageUrl} 
            alt={event.title} 
            className="event-image" 
            onError={(e) => {
              e.target.onerror = null;
              e.target.src = 'https://via.placeholder.com/400x200?text=No+Image';
            }}
          />
        ) : (
          <div className="event-image-placeholder">
            <i className="fas fa-calendar-alt"></i>
          </div>
        )}
      </div>
      
      <div className="event-details">
        <h3 className="event-title">{event.title}</h3>
        <p className="event-description">{event.description}</p>
        
        <div className="event-metadata">
          <div className="event-metadata-item">
            <i className="fas fa-calendar"></i>
            <span>{formatDate(event.startDate)}</span>
          </div>
          
          <div className="event-metadata-item">
            <i className="fas fa-map-marker-alt"></i>
            <span>
              {distance ? distance : event.location?.address || 'Unknown location'}
            </span>
          </div>
          
          {event.category && (
            <div className="event-category">
              <i className={`fas fa-${event.category.icon}`}></i>
              <span>{event.category.name}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default EventCard;
