import { OrderModel } from '../models/orderModel.js';
import { ProductModel } from '../models/productModel.js';
import { BusinessModel } from '../models/businessModel.js';
import { generateOTP, sendSMS } from '../utils/otpService.js';
import { createPaymentIntent } from '../services/paymentService.js';
import { processPayment, initiateRefund } from '../utils/paymentUtils.js';
import { calculateDeliveryCost, findDeliveryPartner } from '../utils/deliveryUtils.js';
import { sendOrderNotification } from '../utils/notificationUtils.js';
import { createLogger } from '../utils/logger.js';
import { asyncHandler } from '../middleware/asyncHandler.js';
import { AppError } from '../middleware/errorMiddleware.js';

const logger = createLogger('orderController');
 const createOrder = asyncHandler(async (req, res) => {
    const {
        businessId,
        items,
        paymentMethod,
        deliveryAddress
    } = req.body;

    try {
        // 1. Validate business availability
        const business = await Business.findById(businessId);
        if (!business.canAcceptOrder(deliveryAddress)) {
            throw new Error('Business cannot accept orders at this time');
        }

        // 2. Validate and process items
        const processedItems = await Promise.all(items.map(async (item) => {
            const product = await Product.findById(item.productId);
            const availability = await product.checkAvailability();
            
            if (!availability.isAvailable || availability.quantity < item.quantity) {
                throw new Error(`${product.name} is not available in requested quantity`);
            }

            const pricing = product.calculatePrice(item.quantity);
            return {
                product: product._id,
                quantity: item.quantity,
                price: {
                    base: pricing.basePrice,
                    discount: pricing.discountedPrice,
                    tax: pricing.taxAmount,
                    final: pricing.totalPrice
                }
            };
        }));

        // 3. Calculate delivery fee if applicable
        let deliveryFee = 0;
        if (deliveryAddress) {
            deliveryFee = await calculateDeliveryFee(business, deliveryAddress);
        }

        // 4. Create order
        const order = new Order({
            business: businessId,
            user: req.user._id,
            items: processedItems,
            payment: {
                method: paymentMethod
            },
            delivery: deliveryAddress ? {
                address: deliveryAddress,
                status: 'PENDING'
            } : null,
            pricing: {
                deliveryFee
            }
        });

        // 5. Calculate totals
        order.calculateTotals();

        // 6. Process payment
        if (paymentMethod !== 'COD') {
            const paymentResult = await processPayment({
                amount: order.pricing.total,
                currency: 'INR',
                paymentMethod,
                orderId: order._id,
                customerId: req.user._id
            });

            order.payment.status = paymentResult.status;
            order.payment.transactionId = paymentResult.transactionId;

            if (paymentResult.status === 'COMPLETED') {
                order.payment.paidAmount = order.pricing.total;
                order.payment.paidAt = new Date();
                order.status = 'CONFIRMED';
            }
        } else {
            order.status = 'CONFIRMED';
        }

        // 7. Update inventory
        await order.updateInventory();

        // 8. Save order
        await order.save();

        // 9. Update business analytics
        await business.updateAnalytics({
            type: 'ORDER',
            amount: order.pricing.total,
            user: req.user._id
        });

        // 10. Assign delivery partner if needed
        if (deliveryAddress && order.status === 'CONFIRMED') {
            const deliveryPartner = await findDeliveryPartner(order);
            if (deliveryPartner) {
                order.delivery.assignedTo = deliveryPartner._id;
                order.delivery.estimatedTime = new Date(Date.now() + 45 * 60000); // 45 minutes
                await order.save();
            }
        }

        // 11. Send notifications
        await sendOrderNotification({
            type: 'NEW_ORDER',
            order,
            business,
            user: req.user
        });

        res.status(201).json({
            success: true,
            order: {
                orderNumber: order.orderNumber,
                status: order.status,
                total: order.pricing.total,
                estimatedDeliveryTime: order.delivery?.estimatedTime
            }
        });

    } catch (error) {
        res.status(400);
        throw new Error(`Order creation failed: ${error.message}`);
    }
});

