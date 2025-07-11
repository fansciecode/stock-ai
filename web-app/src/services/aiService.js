import api from './api';

/**
 * AI Service for IBCM AI-powered features and recommendations
 * Integrates with IBCM-ai microservice through the backend API
 */
class AIService {
  /**
   * Perform enhanced search with AI capabilities
   * @param {string} query - Search query
   * @param {string} userId - User ID
   * @param {Object} filters - Optional filters
   * @param {Object} location - Optional location object
   * @param {Object} preferences - Optional user preferences
   * @returns {Promise<Object>} Search results with metadata
   */
  async enhancedSearch(query, userId, filters = null, location = null, preferences = null) {
    try {
      const response = await api.post('/api/ai/search', {
        query,
        userId,
        filters,
        location,
        preferences
      });
      return response.data;
    } catch (error) {
      console.error('Enhanced search error:', error);
      throw error;
    }
  }

  /**
   * Get personalized recommendations for a user
   * @param {string} userId - User ID
   * @param {number} limit - Number of recommendations to return
   * @param {string} type - Optional type filter
   * @param {string} location - Optional location
   * @returns {Promise<Array>} List of recommendations
   */
  async getPersonalizedRecommendations(userId, limit = 10, type = null, location = null) {
    try {
      let url = `/api/ai/recommendations?userId=${userId}&limit=${limit}`;
      if (type) url += `&type=${type}`;
      if (location) url += `&location=${encodeURIComponent(location)}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Personalized recommendations error:', error);
      // Return empty array as fallback
      if (error.response?.status === 404 || !error.response) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get optimized recommendations based on context
   * @param {string} userId - User ID
   * @param {string} context - Optional context
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} List of recommendations
   */
  async getOptimizedRecommendations(userId, context = null, limit = 10) {
    try {
      let url = `/api/ai/recommendations/optimized?userId=${userId}&limit=${limit}`;
      if (context) url += `&context=${encodeURIComponent(context)}`;
      
      const response = await api.get(url);
      return response.data;
    } catch (error) {
      console.error('Optimized recommendations error:', error);
      // Return empty array as fallback
      if (error.response?.status === 404 || !error.response) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get location-based recommendations
   * @param {string} userId - User ID
   * @param {number} latitude - Latitude
   * @param {number} longitude - Longitude
   * @param {number} radius - Search radius in km
   * @param {string} category - Optional category
   * @param {number} limit - Number of recommendations to return
   * @returns {Promise<Array>} List of recommendations
   */
  async getLocationRecommendations(userId, latitude, longitude, radius = 10, category = null, limit = 10) {
    try {
      const response = await api.post('/api/ai/location-recommendations', {
        userId,
        latitude,
        longitude,
        radius,
        category,
        limit
      });
      return response.data;
    } catch (error) {
      console.error('Location recommendations error:', error);
      // Return empty array as fallback
      if (error.response?.status === 404 || !error.response) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Get user insights and analytics
   * @param {string} userId - User ID
   * @param {string} period - Time period (day, week, month, year)
   * @returns {Promise<Object>} User insights
   */
  async getUserInsights(userId, period = 'month') {
    try {
      const response = await api.get(`/api/ai/user/insights?userId=${userId}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('User insights error:', error);
      throw error;
    }
  }

  /**
   * Get user preferences
   * @param {string} userId - User ID
   * @returns {Promise<Object>} User preferences
   */
  async getUserPreferences(userId) {
    try {
      const response = await api.get(`/api/ai/user/preferences?userId=${userId}`);
      return response.data;
    } catch (error) {
      console.error('User preferences error:', error);
      throw error;
    }
  }

  /**
   * Update user preferences
   * @param {string} userId - User ID
   * @param {Object} preferences - User preferences
   * @returns {Promise<Object>} Updated user preferences
   */
  async updateUserPreferences(userId, preferences) {
    try {
      const response = await api.put('/api/ai/user/preferences', {
        userId,
        preferences
      });
      return response.data;
    } catch (error) {
      console.error('Update user preferences error:', error);
      throw error;
    }
  }

  /**
   * Generate event description
   * @param {string} title - Event title
   * @param {string} category - Event category
   * @param {string} context - Optional context
   * @returns {Promise<Object>} Generated content
   */
  async generateEventDescription(title, category, context = '') {
    try {
      const response = await api.post('/api/ai/generate-description', {
        title,
        category,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Generate event description error:', error);
      throw error;
    }
  }

  /**
   * Generate tags for content
   * @param {string} content - Content to generate tags for
   * @param {number} count - Number of tags to generate
   * @returns {Promise<Array>} List of tags
   */
  async generateTags(content, count = 5) {
    try {
      const response = await api.post('/api/ai/generate-tags', {
        content,
        count
      });
      return response.data;
    } catch (error) {
      console.error('Generate tags error:', error);
      // Return empty array as fallback
      if (error.response?.status === 404 || !error.response) {
        return [];
      }
      throw error;
    }
  }

  /**
   * Analyze sentiment of text
   * @param {string} text - Text to analyze
   * @returns {Promise<Object>} Sentiment analysis
   */
  async analyzeSentiment(text) {
    try {
      const response = await api.post('/api/ai/sentiment-analysis', {
        text
      });
      return response.data;
    } catch (error) {
      console.error('Sentiment analysis error:', error);
      throw error;
    }
  }

  /**
   * Submit feedback for AI learning
   * @param {string} userId - User ID
   * @param {string} targetId - Target ID
   * @param {number} feedback - Feedback score
   * @param {string} comment - Optional comment
   * @param {string} type - Feedback type
   * @returns {Promise<string>} Success message
   */
  async submitFeedback(userId, targetId, feedback, comment = null, type) {
    try {
      const response = await api.post('/api/ai/feedback', {
        userId,
        targetId,
        feedback,
        comment,
        type
      });
      return response.data;
    } catch (error) {
      console.error('Submit feedback error:', error);
      throw error;
    }
  }

  /**
   * Get business analytics
   * @param {string} businessId - Business ID
   * @param {string} period - Time period
   * @returns {Promise<Object>} Business analytics
   */
  async getBusinessAnalytics(businessId, period = 'month') {
    try {
      const response = await api.get(`/api/ai/business-analytics?businessId=${businessId}&period=${period}`);
      return response.data;
    } catch (error) {
      console.error('Business analytics error:', error);
      throw error;
    }
  }

  /**
   * Generate marketing campaign
   * @param {string} businessId - Business ID
   * @param {string} eventId - Event ID
   * @param {string} context - Context
   * @returns {Promise<Object>} Generated campaign
   */
  async generateCampaign(businessId, eventId, context) {
    try {
      const response = await api.post('/api/ai/generate-campaign', {
        businessId,
        eventId,
        context
      });
      return response.data;
    } catch (error) {
      console.error('Generate campaign error:', error);
      throw error;
    }
  }
}

export default new AIService(); 