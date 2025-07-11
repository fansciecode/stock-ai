import asyncHandler from 'express-async-handler';
import axios from 'axios';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('aiFeatureController');
const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

/**
 * @desc    Handle AI chat query
 * @route   POST /api/ai/features/chat
 * @access  Private
 */
export const handleChatQuery = asyncHandler(async (req, res) => {
    try {
        const { query, context, history } = req.body;
        const userId = req.user._id;
        
        const response = await axios.post(`${AI_SERVICE_URL}/chat`, {
            query,
            user_id: userId,
            context,
            history
        }, {
            headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        logger.error(`Chat query error: ${error.message}`);
        res.status(500).json({
            success: false,
            error: 'Failed to process chat query'
        });
    }
});

/**
 * @desc    Generate description for content
 * @route   POST /api/ai/features/generate-description
 * @access  Private
 */
export const generateDescription = asyncHandler(async (req, res) => {
    try {
        const { title, category, context } = req.body;
        
        const response = await axios.post(`${AI_SERVICE_URL}/generate-description`, {
            title,
            category,
            context
        }, {
            headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        logger.error(`Description generation error: ${error.message}`);
        
        // Fallback to basic description
        const fallbackDescription = `${title} - A ${category} event. Join us for this amazing event!`;
        
        res.json({
            success: true,
            content: fallbackDescription,
            isFallback: true
        });
    }
});

/**
 * @desc    Analyze review content
 * @route   POST /api/ai/features/analyze-review
 * @access  Private
 */
export const analyzeReview = asyncHandler(async (req, res) => {
    try {
        const { text, eventId } = req.body;
        
        const response = await axios.post(`${AI_SERVICE_URL}/analyze-review`, {
            text,
            event_id: eventId
        }, {
            headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        logger.error(`Review analysis error: ${error.message}`);
        
        // Fallback to basic sentiment analysis
        const words = text.toLowerCase().split(' ');
        const positiveWords = ['good', 'great', 'excellent', 'amazing', 'wonderful', 'best', 'love', 'enjoy'];
        const negativeWords = ['bad', 'poor', 'terrible', 'worst', 'hate', 'disappointing', 'awful', 'horrible'];
        
        let positiveCount = 0;
        let negativeCount = 0;
        
        words.forEach(word => {
            if (positiveWords.includes(word)) positiveCount++;
            if (negativeWords.includes(word)) negativeCount++;
        });
        
        const sentiment = positiveCount > negativeCount ? 'positive' : 
                         negativeCount > positiveCount ? 'negative' : 'neutral';
        
        res.json({
            success: true,
            sentiment,
            score: positiveCount - negativeCount,
            isFallback: true
        });
    }
});

/**
 * @desc    Predict demand for an event
 * @route   POST /api/ai/features/predict-demand
 * @access  Private
 */
export const predictDemand = asyncHandler(async (req, res) => {
    try {
        const { eventData, location, date, category } = req.body;
        
        const response = await axios.post(`${AI_SERVICE_URL}/predict-demand`, {
            event_data: eventData,
            location,
            date,
            category
        }, {
            headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
        });
        
        res.json({
            success: true,
            data: response.data
        });
    } catch (error) {
        logger.error(`Demand prediction error: ${error.message}`);
        
        // Fallback to basic prediction
        const demandScore = Math.random() * 0.7 + 0.3; // Random score between 0.3 and 1.0
        
        res.json({
            success: true,
            demandScore,
            estimatedAttendees: Math.floor(Math.random() * 100) + 50,
            confidence: 'low',
            isFallback: true
        });
    }
});
