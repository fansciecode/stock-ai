import asyncHandler from 'express-async-handler';
import ProductOrder from '../models/productOrderModel.js';
import Cart from '../models/cartModel.js';
import { calculateTax, calculateShipping } from '../services/pricingService.js';
import { sendOrderConfirmation } from '../services/notificationService.js';

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