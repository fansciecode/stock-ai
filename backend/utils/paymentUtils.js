import Stripe from 'stripe';
import Razorpay from 'razorpay';
import { createLogger } from './logger.js';

const logger = createLogger('paymentUtils');

// Initialize payment gateways
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
const razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
});

/**
 * Create a Stripe payment intent
 * @param {number} amount - Amount in smallest currency unit (cents/paise)
 * @param {string} currency - Currency code (e.g., 'usd', 'inr')
 * @param {Object} metadata - Additional metadata for the payment
 * @returns {Promise<Object>} Stripe payment intent
 */
export const createStripePayment = async (amount, currency = 'inr', metadata = {}) => {
    try {
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata,
            payment_method_types: ['card']
        });

        logger.info(`Stripe payment intent created: ${paymentIntent.id}`);
        return paymentIntent;
    } catch (error) {
        logger.error('Stripe payment creation failed:', error);
        throw new Error(`Payment creation failed: ${error.message}`);
    }
};

/**
 * Create a Razorpay order
 * @param {number} amount - Amount in smallest currency unit (paise)
 * @param {string} currency - Currency code (default: INR)
 * @param {Object} notes - Additional notes for the order
 * @returns {Promise<Object>} Razorpay order
 */
export const createRazorpayOrder = async (amount, currency = 'INR', notes = {}) => {
    try {
        const order = await razorpay.orders.create({
            amount,
            currency,
            notes,
            receipt: `receipt_${Date.now()}`
        });

        logger.info(`Razorpay order created: ${order.id}`);
        return order;
    } catch (error) {
        logger.error('Razorpay order creation failed:', error);
        throw new Error(`Order creation failed: ${error.message}`);
    }
};

/**
 * Verify Razorpay payment signature
 * @param {string} orderId - Razorpay order ID
 * @param {string} paymentId - Razorpay payment ID
 * @param {string} signature - Razorpay signature
 * @returns {boolean} Whether signature is valid
 */
export const verifyRazorpayPayment = (orderId, paymentId, signature) => {
    const hmac = crypto.createHmac('sha256', process.env.RAZORPAY_SECRET);
    hmac.update(`${orderId}|${paymentId}`);
    const generatedSignature = hmac.digest('hex');
    return generatedSignature === signature;
};

/**
 * Process refund through Stripe
 * @param {string} paymentIntentId - Stripe payment intent ID
 * @param {number} amount - Amount to refund
 * @param {string} reason - Reason for refund
 * @returns {Promise<Object>} Refund details
 */
export const processStripeRefund = async (paymentIntentId, amount, reason) => {
    try {
        const refund = await stripe.refunds.create({
            payment_intent: paymentIntentId,
            amount,
            reason
        });

        logger.info(`Stripe refund processed: ${refund.id}`);
        return refund;
    } catch (error) {
        logger.error('Stripe refund failed:', error);
        throw new Error(`Refund failed: ${error.message}`);
    }
};

/**
 * Process refund through Razorpay
 * @param {string} paymentId - Razorpay payment ID
 * @param {number} amount - Amount to refund
 * @param {string} notes - Notes for refund
 * @returns {Promise<Object>} Refund details
 */
export const processRazorpayRefund = async (paymentId, amount, notes = {}) => {
    try {
        const refund = await razorpay.payments.refund(paymentId, {
            amount,
            notes
        });

        logger.info(`Razorpay refund processed: ${refund.id}`);
        return refund;
    } catch (error) {
        logger.error('Razorpay refund failed:', error);
        throw new Error(`Refund failed: ${error.message}`);
    }
};

/**
 * Calculate payment gateway charges
 * @param {number} amount - Transaction amount
 * @param {string} gateway - Payment gateway ('stripe' or 'razorpay')
 * @returns {Object} Charges breakdown
 */
export const calculateCharges = (amount, gateway = 'razorpay') => {
    const charges = {
        amount,
        gateway,
        gatewayCharges: 0,
        gst: 0,
        total: amount
    };

    if (gateway === 'stripe') {
        // Stripe charges 2.9% + 30 cents per successful card charge
        charges.gatewayCharges = Math.ceil((amount * 0.029) + 30);
    } else if (gateway === 'razorpay') {
        // Razorpay charges 2% + GST
        charges.gatewayCharges = Math.ceil(amount * 0.02);
        charges.gst = Math.ceil(charges.gatewayCharges * 0.18);
    }

    charges.total = amount + charges.gatewayCharges + charges.gst;
    return charges;
};

