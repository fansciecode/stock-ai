import express from 'express';
import {
    generateUserProfile,
    generateBusinessProfile,
    autoFillFromLocation,
    updateUserPreferences
} from '../controllers/profileController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = express.Router();

// Profile generation routes
router.post('/generate-user', protect, generateUserProfile);
router.post('/generate-business', protect, generateBusinessProfile);
router.post('/auto-fill-location', protect, autoFillFromLocation);
router.put('/preferences', protect, updateUserPreferences);

export default router; 