const verifyCODDelivery = asyncHandler(async (req, res) => {
    const { orderId, otp } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Verify OTP
    if (order.payment.cod.otp !== otp) {
        order.payment.cod.attempts += 1;
        await order.save();
        
        if (order.payment.cod.attempts >= 3) {
            order.status = 'FAILED';
            await order.save();
            throw new Error('Maximum OTP attempts exceeded');
        }
        throw new Error('Invalid OTP');
    }

    // Verify OTP not expired
    if (new Date() > order.payment.cod.otpExpiry) {
        throw new Error('OTP expired');
    }

    // Update order status
    order.payment.status = 'COMPLETED';
    order.payment.cod.verifiedAt = new Date();
    order.status = 'DELIVERED';
    order.shipping.status = 'DELIVERED';
    
    // Add to status history
    order.shipping.statusHistory.push({
        status: 'DELIVERED',
        timestamp: new Date(),
        description: 'Order delivered and payment collected',
        updatedBy: req.user._id
    });

    await order.save();

    res.json({ success: true, order });
});

 const getSellerOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ seller: req.user.businessId })
        .populate('customer', 'name email')
        .populate('items.product')
        .sort('-createdAt');

    res.json(orders);
});

 const updateOrderStatus = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { status, note } = req.body;

    const order = await Order.findById(orderId)
        .populate('business')
        .populate('items.product');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    // Validate status transition
    const validTransitions = {
        'PENDING': ['CONFIRMED', 'CANCELLED'],
        'CONFIRMED': ['PROCESSING', 'CANCELLED'],
        'PROCESSING': ['READY', 'CANCELLED'],
        'READY': ['COMPLETED', 'OUT_FOR_DELIVERY'],
        'OUT_FOR_DELIVERY': ['DELIVERED', 'FAILED'],
        'FAILED': ['PROCESSING', 'CANCELLED']
    };

    if (!validTransitions[order.status].includes(status)) {
        res.status(400);
        throw new Error(`Invalid status transition from ${order.status} to ${status}`);
    }

    // Handle status-specific logic
    try {
        switch (status) {
            case 'CANCELLED':
                await handleOrderCancellation(order, req.user);
                break;
            case 'PROCESSING':
                await handleOrderProcessing(order);
                break;
            case 'READY':
                await handleOrderReady(order);
                break;
            case 'OUT_FOR_DELIVERY':
                await handleDeliveryAssignment(order);
                break;
            case 'DELIVERED':
                await handleOrderDelivery(order);
                break;
        }

        order.status = status;
        if (note) {
            order.delivery.trackingUpdates.push({
                status,
                timestamp: new Date(),
                note
            });
        }

        await order.save();

        // Send notifications
        await sendOrderNotification({
            type: 'STATUS_UPDATE',
            order,
            status,
            note
        });

        res.json({
            success: true,
            order: {
                orderNumber: order.orderNumber,
                status: order.status,
                trackingUpdates: order.delivery?.trackingUpdates
            }
        });

    } catch (error) {
        res.status(400);
        throw new Error(`Status update failed: ${error.message}`);
    }
});
 const getOrderById = asyncHandler(async (req, res) => {
    const order = await Order.findById(req.params.orderId)
        .populate('user', 'name email')
        .populate('items.product');

    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    res.json(order);
});

 const getMyOrders = asyncHandler(async (req, res) => {
    const orders = await Order.find({ user: req.user._id })
        .populate('items.product')
        .sort('-createdAt');

    res.json(orders);
});

// Payment Integration
const processOrderPayment = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { paymentMethod, paymentDetails } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.payment.status === 'COMPLETED') {
        res.status(400);
        throw new Error('Payment already completed');
    }

    try {
        const paymentResult = await processPayment({
            amount: order.pricing.total,
            currency: 'INR',
            paymentMethod,
            orderId: order._id,
            customerId: order.user,
            paymentDetails
        });

        order.payment = {
            ...order.payment,
            status: paymentResult.status,
            transactionId: paymentResult.transactionId,
            method: paymentMethod
        };

        if (paymentResult.status === 'COMPLETED') {
            order.payment.paidAmount = order.pricing.total;
            order.payment.paidAt = new Date();
            order.status = 'CONFIRMED';
            
            // Update business analytics
            await order.business.updateAnalytics({
                type: 'PAYMENT',
                amount: order.pricing.total,
                user: order.user
            });
        }

        await order.save();

        res.json({
            success: true,
            payment: {
                status: order.payment.status,
                transactionId: order.payment.transactionId,
                paidAmount: order.payment.paidAmount
            }
        });

    } catch (error) {
        res.status(400);
        throw new Error(`Payment processing failed: ${error.message}`);
    }
});

const initiateOrderRefund = asyncHandler(async (req, res) => {
    const { orderId } = req.params;
    const { reason, amount } = req.body;

    const order = await Order.findById(orderId);
    if (!order) {
        res.status(404);
        throw new Error('Order not found');
    }

    if (order.payment.status !== 'COMPLETED') {
        res.status(400);
        throw new Error('Cannot refund unpaid order');
    }

    try {
        const refundAmount = amount || order.payment.paidAmount;
        const refundResult = await initiateRefund({
            orderId: order._id,
            transactionId: order.payment.transactionId,
            amount: refundAmount,
            reason
        });

        order.payment.status = 'REFUNDED';
        order.cancellation = {
            reason,
            initiatedBy: req.user.isAdmin ? 'BUSINESS' : 'USER',
            timestamp: new Date(),
            refundStatus: refundResult.status
        };

        await order.save();

        // Update business analytics
        await order.business.updateAnalytics({
            type: 'REFUND',
            amount: refundAmount,
            user: order.user
        });

        res.json({
            success: true,
            refund: {
                status: refundResult.status,
                amount: refundAmount,
                reason
            }
        });

    } catch (error) {
        res.status(400);
        throw new Error(`Refund initiation failed: ${error.message}`);
    }
});

