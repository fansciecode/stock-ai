import { HybridRecommendationService } from '../services/ai/recommendation/hybridModel.js';
import { VoiceProcessingService } from '../services/ai/nlp/voiceProcessor.js';
import { LocationOptimizationService } from '../services/ai/location/geoOptimizer.js';
import asyncHandler from 'express-async-handler';
import { OpenAIService } from '../services/ai/nlp/openAI.js';

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

// @desc    Enhanced AI-powered search
// @route   POST /api/ai/search
// @access  Private
export const enhancedSearch = asyncHandler(async (req, res) => {
    try {
        const { query } = req.body;
        const userId = req.user._id;

        // Use OpenAI to generate enhanced search results
        const aiResults = await OpenAIService.generatePersonalizedSuggestions({ userId, query }, []);

        // Structure the response as EnhancedSearchResults
        // For demo, we just put the AI response in generalResults
        const enhancedResults = {
            generalResults: [
                {
                    id: 'ai-1',
                    title: `AI Suggestion for: ${query}`,
                    description: aiResults,
                    category: 'AI',
                    price: '',
                }
            ],
            timeBasedResults: [],
            locationBasedResults: [],
            priceBasedResults: []
        };

        res.json({
            success: true,
            data: enhancedResults
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});
