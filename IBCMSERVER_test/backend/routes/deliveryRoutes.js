import express from 'express';
import {
    assignDelivery,
    updateDeliveryStatus
} from '../controllers/deliveryController.js';
import { protect, isDeliveryPartner } from '../middleware/authMiddleware.js';

const router = express.Router();

// Delivery partner routes
router.post('/:orderId/assign', protect, isDeliveryPartner, assignDelivery);
router.put('/:deliveryId/status', protect, isDeliveryPartner, updateDeliveryStatus);

export default router; 