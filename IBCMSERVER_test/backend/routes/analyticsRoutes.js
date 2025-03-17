import express from "express";
import { getEventRatingAnalytics, getUserActivityAnalytics,getUserAnalytics, getOrderAnalytics, getOrderTrends } from "../controllers/analyticsController.js";
import { protect, isAdmin, isSeller } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/ratings", protect, isAdmin, getEventRatingAnalytics);
router.get("/user-activity", protect, isAdmin, getUserActivityAnalytics);
router.get("/", protect, isAdmin, getUserAnalytics);

// Business analytics routes
router.get('/:businessId/orders', protect, isSeller, getOrderAnalytics);
router.get('/:businessId/orders/trends', protect, isSeller, getOrderTrends);

export default router;
