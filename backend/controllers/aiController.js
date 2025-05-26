import { HybridRecommendationService } from '../services/ai/recommendation/hybridModel.js';
import { VoiceProcessingService } from '../services/ai/nlp/voiceProcessor.js';
import { LocationOptimizationService } from '../services/ai/location/geoOptimizer.js';
import asyncHandler from 'express-async-handler';

// @desc    Get personalized recommendations
// @route   GET /api/ai/recommendations
// @access  Private
export const getPersonalizedRecommendations = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const recommendations = await HybridRecommendationService
            .generateRecommendations(userId);

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

// @desc    Process voice search
// @route   POST /api/ai/voice-search
// @access  Private
export const processVoiceSearch = asyncHandler(async (req, res) => {
    try {
        const { audioData } = req.body;
        const userId = req.user._id;

        const results = await VoiceProcessingService
            .processVoiceSearch(audioData, userId);

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
        const { coordinates } = req.body;
        const userId = req.user._id;

        const recommendations = await LocationOptimizationService
            .getLocationBasedRecommendations(userId, coordinates);

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
