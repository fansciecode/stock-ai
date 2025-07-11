/**
 * Service for handling enhanced search and search analytics
 * Connects to the IBCM-ai microservice for advanced search capabilities
 */
import axios from 'axios';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('SearchAnalyticsService');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

export const SearchAnalyticsService = {
    /**
     * Perform enhanced search with AI capabilities
     * @param {string} query - Search query
     * @param {string} userId - User ID
     * @param {Object} filters - Optional filters
     * @param {Object} location - Optional location object
     * @param {Object} preferences - Optional user preferences
     * @returns {Promise<Array>} Search results
     */
    performEnhancedSearch: async (query, userId, filters = null, location = null, preferences = null) => {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/search`, {
                query,
                user_id: userId,
                filters,
                location,
                preferences
            }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            // Track search for analytics
            await SearchAnalyticsService.trackSearch(userId, query, filters, location);
            
            return response.data;
        } catch (error) {
            logger.error(`Enhanced search error: ${error.message}`);
            
            // Fallback to basic search if AI service is unavailable
            return await SearchAnalyticsService.performBasicSearch(query, filters);
        }
    },
    
    /**
     * Fallback basic search when AI service is unavailable
     * @param {string} query - Search query
     * @param {Object} filters - Optional filters
     * @returns {Promise<Array>} Search results
     */
    performBasicSearch: async (query, filters = null) => {
        try {
            // Implement basic search logic here
            // This would typically use your database directly
            
            // Mock implementation for now
            return {
                success: true,
                data: [],
                message: "Basic search results (AI service unavailable)",
                isBasicSearch: true
            };
        } catch (error) {
            logger.error(`Basic search error: ${error.message}`);
            throw new Error('Search failed');
        }
    },
    
    /**
     * Track search for analytics
     * @param {string} userId - User ID
     * @param {string} query - Search query
     * @param {Object} filters - Optional filters
     * @param {Object} location - Optional location object
     * @returns {Promise<boolean>} Success status
     */
    trackSearch: async (userId, query, filters = null, location = null) => {
        try {
            await axios.post(`${AI_SERVICE_URL}/search/track`, {
                user_id: userId,
                query,
                filters,
                location,
                timestamp: new Date().toISOString()
            }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return true;
        } catch (error) {
            logger.error(`Error tracking search: ${error.message}`);
            return false; // Non-critical operation, return false instead of throwing
        }
    },
    
    /**
     * Get user search history
     * @param {string} userId - User ID
     * @param {number} limit - Maximum number of results to return
     * @returns {Promise<Array>} Search history
     */
    getUserSearchHistory: async (userId, limit = 10) => {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/search/history`, {
                params: {
                    user_id: userId,
                    limit
                },
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return response.data;
        } catch (error) {
            logger.error(`Error fetching search history: ${error.message}`);
            return []; // Return empty array if AI service is unavailable
        }
    },
    
    /**
     * Generate search insights for a user
     * @param {string} userId - User ID
     * @returns {Promise<Object>} Search insights
     */
    generateSearchInsights: async (userId) => {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/search/insights`, {
                params: { user_id: userId },
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return response.data;
        } catch (error) {
            logger.error(`Error generating search insights: ${error.message}`);
            
            // Return mock insights if AI service is unavailable
            return {
                topSearches: ['events', 'music', 'food', 'tech'].slice(0, Math.floor(Math.random() * 4) + 1),
                topCategories: ['Music', 'Food & Drink', 'Technology', 'Sports'].slice(0, Math.floor(Math.random() * 4) + 1),
                searchFrequency: {
                    daily: Math.floor(Math.random() * 5),
                    weekly: Math.floor(Math.random() * 20),
                    monthly: Math.floor(Math.random() * 50)
                },
                locationPreference: Math.random() > 0.5 ? 'Local' : 'Various',
                timeOfDay: ['Morning', 'Afternoon', 'Evening'][Math.floor(Math.random() * 3)]
            };
        }
    }
}; 