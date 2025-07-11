import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { 
    enhancedSearch,
    updateUserPreferences,
    getUserInsights,
    getOptimizedRecommendations,
    getPersonalizedRecommendations,
    processVoiceSearch,
    getLocationRecommendations,
    getSearchHistory,
    getSearchInsights,
    getUserPreferences
} from '../controllers/aiController.js';

const router = express.Router();

// Search endpoints
router.post('/search', protect, enhancedSearch);
router.get('/search/history', protect, getSearchHistory);
router.get('/search/insights', protect, getSearchInsights);

// User learning endpoints
router.get('/user/preferences', protect, getUserPreferences);
router.get('/user/insights', protect, getUserInsights);
router.get('/user/recommendations', protect, getOptimizedRecommendations);

// New AI features
router.get('/recommendations', protect, getPersonalizedRecommendations);
router.post('/voice-search', protect, processVoiceSearch);
router.post('/location-recommendations', protect, getLocationRecommendations);

export default router;
