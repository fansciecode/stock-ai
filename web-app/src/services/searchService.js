import api from './api';

class SearchService {
  // General Search
  async search(query, filters = {}) {
    try {
      const response = await api.get('/search', {
        params: { q: query, ...filters }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Search failed'
      };
    }
  }

  // Event Search
  async searchEvents(query, filters = {}) {
    try {
      const response = await api.get('/search/events', {
        params: { q: query, ...filters }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Event search failed'
      };
    }
  }

  // User Search
  async searchUsers(query, filters = {}) {
    try {
      const response = await api.get('/search/users', {
        params: { q: query, ...filters }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'User search failed'
      };
    }
  }

  // Category Search
  async searchCategories(query) {
    try {
      const response = await api.get('/search/categories', {
        params: { q: query }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Category search failed'
      };
    }
  }

  // Product Search
  async searchProducts(query, filters = {}) {
    try {
      const response = await api.get('/search/products', {
        params: { q: query, ...filters }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Product search failed'
      };
    }
  }

  // Location-based Search
  async searchNearby(latitude, longitude, radius = 10, type = 'events') {
    try {
      const response = await api.get('/search/nearby', {
        params: { lat: latitude, lng: longitude, radius, type }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Nearby search failed'
      };
    }
  }

  // Advanced Search
  async advancedSearch(criteria) {
    try {
      const response = await api.post('/search/advanced', criteria);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Advanced search failed'
      };
    }
  }

  // Search Suggestions
  async getSearchSuggestions(query, type = 'all') {
    try {
      const response = await api.get('/search/suggestions', {
        params: { q: query, type }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get suggestions'
      };
    }
  }

  // Popular Searches
  async getPopularSearches(type = 'all', limit = 10) {
    try {
      const response = await api.get('/search/popular', {
        params: { type, limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get popular searches'
      };
    }
  }

  // Search History
  async getSearchHistory(limit = 20) {
    try {
      const response = await api.get('/search/history', {
        params: { limit }
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get search history'
      };
    }
  }

  async saveSearchHistory(query, type = 'general', filters = {}) {
    try {
      const response = await api.post('/search/history', {
        query,
        type,
        filters,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save search history'
      };
    }
  }

  async clearSearchHistory() {
    try {
      const response = await api.delete('/search/history');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to clear search history'
      };
    }
  }

  // Search Filters
  async getSearchFilters(type = 'events') {
    try {
      const response = await api.get(`/search/filters/${type}`);
      return { success: true, data: response.data };
    } catch (error) {
      // Return default filters if API fails
      return {
        success: true,
        data: this.getDefaultFilters(type)
      };
    }
  }

  getDefaultFilters(type) {
    const commonFilters = {
      dateRange: {
        type: 'date',
        label: 'Date Range',
        options: ['today', 'tomorrow', 'this_week', 'this_month', 'custom']
      },
      sortBy: {
        type: 'select',
        label: 'Sort By',
        options: ['relevance', 'date', 'popularity', 'rating', 'price']
      }
    };

    switch (type) {
      case 'events':
        return {
          ...commonFilters,
          category: {
            type: 'multiselect',
            label: 'Categories',
            options: []
          },
          location: {
            type: 'location',
            label: 'Location',
            radius: true
          },
          price: {
            type: 'range',
            label: 'Price Range',
            min: 0,
            max: 1000
          },
          eventType: {
            type: 'select',
            label: 'Event Type',
            options: ['online', 'offline', 'hybrid']
          }
        };

      case 'users':
        return {
          ...commonFilters,
          userType: {
            type: 'select',
            label: 'User Type',
            options: ['organizer', 'attendee', 'vendor']
          },
          verified: {
            type: 'boolean',
            label: 'Verified Users Only'
          }
        };

      case 'products':
        return {
          ...commonFilters,
          category: {
            type: 'multiselect',
            label: 'Categories',
            options: []
          },
          price: {
            type: 'range',
            label: 'Price Range',
            min: 0,
            max: 1000
          },
          rating: {
            type: 'range',
            label: 'Rating',
            min: 0,
            max: 5
          },
          availability: {
            type: 'select',
            label: 'Availability',
            options: ['in_stock', 'out_of_stock', 'pre_order']
          }
        };

      default:
        return commonFilters;
    }
  }

  // Search Analytics
  async logSearchAnalytics(query, type, resultsCount, clickedResult = null) {
    try {
      const response = await api.post('/search/analytics', {
        query,
        type,
        resultsCount,
        clickedResult,
        timestamp: new Date().toISOString(),
        userAgent: navigator.userAgent
      });
      return { success: true, data: response.data };
    } catch (error) {
      // Silently fail analytics logging
      return { success: false };
    }
  }

  // Saved Searches
  async getSavedSearches() {
    try {
      const response = await api.get('/search/saved');
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to get saved searches'
      };
    }
  }

  async saveSearch(searchData) {
    try {
      const response = await api.post('/search/saved', {
        ...searchData,
        timestamp: new Date().toISOString()
      });
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to save search'
      };
    }
  }

  async deleteSavedSearch(searchId) {
    try {
      const response = await api.delete(`/search/saved/${searchId}`);
      return { success: true, data: response.data };
    } catch (error) {
      return {
        success: false,
        message: error.response?.data?.message || 'Failed to delete saved search'
      };
    }
  }

  // Search Validation
  validateSearchQuery(query) {
    const errors = [];

    if (!query || query.trim().length === 0) {
      errors.push('Search query cannot be empty');
    }

    if (query && query.length < 2) {
      errors.push('Search query must be at least 2 characters long');
    }

    if (query && query.length > 100) {
      errors.push('Search query must be less than 100 characters');
    }

    // Check for potentially harmful characters
    const dangerousChars = /[<>\"'&]/g;
    if (query && dangerousChars.test(query)) {
      errors.push('Search query contains invalid characters');
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  // Format Search Results
  formatSearchResults(results, type) {
    if (!results || !Array.isArray(results)) {
      return [];
    }

    return results.map(result => {
      const baseResult = {
        id: result.id,
        title: result.title || result.name,
        description: result.description,
        type: type,
        url: result.url,
        timestamp: result.timestamp || result.createdAt
      };

      // Add type-specific formatting
      switch (type) {
        case 'events':
          return {
            ...baseResult,
            date: result.date,
            location: result.location,
            price: result.price,
            category: result.category,
            imageUrl: result.imageUrl,
            attendeeCount: result.attendeeCount
          };

        case 'users':
          return {
            ...baseResult,
            username: result.username,
            profileImage: result.profileImage,
            verified: result.verified,
            userType: result.userType
          };

        case 'products':
          return {
            ...baseResult,
            price: result.price,
            rating: result.rating,
            reviewCount: result.reviewCount,
            category: result.category,
            imageUrl: result.imageUrl,
            inStock: result.inStock
          };

        default:
          return baseResult;
      }
    });
  }

  // Debounce Search
  debounceSearch(func, delay = 300) {
    let timeoutId;
    return (...args) => {
      clearTimeout(timeoutId);
      timeoutId = setTimeout(() => func.apply(this, args), delay);
    };
  }

  // Get Recent Searches from Local Storage
  getRecentSearches() {
    try {
      const recent = localStorage.getItem('recentSearches');
      return recent ? JSON.parse(recent) : [];
    } catch (error) {
      return [];
    }
  }

  // Save Recent Search to Local Storage
  saveRecentSearch(query, type = 'general') {
    try {
      const recent = this.getRecentSearches();
      const newSearch = {
        query,
        type,
        timestamp: new Date().toISOString()
      };

      // Remove duplicate
      const filtered = recent.filter(search => search.query !== query);

      // Add to beginning and limit to 10
      const updated = [newSearch, ...filtered].slice(0, 10);

      localStorage.setItem('recentSearches', JSON.stringify(updated));
    } catch (error) {
      console.error('Failed to save recent search:', error);
    }
  }

  // Clear Recent Searches from Local Storage
  clearRecentSearches() {
    try {
      localStorage.removeItem('recentSearches');
    } catch (error) {
      console.error('Failed to clear recent searches:', error);
    }
  }
}

export default new SearchService();
