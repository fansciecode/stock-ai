import asyncHandler from 'express-async-handler';
import Delivery from '../models/deliveryModel.js';
import { OrderModel as Order } from '../models/orderModel.js';
import { findDeliveryPartner } from '../utils/deliveryUtils.js';
import { sendDeliveryNotification } from '../utils/notificationUtils.js';

// @desc    Update order with delivery tracking
// @route   PUT /api/orders/:orderId/delivery
// @access  Private/Admin
export const assignDelivery = asyncHandler(async (req, res) => {
    const { orderId } = req.params;

    const order = await Order.findById(orderId).populate('business');
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.delivery.status !== 'PENDING') {
        res.status(400);
        throw new Error('Delivery already assigned');
    }

    const deliveryPartner = await findDeliveryPartner(order);
    if (!deliveryPartner) {
        res.status(400);
        throw new Error('No delivery partners available');
    }

    const delivery = await Delivery.create({
        order: order._id,
        business: order.business._id,
        deliveryPartner: deliveryPartner._id,
        status: 'ASSIGNED',
        estimatedDeliveryTime: new Date(Date.now() + 45 * 60000), // 45 minutes
        deliveryFee: order.pricing.deliveryFee
    });

    order.delivery.status = 'ASSIGNED';
    order.delivery.assignedTo = deliveryPartner._id;
    await order.save();

    // Send notification
    await sendDeliveryNotification({
        type: 'DELIVERY_ASSIGNED',
        delivery,
        order,
        deliveryPartner
    });

    res.json({
        success: true,
        delivery: {
            deliveryId: delivery._id,
            status: delivery.status,
            estimatedDeliveryTime: delivery.estimatedDeliveryTime
        }
    });
});

// @desc    Update delivery status
// @route   PUT /api/orders/:orderId/delivery/status
// @access  Private/Admin
export const updateDeliveryStatus = asyncHandler(async (req, res) => {
    const { deliveryId } = req.params;
    const { status, location, note } = req.body;

    const delivery = await Delivery.findById(deliveryId);
    if (!delivery) {
        res.status(404);
        throw new Error('Delivery not found');
    }

    await delivery.updateStatus(status, location, note);

    // Send notification
    await sendDeliveryNotification({
        type: 'DELIVERY_STATUS_UPDATE',
        delivery,
        status,
        note
    });

    res.json({
        success: true,
        delivery: {
            deliveryId: delivery._id,
            status: delivery.status,
            tracking: delivery.tracking
        }
    });
});

// @desc    Get delivery status
// @route   GET /api/orders/:orderId/delivery
// @access  Private
export const getDeliveryStatus = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId);
    
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json(order.deliveryInfo);
}); 