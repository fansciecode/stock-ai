import express from "express";
import { getAdminRatingAnalytics } from "../controllers/adminAnalyticsController.js";
import { getSubscriptionStats } from "../controllers/adminAnalyticsController.js";
import { protect, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/ratings", protect, isAdmin, getAdminRatingAnalytics);
router.get("/subscriptions/stats", protect,isAdmin, getSubscriptionStats);

export default router;
