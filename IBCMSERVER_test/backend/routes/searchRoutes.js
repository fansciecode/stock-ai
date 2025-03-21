import express from "express";
import { searchHandler, enhancedSearch, getSearchInsights, getSearchHistory, getSearchSuggestions } from "../controllers/searchController.js";
import { protect } from "../middleware/authMiddleware.js";
import { trackUserActivity } from '../middleware/learningMiddleware.js';

const router = express.Router();

router.get("/", protect, searchHandler);
router.post('/search', trackUserActivity, enhancedSearch);
router.get('/search/insights', protect, getSearchInsights);
router.get('/search/history', protect, getSearchHistory);
router.get('/search/suggestions', protect, getSearchSuggestions);

export default router;