// Helper functions for status transitions
async function handleOrderCancellation(order, user) {
    if (order.payment.status === 'COMPLETED') {
        await initiateRefund({
            orderId: order._id,
            transactionId: order.payment.transactionId,
            amount: order.payment.paidAmount,
            reason: 'Order Cancelled'
        });
    }

    // Restore inventory
    for (const item of order.items) {
        await item.product.updateInventory(item.quantity, 'RETURNED');
    }

    order.cancellation = {
        reason: 'Cancelled by ' + (user.isAdmin ? 'business' : 'user'),
        initiatedBy: user.isAdmin ? 'BUSINESS' : 'USER',
        timestamp: new Date()
    };
}

async function handleOrderProcessing(order) {
    // Validate inventory again
    for (const item of order.items) {
        const availability = await item.product.checkAvailability();
        if (!availability.isAvailable) {
            throw new Error(`${item.product.name} is no longer available`);
        }
    }
}

async function handleOrderReady(order) {
    if (order.delivery) {
        // Calculate estimated delivery time
        order.delivery.estimatedTime = new Date(
            Date.now() + (order.business.deliverySettings.estimatedTime * 60000)
        );
    }
}

async function handleDeliveryAssignment(order) {
    if (!order.delivery.assignedTo) {
        const deliveryPartner = await findDeliveryPartner(order);
        if (!deliveryPartner) {
            throw new Error('No delivery partners available');
        }
        order.delivery.assignedTo = deliveryPartner._id;
    }
}

async function handleOrderDelivery(order) {
    order.delivery.actualDeliveryTime = new Date();
    order.status = 'COMPLETED';
    
    // Update business analytics
    await order.business.updateAnalytics({
        type: 'DELIVERY',
        amount: order.pricing.deliveryFee,
        user: order.user
    });
}

// Get all orders
 const getAllOrders = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, status, sortBy = 'createdAt', sortOrder = 'desc' } = req.query;
    
    const query = {};
    if (status) query.status = status;

    const orders = await Order.find(query)
        .sort({ [sortBy]: sortOrder === 'desc' ? -1 : 1 })
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .populate('user', 'name email')
        .populate('event', 'title date');

    const count = await Order.countDocuments(query);

    res.json({
        success: true,
        data: orders,
        pagination: {
            total: count,
            pages: Math.ceil(count / limit),
            page: page,
            limit: limit
        }
    });
});

// Cancel order
 const cancelOrder = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (!['PENDING', 'CONFIRMED'].includes(order.status)) {
        throw new AppError('Order cannot be cancelled in current status', 400);
    }

    order.status = 'CANCELLED';
    order.cancellationReason = reason;
    order.cancelledAt = new Date();
    order.cancelledBy = req.user._id;

    await order.save();

    logger.info(`Order ${order._id} cancelled. Reason: ${reason}`);

    res.json({
        success: true,
        data: order
    });
});

// Get order analytics
 const getOrderAnalytics = asyncHandler(async (req, res) => {
    const { startDate, endDate } = req.query;

    const query = {};
    if (startDate && endDate) {
        query.createdAt = {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        };
    }

    const analytics = await Order.aggregate([
        { $match: query },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$totalAmount' },
                averageOrderValue: { $avg: '$totalAmount' },
                ordersByStatus: {
                    $push: {
                        status: '$status',
                        count: 1
                    }
                }
            }
        }
    ]);

    res.json({
        success: true,
        data: analytics[0] || {
            totalOrders: 0,
            totalRevenue: 0,
            averageOrderValue: 0,
            ordersByStatus: []
        }
    });
});

// Process refund
 const processRefund = asyncHandler(async (req, res) => {
    const { amount, reason } = req.body;
    const order = await Order.findById(req.params.id);

    if (!order) {
        throw new AppError('Order not found', 404);
    }

    if (order.status !== 'COMPLETED') {
        throw new AppError('Order must be completed to process refund', 400);
    }

    if (amount > order.totalAmount) {
        throw new AppError('Refund amount cannot exceed order amount', 400);
    }

    // Process refund logic here
    order.refundStatus = 'REFUNDED';
    order.refundAmount = amount;
    order.refundReason = reason;
    order.refundedAt = new Date();
    order.refundedBy = req.user._id;

    await order.save();

    logger.info(`Refund processed for order ${order._id}. Amount: ${amount}`);

    res.json({
        success: true,
        data: order
    });
});

// Export all controller functions in a single statement
export {
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
}; 