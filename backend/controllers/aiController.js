import { HybridRecommendationService } from '../services/ai/recommendation/hybridModel.js';
import { VoiceProcessor } from '../services/ai/nlp/voiceProcessor.js';
import { GeoOptimizerService } from '../services/ai/location/geoOptimizer.js';
import { UserPreferenceService } from '../services/ai/user/preferenceService.js';
import { SearchAnalyticsService } from '../services/ai/analytics/searchAnalytics.js';
import asyncHandler from 'express-async-handler';

// @desc    Get personalized recommendations
// @route   GET /api/ai/recommendations
// @access  Private
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 10;
        const type = req.query.type || null;
        const location = req.query.location || null;
        
        const recommendations = await HybridRecommendationService
            .generateRecommendations(userId, { limit, type, location });

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Process voice search
// @route   POST /api/ai/voice-search
// @access  Private
export const processVoiceSearch = asyncHandler(async (req, res) => {
    try {
        const { audioData } = req.body;
        const userId = req.user._id;

        const voiceProcessor = new VoiceProcessor();
        const results = await voiceProcessor.processVoiceCommand(audioData);

        res.json({
            success: true,
            data: results
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get location-based recommendations
// @route   POST /api/ai/location-recommendations
// @access  Private
export const getLocationRecommendations = asyncHandler(async (req, res) => {
    try {
        const { latitude, longitude, radius, category, limit } = req.body;
        const userId = req.user._id;

        // Use GeoOptimizerService for location-based recommendations
        const recommendations = await GeoOptimizerService.optimizeEventLocation(
            { location: { latitude, longitude, category, radius, limit, userId } },
            { latitude, longitude }
        );

        res.json(recommendations);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Enhanced search with AI capabilities
// @route   POST /api/ai/search
// @access  Private
export const enhancedSearch = asyncHandler(async (req, res) => {
    try {
        const { query, filters, location, preferences } = req.body;
        const userId = req.user._id;

        const results = await SearchAnalyticsService.performEnhancedSearch(
            query, 
            userId, 
            filters, 
            location, 
            preferences
        );

        res.json(results);
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get search history
// @route   GET /api/ai/search/history
// @access  Private
export const getSearchHistory = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const limit = parseInt(req.query.limit) || 10;
        
        const history = await SearchAnalyticsService.getUserSearchHistory(userId, limit);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get search insights
// @route   GET /api/ai/search/insights
// @access  Private
export const getSearchInsights = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        
        const insights = await SearchAnalyticsService.generateSearchInsights(userId);
        
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get user preferences
// @route   GET /api/ai/user/preferences
// @access  Private
export const getUserPreferences = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        
        const preferences = await UserPreferenceService.getUserPreferences(userId);
        
        res.json({
            success: true,
            data: preferences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Update user preferences
// @route   PUT /api/ai/user/preferences
// @access  Private
export const updateUserPreferences = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const { preferences } = req.body;
        
        const updatedPreferences = await UserPreferenceService.updateUserPreferences(userId, preferences);
        
        res.json({
            success: true,
            data: updatedPreferences
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get user insights
// @route   GET /api/ai/user/insights
// @access  Private
export const getUserInsights = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const period = req.query.period || 'month';
        
        const insights = await UserPreferenceService.generateUserInsights(userId, period);
        
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get optimized recommendations
// @route   GET /api/ai/user/recommendations
// @access  Private
export const getOptimizedRecommendations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const context = req.query.context || null;
        const limit = parseInt(req.query.limit) || 10;
        
        const recommendations = await HybridRecommendationService.getOptimizedRecommendations(
            userId,
            context,
            limit
        );
        
        res.json({
            success: true,
            data: recommendations
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
