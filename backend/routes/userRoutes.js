import express from "express";
import { userController } from "../controllers/userController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";
import upload from '../middleware/uploadMiddleware.js';
import { aiMiddleware } from '../middleware/aiMiddleware.js';
import { getUserBookings } from "../controllers/bookingController.js";

const router = express.Router();

// Configure multer for multiple business documents
const businessUpload = upload.fields([
    { name: 'BUSINESS_REGISTRATION', maxCount: 1 },
    { name: 'TAX_CERTIFICATE', maxCount: 1 },
    { name: 'ID_PROOF', maxCount: 1 },
    { name: 'ADDRESS_PROOF', maxCount: 1 },
    { name: 'TRADE_LICENSE', maxCount: 1 }
]);

// Public routes
router.post("/register", userController.registerUser);
router.post("/login", userController.authUser);

// Protected routes
router.route('/profile')
    .get(protect, userController.getUserProfile)
    .put(protect, userController.updateUserProfile);

router.post('/fcm-token', protect, userController.updateFCMToken);

// Verification routes
router.post('/verify', protect, upload.single('document'), userController.submitVerification);
router.get('/verify/status', protect, userController.getVerificationStatus);

// Business verification routes
router.post('/verify/business', 
    protect, 
    businessUpload, 
    userController.submitBusinessVerification
);

router.get('/verify/business/status', 
    protect, 
    userController.getBusinessVerificationStatus
);

// Admin verification routes
router.get('/verify/pending', protect, isAdmin, userController.getPendingVerifications);
router.put('/verify/:verificationId', protect, isAdmin, userController.processVerification);

// Admin business verification routes
router.get('/verify/business/pending', 
    protect, 
    isAdmin, 
    userController.getPendingVerifications
);

router.put('/verify/business/:verificationId', 
    protect, 
    isAdmin, 
    userController.processBusinessVerification
);

router.post('/users/interaction', userController.handleUserInteraction);

router.get('/business-verification/:userId', userController.checkBusinessVerification);

router.get('/public/:userId', userController.getPublicProfile);

// Add follow/unfollow routes
router.post('/:userId/follow', protect, userController.followUser);
router.post('/:userId/unfollow', protect, userController.unfollowUser);

router.get('/:userId/bookings', protect, isAdmin, getUserBookings);

export default router;
