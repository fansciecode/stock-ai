import React from 'react';
import './CategoryItem.css';

/**
 * CategoryItem Component
 * 
 * Displays a category item with icon and name.
 * This component is designed to match the Android and iOS category item designs.
 */
const CategoryItem = ({ category, isSelected, onClick }) => {
  return (
    <div 
      className={`category-item ${isSelected ? 'selected' : ''}`}
      onClick={onClick}
    >
      <div className="category-icon">
        <i className={`fas fa-${category.icon}`}></i>
      </div>
      <span className="category-name">{category.name}</span>
    </div>
  );
};

export default CategoryItem; 