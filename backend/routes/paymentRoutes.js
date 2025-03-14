import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
// import { paymentLimiter } from '../middleware/rateLimiter.js'; // Temporarily disabled
import {
  processPayment,
  createSubscription,
  cancelSubscription,
  getPaymentStatus,
  upgradeEventPayment,
  initiatePayment,
  confirmPaymentIntent,
  processRefund,
  createPaymentIntent,
  handleWebhook,
  getPaymentHistory,
  refundPayment,
  validatePayment,
  processSubscriptionPayment,
  verifyPayment
} from '../controllers/paymentController.js';
import { validateRequest } from '../middleware/validateRequest.js';
import {
  createPaymentValidator,
  confirmPaymentValidator
} from '../validators/paymentValidators.js';
import {
  verifyExternalPaymentHandler,
  createExternalPayment
} from '../services/paymentService.js';
import Payment from '../models/paymentModel.js';
import logger from '../utils/logger.js';

const router = express.Router();

// Protected routes - require authentication
router.use(protect);

// Event upgrade payment route
router.post('/upgrade/:eventId', upgradeEventPayment);

// Initiate payment
router.post('/create', initiatePayment);

// Confirm payment intent
router.post('/confirm', confirmPaymentIntent);

// Get payment status
router.get('/status/:paymentIntentId', getPaymentStatus);

// Process refund
router.post('/refund', processRefund);

// Routes that don't need rate limiting for now
router.post('/process', processPayment);
router.post('/verify', verifyPayment);

// Subscription routes
router.post('/subscribe', createSubscription);
router.delete('/subscribe/:subscriptionId', cancelSubscription);

// Payment routes with validation
router.post(
  '/create-payment-intent',
  createPaymentValidator,
  validateRequest,
  createPaymentIntent
);

router.post(
  '/confirm',
  confirmPaymentValidator,
  validateRequest,
  confirmPaymentIntent
);

// Webhook route (no auth required)
router.post('/webhook', express.raw({type: 'application/json'}), handleWebhook);

// New subscription routes
router.post('/subscription/payment', processSubscriptionPayment);
router.post('/subscription/cancel', cancelSubscription);

// Create external payment record
router.post('/external/create', async (req, res) => {
  try {
    const payment = await createExternalPayment(req.user._id, req.body);
    res.json({
      success: true,
      payment: {
        id: payment._id,
        amount: payment.amount,
        currency: payment.currency,
        status: payment.status,
        provider: payment.provider
      }
    });
  } catch (error) {
    logger.error('Error creating external payment:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

// Verify external payment
router.post('/external/verify/:paymentId', verifyExternalPaymentHandler);

// Get payment status
router.get('/external/:paymentId', async (req, res) => {
  try {
    const { paymentId } = req.params;
    const payment = await Payment.findById(paymentId);
    
    if (!payment) {
      return res.status(404).json({ error: 'Payment not found' });
    }

    if (payment.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({ error: 'Not authorized' });
    }

    res.json({
      success: true,
      payment: {
        id: payment._id,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        provider: payment.provider,
        createdAt: payment.createdAt,
        verifiedAt: payment.verifiedAt
      }
    });
  } catch (error) {
    logger.error('Error getting payment status:', error);
    res.status(500).json({
      success: false,
      error: error.message
    });
  }
});

export default router;
