import { VirtualAssistantService } from '../services/ai/chatbot/virtualAssistant.js';
import { ContentGenerationService } from '../services/ai/content/descriptionGenerator.js';
import { SentimentAnalysisService } from '../services/ai/analytics/sentimentAnalyzer.js';
import { DemandPredictionService } from '../services/ai/analytics/demandPredictor.js';
import asyncHandler from 'express-async-handler';

// @desc    Handle chatbot queries
// @route   POST /api/ai/chat
// @access  Private
export const handleChatQuery = asyncHandler(async (req, res) => {
    const { query } = req.body;
    const response = await VirtualAssistantService.handleQuery(req.user._id, query);
    res.json({ success: true, data: response });
});

// @desc    Generate event description
// @route   POST /api/ai/generate-description
// @access  Private
export const generateDescription = asyncHandler(async (req, res) => {
    const { eventData } = req.body;
    const description = await ContentGenerationService.generateEventDescription(eventData);
    res.json({ success: true, data: description });
});

// @desc    Analyze review sentiment
// @route   POST /api/ai/analyze-review
// @access  Private
export const analyzeReview = asyncHandler(async (req, res) => {
    const { reviewText } = req.body;
    const analysis = await SentimentAnalysisService.analyzeReview(reviewText);
    res.json({ success: true, data: analysis });
});

// @desc    Predict demand for business
// @route   POST /api/ai/predict-demand
// @access  Private
export const predictDemand = asyncHandler(async (req, res) => {
    const { timeframe } = req.body;
    const prediction = await DemandPredictionService.predictDemand(req.user._id, timeframe);
    res.json({ success: true, data: prediction });
});
