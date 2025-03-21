import express from 'express';
// import { rateLimiter } from '../middleware/rateLimitMiddleware.js'; // Temporarily disabled
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
    getAllOrders,
    getOrderById,
    createOrder,
    updateOrderStatus,
    cancelOrder,
    getOrderAnalytics,
    processRefund,
    getMyOrders,
    getSellerOrders,
    verifyCODDelivery,
    processOrderPayment,
    initiateOrderRefund
} from '../controllers/orderController.js';
import {
    assignDelivery,
    updateDeliveryStatus,
    getDeliveryStatus
} from '../controllers/deliveryController.js';

const router = express.Router();

// router.use(rateLimiter); // Temporarily disabled

// Protected routes (require authentication)
router.use(protect);

// Routes accessible by authenticated users
router.route('/')
    .get(getAllOrders)
    .post(createOrder);

router.get('/analytics', isAdmin, getOrderAnalytics);
router.get('/my-orders', getMyOrders);
router.get('/seller/orders', getSellerOrders);

router.route('/:id')
    .get(getOrderById)
    .put(isAdmin, updateOrderStatus);

// Order management routes
router.post('/:id/cancel', cancelOrder);
router.post('/:id/refund', isAdmin, processRefund);
router.post('/:id/verify-cod', verifyCODDelivery);
router.post('/:id/payment', processOrderPayment);
router.post('/:id/refund-initiate', isAdmin, initiateOrderRefund);

// Delivery routes
router.put('/:id/delivery', assignDelivery);
router.put('/:id/delivery/status', updateDeliveryStatus);
router.get('/:id/delivery', getDeliveryStatus);

export default router; 