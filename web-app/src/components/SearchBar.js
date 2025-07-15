import React, { useState } from 'react';
import './SearchBar.css';

/**
 * SearchBar Component
 * 
 * Provides a search input field with clear button.
 * This component is designed to match the Android and iOS search bar designs.
 */
const SearchBar = ({ onSearch }) => {
  const [searchQuery, setSearchQuery] = useState('');

  const handleChange = (e) => {
    const query = e.target.value;
    setSearchQuery(query);
    onSearch(query);
  };

  const handleClear = () => {
    setSearchQuery('');
    onSearch('');
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    onSearch(searchQuery);
  };

  return (
    <form className="search-bar" onSubmit={handleSubmit}>
      <div className="search-icon">
        <i className="fas fa-search"></i>
      </div>
      
      <input
        type="text"
        className="search-input"
        placeholder="Search events..."
        value={searchQuery}
        onChange={handleChange}
      />
      
      {searchQuery && (
        <button 
          type="button"
          className="clear-button"
          onClick={handleClear}
          aria-label="Clear search"
        >
          <i className="fas fa-times-circle"></i>
        </button>
      )}
    </form>
  );
};

export default SearchBar; 