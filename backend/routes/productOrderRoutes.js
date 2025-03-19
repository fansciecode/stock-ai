import express from 'express';
import { protect } from '../middleware/authMiddleware.js';
import * as orderController from '../controllers/productOrderController.js';

const router = express.Router();

router.route('/')
    .post(protect, orderController.createOrder)
    .get(protect, orderController.getMyOrders);

router.route('/:id')
    .get(protect, orderController.getOrderById);

export default router; 