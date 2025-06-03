import asyncHandler from 'express-async-handler';
import ProductOrder from '../models/productOrderModel.js';
import Cart from '../models/cartModel.js';
import { calculateTax, calculateShipping } from '../services/pricingService.js';
import { sendOrderConfirmation } from '../services/notificationService.js';
import PaymentService from '../services/paymentService.js';
import PaymentModel from '../models/paymentModel.js';

// Keep existing methods unchanged
export const createOrder = asyncHandler(async (req, res) => {
    // ... existing implementation ...
});

// Add new enhanced methods
export const createOrderFromCart = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id })
        .populate('items.product');
    
    if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
    }

    const {
        shippingAddress,
        billingAddress,
        paymentMethod,
        shippingMethod
    } = req.body;

    // Calculate final amounts
    const amounts = {
        subtotal: cart.summary.subtotal,
        discount: cart.summary.discount,
        tax: await calculateTax(cart.items, billingAddress),
        shipping: await calculateShipping(cart.items, shippingMethod, shippingAddress)
    };
    amounts.total = amounts.subtotal - amounts.discount + amounts.tax + amounts.shipping;

    // Create order
    const order = await ProductOrder.create({
        orderNumber: await generateOrderNumber(),
        user: req.user._id,
        items: cart.items.map(item => ({
            product: item.product._id,
            variant: item.variant,
            quantity: item.quantity,
            price: {
                base: item.product.price,
                discount: item.discount,
                final: item.finalPrice
            },
            productSnapshot: {
                name: item.product.name,
                sku: item.product.sku,
                attributes: item.selectedAttributes
            }
        })),
        billing: { address: billingAddress },
        shipping: {
            address: shippingAddress,
            method: shippingMethod
        },
        amounts,
        payment: { method: paymentMethod }
    });

    // Clear cart
    await Cart.findByIdAndDelete(cart._id);

    // Update inventory
    await Promise.all(order.items.map(async (item) => {
        const product = await Product.findById(item.product);
        await product.updateInventory(-item.quantity, item.variant);
    }));

    // Send confirmation
    await sendOrderConfirmation(order);

    res.status(201).json(order);
});

export const processRefund = asyncHandler(async (req, res) => {
    const { orderId, items, reason } = req.body;
    const order = await ProductOrder.findById(orderId);

    if (!order) {
        throw new Error('Order not found');
    }

    // Process refund through payment gateway
    const refund = await processPaymentRefund(order, items);

    // Update order
    order.timeline.push({
        status: 'REFUNDED',
        date: new Date(),
        note: reason,
        updatedBy: req.user._id
    });

    order.payment.transactions.push({
        id: refund.id,
        amount: refund.amount,
        status: 'COMPLETED',
        type: 'REFUND',
        date: new Date()
    });

    await order.save();

    res.json(order);
});

export const initiateProductOrderPayment = asyncHandler(async (req, res) => {
    const cart = await Cart.findOne({ user: req.user._id }).populate('items.product');
    if (!cart || cart.items.length === 0) {
        throw new Error('Cart is empty');
    }
    // Calculate total
    const subtotal = cart.summary.subtotal;
    const discount = cart.summary.discount;
    const tax = await calculateTax(cart.items, req.body.billingAddress);
    const shipping = await calculateShipping(cart.items, req.body.shippingMethod, req.body.shippingAddress);
    const total = subtotal - discount + tax + shipping;
    // Initiate payment
    const paymentIntent = await PaymentService.createPaymentIntent({
        userId: req.user._id,
        amount: total,
        currency: 'INR',
        metadata: { type: 'product_order' }
    });
    const payment = await PaymentModel.create({
        user: req.user._id,
        amount: total,
        type: 'product_order',
        status: 'pending',
        paymentInfo: { cartId: cart._id },
        stripePaymentId: paymentIntent.paymentIntent.id
    });
    res.json({ paymentIntent: paymentIntent.paymentIntent, paymentId: payment._id });
});

export const confirmProductOrderAfterPayment = asyncHandler(async (req, res) => {
    const { paymentId, shippingAddress, billingAddress, shippingMethod } = req.body;
    const payment = await PaymentModel.findById(paymentId);
    if (!payment || payment.status !== 'pending') {
        throw new Error('Invalid or already processed payment');
    }
    const verified = await PaymentService.verifyPayment(paymentId);
    if (!verified) {
        throw new Error('Payment not verified');
    }
    // Proceed to create order as before, using cart info from payment.paymentInfo.cartId
    // ... (copy logic from createOrderFromCart, but use payment info)
    // After order creation:
    payment.status = 'completed';
    await payment.save();
    res.status(201).json({ success: true });
}); 