import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import { handleContentUris, checkVersion } from '../controllers/androidController.js';

const router = express.Router();

// Public routes
router.get('/version-check', checkVersion);

// Protected routes
router.post('/handle-content-uris', protect, handleContentUris);

export default router; 