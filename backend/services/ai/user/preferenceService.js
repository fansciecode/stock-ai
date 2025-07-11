/**
 * Service for handling user preferences and generating insights
 * Connects to the IBCM-ai microservice for advanced analytics
 */
import axios from 'axios';
import { createLogger } from '../../../utils/logger.js';

const logger = createLogger('UserPreferenceService');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

export const UserPreferenceService = {
    /**
     * Get user preferences from the AI service
     * @param {string} userId - User ID
     * @returns {Promise<Object>} User preferences
     */
    getUserPreferences: async (userId) => {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/user/preferences`, {
                params: { user_id: userId },
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return response.data;
        } catch (error) {
            logger.error(`Error fetching user preferences: ${error.message}`);
            
            // Fallback to default preferences if AI service is unavailable
            return {
                categories: [],
                tags: [],
                locations: [],
                priceRange: { min: 0, max: 1000 },
                notificationSettings: {
                    email: true,
                    push: true,
                    sms: false
                }
            };
        }
    },
    
    /**
     * Update user preferences in the AI service
     * @param {string} userId - User ID
     * @param {Object} preferences - User preferences to update
     * @returns {Promise<Object>} Updated user preferences
     */
    updateUserPreferences: async (userId, preferences) => {
        try {
            const response = await axios.put(`${AI_SERVICE_URL}/user/preferences`, {
                user_id: userId,
                preferences
            }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return response.data;
        } catch (error) {
            logger.error(`Error updating user preferences: ${error.message}`);
            throw new Error('Failed to update user preferences');
        }
    },
    
    /**
     * Generate user insights based on behavior and preferences
     * @param {string} userId - User ID
     * @param {string} period - Time period for insights (day, week, month, year)
     * @returns {Promise<Object>} User insights
     */
    generateUserInsights: async (userId, period = 'month') => {
        try {
            const response = await axios.get(`${AI_SERVICE_URL}/user/insights`, {
                params: { 
                    user_id: userId,
                    period
                },
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return response.data;
        } catch (error) {
            logger.error(`Error generating user insights: ${error.message}`);
            
            // Return mock insights if AI service is unavailable
            return {
                activityScore: Math.random() * 0.8 + 0.1, // Random score between 0.1 and 0.9
                eventsAttended: Math.floor(Math.random() * 20),
                engagementLevel: ['Low', 'Medium', 'High'][Math.floor(Math.random() * 3)],
                topInterests: ['Music', 'Technology', 'Food', 'Sports'].slice(0, Math.floor(Math.random() * 4) + 1),
                recommendedCategories: ['Art', 'Business', 'Education', 'Health'].slice(0, Math.floor(Math.random() * 4) + 1),
                nextEventPrediction: {
                    category: ['Music', 'Technology', 'Food', 'Sports'][Math.floor(Math.random() * 4)],
                    timeframe: ['this weekend', 'next week', 'this month'][Math.floor(Math.random() * 3)]
                }
            };
        }
    },
    
    /**
     * Track user behavior for AI learning
     * @param {string} userId - User ID
     * @param {string} action - Action type
     * @param {Object} data - Action data
     * @returns {Promise<boolean>} Success status
     */
    trackUserBehavior: async (userId, action, data) => {
        try {
            await axios.post(`${AI_SERVICE_URL}/user/behavior`, {
                user_id: userId,
                action,
                data,
                timestamp: new Date().toISOString()
            }, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            
            return true;
        } catch (error) {
            logger.error(`Error tracking user behavior: ${error.message}`);
            return false; // Non-critical operation, return false instead of throwing
        }
    }
}; 