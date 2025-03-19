import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
// import { rateLimiter } from '../middleware/rateLimitMiddleware.js'; // Temporarily disabled
import { 
    analyzeUserBehavior,
    predictFraud,
    generateInsights,
    optimizePricing,
    generateContentSuggestions,
    analyzeMarketTrends,
    predictEventSuccess
} from '../controllers/adminAIController.js';

const router = express.Router();

// User behavior and fraud detection
router.get('/user-behavior', protect, isAdmin, analyzeUserBehavior);
router.post('/fraud-prediction', protect, isAdmin, predictFraud);

// Business insights
router.get('/insights', protect, isAdmin, generateInsights);
router.get('/market-trends', protect, isAdmin, analyzeMarketTrends);

// Pricing and optimization
router.post('/optimize-pricing', protect, isAdmin, optimizePricing);
router.post('/predict-event-success', protect, isAdmin, predictEventSuccess);

// Content management
router.post('/content-suggestions', protect, isAdmin, generateContentSuggestions);

export default router; 