/**
 * Format amount for display
 * @param {number} amount - Amount in smallest currency unit
 * @param {string} currency - Currency code
 * @returns {string} Formatted amount
 */
export const formatAmount = (amount, currency = 'INR') => {
    const formatter = new Intl.NumberFormat('en-IN', {
        style: 'currency',
        currency
    });
    return formatter.format(amount / 100);
};

/**
 * Process payment through selected payment gateway
 * Supports both old and new payment formats
 * @param {Object} params Payment parameters
 * @returns {Promise<Object>} Payment result
 */
export const processPayment = async (params) => {
    try {
        let amount, currency, paymentMethod, orderId, customerId, paymentDetails;

        // Handle old format
        if (typeof params === 'object' && 'paymentData' in params) {
            ({ amount, currency = 'INR', paymentMethod } = params.paymentData);
            orderId = params.orderId;
            customerId = params.userId;
            paymentDetails = params.paymentData.details;
        } 
        // Handle new format
        else {
            ({ amount, currency = 'INR', paymentMethod, orderId, customerId, ...paymentDetails } = params);
        }

        let paymentResult;

        switch (paymentMethod) {
            case 'STRIPE':
                const stripeIntent = await createStripePayment(amount, currency.toLowerCase(), {
                    orderId,
                    customerId,
                    ...paymentDetails
                });
                paymentResult = {
                    status: stripeIntent.status === 'succeeded' ? 'COMPLETED' : 'PENDING',
                    transactionId: stripeIntent.id,
                    gateway: 'STRIPE'
                };
                break;

            case 'RAZORPAY':
                const razorpayOrder = await createRazorpayOrder(amount, currency, {
                    orderId,
                    customerId,
                    ...paymentDetails
                });
                paymentResult = {
                    status: 'PENDING', // Razorpay needs client-side confirmation
                    transactionId: razorpayOrder.id,
                    gateway: 'RAZORPAY'
                };
                break;

            default:
                // Support legacy payment methods
                const legacyPayment = await executePaymentProcessing(customerId, amount);
                paymentResult = {
                    status: legacyPayment.success ? 'COMPLETED' : 'FAILED',
                    transactionId: legacyPayment.transactionId,
                    gateway: 'LEGACY'
                };
        }

        logger.info(`Payment processed: ${paymentResult.transactionId}`);
        return paymentResult;

    } catch (error) {
        logger.error('Payment processing failed:', error);
        throw new Error(`Payment processing failed: ${error.message}`);
    }
};

/**
 * Initiate refund for a payment
 * Supports both old and new refund formats
 * @param {Object} params Refund parameters
 * @returns {Promise<Object>} Refund result
 */
export const initiateRefund = async (params) => {
    try {
        let paymentId, gateway, amount, reason;

        // Handle old format
        if (typeof params === 'object' && 'transactionId' in params) {
            paymentId = params.transactionId;
            amount = params.amount;
            reason = params.reason || 'Customer requested';
            gateway = params.gateway || 'LEGACY';
        }
        // Handle new format
        else {
            ({ paymentId, gateway, amount, reason } = params);
        }

        let refundResult;

        switch (gateway) {
            case 'STRIPE':
                const stripeRefund = await processStripeRefund(paymentId, amount, reason);
                refundResult = {
                    status: stripeRefund.status,
                    refundId: stripeRefund.id,
                    amount: stripeRefund.amount
                };
                break;

            case 'RAZORPAY':
                const razorpayRefund = await processRazorpayRefund(paymentId, amount, { reason });
                refundResult = {
                    status: razorpayRefund.status,
                    refundId: razorpayRefund.id,
                    amount: razorpayRefund.amount
                };
                break;

            default:
                // Support legacy refund process
                const legacyRefund = await PaymentService.processRefund(paymentId, { amount, reason });
                refundResult = {
                    status: legacyRefund.success ? 'COMPLETED' : 'FAILED',
                    refundId: legacyRefund.refundId || paymentId,
                    amount: amount
                };
        }

        logger.info(`Refund initiated: ${refundResult.refundId}`);
        return refundResult;

    } catch (error) {
        logger.error('Refund initiation failed:', error);
        throw new Error(`Refund initiation failed: ${error.message}`);
    }
}; 