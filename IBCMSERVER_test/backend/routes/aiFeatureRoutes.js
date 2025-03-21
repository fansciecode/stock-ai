import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import {
    handleChatQuery,
    generateDescription,
    analyzeReview,
    predictDemand
} from '../controllers/aiFeatureController.js';

const router = express.Router();

router.post('/chat', protect, handleChatQuery);
router.post('/generate-description', protect, generateDescription);
router.post('/analyze-review', protect, analyzeReview);
router.post('/predict-demand', protect, predictDemand);

export default router;
