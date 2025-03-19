import express from "express";
import { protect,isAdmin } from "../middleware/authMiddleware.js";
import { processSubscriptionPayment } from "../controllers/paymentController.js";
import {
  getSubscriptionPlans,
  purchaseSubscription,
  createSubscription, getSubscriptionStats
} from "../controllers/subscriptionController.js";
import { verifyExternalPayment,verifyExternalPaymentHandler } from "../services/paymentService.js";

const router = express.Router();

router.get("/", getSubscriptionPlans); // Fetch subscription plans
router.post("/purchase", protect, purchaseSubscription); // Purchase a subscription
router.post("/verify", protect, verifyExternalPayment); // Verify payment and update user status

// Payment processing before subscription creation
router.post("/subscribe", protect, processSubscriptionPayment);

// 2. Verify Payment before subscription creation
router.post("/verify-payment", protect, verifyExternalPaymentHandler);

// Creating subscription after successful payment
router.post("/create", protect, createSubscription);

// Admin route to get subscription statistics
router.get("/stats", protect, isAdmin, getSubscriptionStats);

// Process subscription payment
router.post('/process-payment', protect, processSubscriptionPayment);

export default router;
