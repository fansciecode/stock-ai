import React from 'react';
import './LoadingSpinner.css';

/**
 * LoadingSpinner Component
 * 
 * Displays a loading spinner animation.
 * This component is designed to match the Android and iOS loading indicators.
 */
const LoadingSpinner = () => {
  return (
    <div className="loading-spinner">
      <div className="spinner"></div>
    </div>
  );
};

export default LoadingSpinner; 