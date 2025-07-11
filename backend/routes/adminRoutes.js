import express from 'express';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import { 
    getDashboardStats, 
    getPendingVerifications,
    updateVerificationStatus,
    getSystemHealth,
    getUserManagement
} from '../controllers/adminController.js';

const router = express.Router();

// Dashboard statistics
router.get('/dashboard', protect, isAdmin, getDashboardStats);

// Business verification routes
router.get('/verifications', protect, isAdmin, getPendingVerifications);
router.put('/verifications/:businessId', protect, isAdmin, updateVerificationStatus);

// System health
router.get('/system-health', protect, isAdmin, getSystemHealth);

// User management
router.get('/users', protect, isAdmin, getUserManagement);

export default router; 