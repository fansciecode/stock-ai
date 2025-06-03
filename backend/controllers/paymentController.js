import Stripe from 'stripe';
import dotenv from 'dotenv';
import { EventModel } from '../models/eventModel.js';
import PaymentModel  from '../models/paymentModel.js';
import { UserModel } from '../models/userModel.js';
import logger from '../utils/logger.js';
import asyncHandler from 'express-async-handler';
import {
    createStripePayment,
    createRazorpayOrder,
    processStripeRefund,
    calculateCharges,
    formatAmount
} from '../utils/paymentUtils.js';
import crypto from 'crypto';
import UpgradePricingModel from '../models/upgradePricingModel.js';
import { generateTicketNumber, generateQRCode } from '../utils/ticketUtils.js';
dotenv.config();
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// @desc    Upgrade event payment
// @route   POST /api/payments/upgrade/:eventId
// @access  Private
const upgradeEventPayment = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { upgradeType, paymentMethodId, paymentMethod } = req.body;

  try {
    // 1. Fetch the event
    const event = await EventModel.findById(eventId);
    if (!event) {
      res.status(404);
      throw new Error('Event not found');
    }

    // 2. Verify the user owns the event
    if (event.organizer.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to upgrade this event');
    }

    // 3. Verify event can be upgraded
    if (event.upgradeStatus === 'vip') {
      res.status(400);
      throw new Error('Event is already at the highest upgrade level');
    }

    // 4. Get upgrade price from model
    const amount = event.getUpgradePrice ? event.getUpgradePrice(upgradeType) : null;
    if (amount === null) {
      res.status(400);
      throw new Error('Invalid upgrade path');
    }

    // 5. Razorpay flow
    if ((paymentMethod && paymentMethod.toLowerCase() === 'razorpay') || (paymentMethodId && paymentMethodId.startsWith('pay_'))) {
      // Verify Razorpay payment
      const payment = await PaymentModel.create({
        user: req.user._id,
        event: eventId,
        amount,
        type: 'event_upgrade',
        status: 'Pending',
        provider: 'razorpay',
        razorpayPaymentId: paymentMethodId,
        paymentInfo: {
          eventId,
          upgradeType,
          isEventUpgrade: true,
          previousStatus: event.upgradeStatus || 'none'
        }
      });
      // Optionally, verify payment with Razorpay API here if needed
      // For now, mark as completed
      payment.status = 'Completed';
      await payment.save();

      // Mark event as upgraded
      event.upgradeStatus = upgradeType;
      event.upgradedAt = Date.now();
      event.previousUpgradeStatus = event.upgradeStatus || 'none';
      switch (upgradeType) {
        case 'featured':
          event.isFeatured = true;
          event.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          break;
        case 'premium':
          event.isPremium = true;
          event.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          event.maxAttendees += 50;
          break;
        case 'vip':
          event.isVIP = true;
          event.vipUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          event.maxAttendees += 100;
          event.allowsPrivateBookings = true;
          break;
      }
      await event.save();
      logger.info(`Event ${eventId} upgraded to ${upgradeType} via Razorpay by user ${req.user._id}`);
      return res.status(200).json({
        success: true,
        paymentStatus: 'Completed',
        paymentId: payment._id,
        event: {
          id: event._id,
          title: event.title,
          upgradeStatus: event.upgradeStatus,
          upgradedAt: event.upgradedAt
        }
      });
    }

    // 6. Stripe flow (default)
    // Calculate charges including gateway fees
    const charges = calculateCharges(amount, 'stripe');

    // 7. Create or get customer
    let customer;
    const existingCustomers = await stripe.customers.list({
      email: req.user.email,
      limit: 1
    });

    if (existingCustomers.data.length > 0) {
      customer = existingCustomers.data[0];
    } else {
      customer = await stripe.customers.create({
        email: req.user.email,
        payment_method: paymentMethodId,
        metadata: {
          userId: req.user._id.toString()
        }
      });
    }

    // 8. Create payment intent
    const paymentIntent = await createStripePayment(
        charges.total,
        'usd',
        {
            eventId,
            userId: req.user._id.toString(),
            upgradeType,
            previousStatus: event.upgradeStatus || 'none'
        }
    );

    // 9. Create payment record
    const payment = await PaymentModel.create({
      user: req.user._id,
      event: eventId,
      amount,
      type: 'event_upgrade',
      status: paymentIntent.status === 'succeeded' ? 'completed' : 'pending',
      stripePaymentId: paymentIntent.id,
      stripeCustomerId: customer.id,
      paymentInfo: {
        eventId,
        upgradeType,
        isEventUpgrade: true,
        previousStatus: event.upgradeStatus || 'none'
      }
    });

    // 10. If payment succeeded, update event
    if (paymentIntent.status === 'succeeded') {
      event.upgradeStatus = upgradeType;
      event.upgradedAt = Date.now();
      event.previousUpgradeStatus = event.upgradeStatus || 'none';
      await event.save();

      // 11. Handle upgrade-specific actions
      switch (upgradeType) {
        case 'featured':
          // Add event to featured listings
          event.isFeatured = true;
          event.featuredUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days
          break;
        case 'premium':
          // Add premium benefits
          event.isPremium = true;
          event.premiumUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          event.maxAttendees += 50; // Increase capacity
          break;
        case 'vip':
          // Add VIP benefits
          event.isVIP = true;
          event.vipUntil = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000);
          event.maxAttendees += 100; // Increase capacity further
          event.allowsPrivateBookings = true;
          break;
      }
      await event.save();
    }

    // 12. Prepare response
    const response = {
      success: true,
      paymentStatus: paymentIntent.status,
      paymentId: payment._id,
      event: {
        id: event._id,
        title: event.title,
        upgradeStatus: event.upgradeStatus,
        upgradedAt: event.upgradedAt
      },
      charges: {
        subtotal: formatAmount(amount, 'usd'),
        fees: formatAmount(charges.gatewayCharges, 'usd'),
        total: formatAmount(charges.total, 'usd')
      }
    };

    // 13. Add additional action if needed
    if (paymentIntent.status === 'requires_action') {
      response.requiresAction = true;
      response.clientSecret = paymentIntent.client_secret;
    }

    res.status(200).json(response);

  } catch (error) {
    logger.error('Error processing event upgrade payment:', error);
    res.status(400);
    throw new Error(error.message || 'Error processing event upgrade payment');
  }
});

// @desc    Initiate a new payment
// @route   POST /api/payments/initiate
// @access  Private
const initiatePayment = asyncHandler(async (req, res) => {
    const { 
        amount, 
        currency = 'usd', 
        description, 
        type, 
        eventId,
        paymentMethod = 'stripe',
        metadata = {} 
    } = req.body;

    try {
        // 1. Validate input
        if (!amount || amount <= 0) {
            res.status(400);
            throw new Error('Valid amount is required');
        }

        if (!type) {
            res.status(400);
            throw new Error('Payment type is required');
        }

        // 2. If payment is for an event, verify event exists
        if (eventId) {
            const event = await EventModel.findById(eventId);
            if (!event) {
                res.status(404);
                throw new Error('Event not found');
            }

            // Verify event payment hasn't already been made
            const existingPayment = await PaymentModel.findOne({
                event: eventId,
                status: 'completed'
            });

            if (existingPayment) {
                res.status(400);
                throw new Error('Payment for this event already exists');
            }
        }

        // 3. Create a payment record in our database
        if (type === 'subscription' || type === 'package') {
            // For subscription/package payments, require planId and paymentInfo
            const { planId, paymentInfo, paymentMethod = 'stripe', metadata = {} } = req.body;
            if (!planId || !paymentInfo) {
                res.status(400);
                throw new Error('planId and paymentInfo are required for subscription/package payments');
            }
            const plan = await import('../models/subscriptionModel.js').then(m => m.default.findById(planId));
            if (!plan) {
                res.status(404);
                throw new Error('Subscription plan not found');
            }
            const payment = await PaymentModel.create({
                user: req.user._id,
                plan: planId,
                amount: plan.price,
                status: 'Pending',
                paymentInfo
            });
            if (paymentMethod.toLowerCase() === 'razorpay') {
                // Razorpay expects INR and amount in paise
                let razorpayCurrency = 'INR';
                // Convert rupees to paise
                const amountPaise = plan.price * 100;
                const notes = { description: `Payment for plan ${plan.planName}`, ...metadata };
                const razorpayOrder = await createRazorpayOrder(amountPaise, razorpayCurrency, notes);
                payment.externalPaymentId = razorpayOrder.id;
                payment.provider = 'razorpay';
                await payment.save();
                return res.status(200).json({
                    success: true,
                    paymentId: payment._id,
                    razorpayOrderId: razorpayOrder.id,
                    amount: razorpayOrder.amount,
                    currency: razorpayOrder.currency,
                    status: payment.status,
                    type,
                    description: `Payment for plan ${plan.planName}`,
                    provider: 'razorpay',
                    notes: razorpayOrder.notes
                });
            }
            // Default: Stripe or other
            return res.status(200).json({
                success: true,
                paymentId: payment._id,
                amount: plan.price,
                status: payment.status
            });
        }

        // 4. Create a payment record in our database
        const payment = await PaymentModel.create({
            user: req.user._id,
            event: eventId,
            amount,
            currency,
            description,
            type,
            status: 'Pending',
            plan: null,
            paymentInfo: req.body.paymentInfo || {}, // Always save paymentInfo from request
            metadata: {
                ...metadata,
                userId: req.user._id.toString(),
                eventId: eventId || null,
                paymentMethod
            }
        });

        if (paymentMethod.toLowerCase() === 'razorpay') {
            // Razorpay expects INR and amount in paise
            let razorpayCurrency = 'INR';
            if (currency.toUpperCase() !== 'INR') {
                logger.warn && logger.warn(`Razorpay only supports INR. Overriding currency from ${currency} to INR.`);
            }
            // Convert rupees to paise
            const amountPaise = amount * 100;
            const notes = { description, ...metadata };
            const razorpayOrder = await createRazorpayOrder(amountPaise, razorpayCurrency, notes);
            // Update payment record with Razorpay order ID
            payment.externalPaymentId = razorpayOrder.id;
            payment.provider = 'razorpay';
            await payment.save();
            // Respond with Razorpay order details
            return res.status(200).json({
                success: true,
                paymentId: payment._id,
                razorpayOrderId: razorpayOrder.id,
                amount: razorpayOrder.amount,
                currency: razorpayOrder.currency,
                status: payment.status,
                type,
                description,
                provider: 'razorpay',
                notes: razorpayOrder.notes
            });
        }

        // 4. Create a payment intent with Stripe (default)
        const paymentIntent = await stripe.paymentIntents.create({
            amount,
            currency,
            metadata: {
                paymentId: payment._id.toString(),
                userId: req.user._id.toString(),
                eventId: eventId || null,
                type,
                ...metadata
            },
            description,
            automatic_payment_methods: {
                enabled: true,
                allow_redirects: 'always'
            },
            setup_future_usage: type === 'event_payment' ? null : 'off_session'
        });

        // 5. Update payment record with Stripe payment intent ID
        payment.stripePaymentId = paymentIntent.id;
        payment.provider = 'stripe';
        await payment.save();

        // 6. Prepare response for Stripe
        const response = {
            success: true,
            paymentId: payment._id,
            clientSecret: paymentIntent.client_secret,
            amount,
            currency,
            status: payment.status,
            type,
            description,
            provider: 'stripe',
            requiresAction: paymentIntent.status === 'requires_action',
            nextAction: paymentIntent.next_action
        };

        // 7. If this is an event payment, include event details
        if (eventId) {
            const event = await EventModel.findById(eventId).select('title date price');
            response.event = event;
        }

        res.status(200).json(response);

    } catch (error) {
        logger.error('Error initiating payment:', error);
        res.status(400);
        throw new Error(error.message || 'Error initiating payment');
    }
});

// @desc    Confirm payment intent
// @route   POST /api/payments/confirm
// @access  Private
const confirmPaymentIntent = asyncHandler(async (req, res) => {
    const { paymentIntentId, paymentMethodId } = req.body;

    try {
        // 1. Validate input
        if (!paymentIntentId || !paymentMethodId) {
            res.status(400);
            throw new Error('Payment intent ID and payment method ID are required');
        }

        // 2. Retrieve the payment intent
        const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

        // 3. Verify that this payment intent belongs to the current user
        if (paymentIntent.metadata.userId !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to confirm this payment');
        }

        // 4. Confirm the payment intent with the provided payment method
        const confirmedPayment = await stripe.paymentIntents.confirm(
            paymentIntentId,
            {
                payment_method: paymentMethodId,
            }
        );

        // 5. Handle different payment statuses
        let response = {
            success: true,
            status: confirmedPayment.status,
            paymentIntentId: confirmedPayment.id
        };

        switch (confirmedPayment.status) {
            case 'succeeded':
                // Payment successful
                response.message = 'Payment processed successfully';
                
                // Update payment record if it exists
                const payment = await PaymentModel.findOne({ stripePaymentId: paymentIntentId });
                if (payment) {
                    payment.status = 'completed';
                    payment.updatedAt = Date.now();
                    await payment.save();
                }

                // If this was for an event, update event status
                if (confirmedPayment.metadata.eventId) {
                    await EventModel.findByIdAndUpdate(
                        confirmedPayment.metadata.eventId,
                        { paymentStatus: 'paid' }
                    );
                }
                break;

            case 'requires_action':
                // 3D Secure authentication required
                response.message = 'Additional authentication required';
                response.requiresAction = true;
                response.clientSecret = confirmedPayment.client_secret;
                break;

            case 'requires_payment_method':
                // Payment failed, need new payment method
                response.message = 'Payment failed, please try another payment method';
                response.requiresNewPaymentMethod = true;

                // Update payment record to failed status
                if (payment) {
                    payment.status = 'failed';
                    payment.updatedAt = Date.now();
                    await payment.save();
                }
                break;

            default:
                response.message = `Payment status: ${confirmedPayment.status}`;
        }

        // 6. Send response
        res.status(200).json(response);

  } catch (error) {
        logger.error('Error confirming payment:', error);
    res.status(400);
        throw new Error(error.message || 'Error confirming payment');
  }
});

// @desc    Get payment status
// @route   GET /api/payments/status/:paymentId
// @access  Private
const getPaymentStatus = asyncHandler(async (req, res) => {
  const { paymentId } = req.params;

  try {
    // 1. Check local payment record
    const payment = await PaymentModel.findById(paymentId);
    if (!payment) {
      res.status(404);
      throw new Error('Payment not found');
    }

    // 2. Verify user authorization
    if (payment.user.toString() !== req.user._id.toString()) {
      res.status(403);
      throw new Error('Not authorized to view this payment');
    }

    // 3. Get detailed status from Stripe
    let stripePayment;
    if (payment.type === 'subscription') {
      stripePayment = await stripe.subscriptions.retrieve(payment.stripeSubscriptionId);
    } else {
      stripePayment = await stripe.paymentIntents.retrieve(payment.stripePaymentId);
    }

    // 4. Prepare response with comprehensive payment details
    const response = {
      id: payment._id,
      amount: payment.amount,
      status: payment.status,
      type: payment.type,
      createdAt: payment.createdAt,
      stripeStatus: payment.type === 'subscription' ? stripePayment.status : stripePayment.status,
      paymentMethod: stripePayment.payment_method || stripePayment.default_payment_method,
      metadata: stripePayment.metadata,
      lastPaymentError: stripePayment.last_payment_error,
      nextPaymentAttempt: payment.type === 'subscription' ? 
        stripePayment.current_period_end * 1000 : null,
      details: {
        event: payment.event,
        plan: payment.plan,
        interval: payment.interval
      }
    };

    // 5. If payment failed, include failure reason
    if (stripePayment.status === 'failed' || stripePayment.status === 'canceled') {
      response.failureReason = stripePayment.last_payment_error?.message || 
                             'Payment was unsuccessful';
      response.failureCode = stripePayment.last_payment_error?.code;
    }

    res.status(200).json(response);
  } catch (error) {
    logger.error('Error retrieving payment status:', error);
    res.status(error.status || 400);
    throw new Error(error.message || 'Error retrieving payment status');
  }
});

// @desc    Process a refund request
// @route   POST /api/payments/refund
// @access  Private
const processRefund = asyncHandler(async (req, res) => {
    const { paymentId, amount, reason } = req.body;

    try {
        // 1. Find the payment record
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }

        // 2. Verify user authorization
        if (payment.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to refund this payment');
        }

        // 3. Check if payment is already refunded
        if (payment.status === 'refunded') {
            res.status(400);
            throw new Error('Payment has already been refunded');
        }

        // 4. Check if payment is eligible for refund
        if (!['succeeded', 'settled'].includes(payment.status)) {
            res.status(400);
            throw new Error('Payment is not eligible for refund');
        }

        // Use utility function for refund
        const refund = await processStripeRefund(
            payment.stripePaymentId,
            amount || undefined,
            reason || 'requested_by_customer'
        );

        // 6. Update payment record
        payment.status = 'refunded';
        payment.refundId = refund.id;
        payment.refundAmount = refund.amount;
        payment.refundReason = reason;
        payment.refundedAt = Date.now();
        await payment.save();

        // 7. If this was a subscription payment, handle subscription cancellation
        if (payment.type === 'subscription' && payment.stripeSubscriptionId) {
            try {
                await stripe.subscriptions.cancel(payment.stripeSubscriptionId, {
                    prorate: true
                });

                // Update user's subscription status
                await UserModel.findByIdAndUpdate(req.user._id, {
                    subscriptionStatus: 'canceled',
                    subscriptionPlan: null
                });
            } catch (subscriptionError) {
                logger.error('Error canceling subscription:', subscriptionError);
                // Continue with refund response even if subscription cancellation fails
            }
        }

        // 8. If this was an event payment, update event status
        if (payment.event) {
            try {
                const event = await EventModel.findById(payment.event);
                if (event) {
                    event.paymentStatus = 'refunded';
                    await event.save();
                }
            } catch (eventError) {
                logger.error('Error updating event status:', eventError);
                // Continue with refund response even if event update fails
            }
        }

        // 9. Send response
        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refund.amount,
                status: refund.status,
                reason: refund.reason,
                created: new Date(refund.created * 1000)
            },
            payment: {
                id: payment._id,
                originalAmount: payment.amount,
                refundAmount: refund.amount,
                status: payment.status
            }
        });
  } catch (error) {
        logger.error('Error processing refund:', error);
        res.status(error.status || 400);
        throw new Error(error.message || 'Error processing refund');
  }
});

// @desc    Process subscription payment
// @route   POST /api/subscriptions/payment
// @access  Private
const processSubscriptionPayment = asyncHandler(async (req, res) => {
    const { subscriptionPlan, paymentMethodId } = req.body;

    try {
        // 1. Validate subscription plan
        let amount;
        let interval;
        switch (subscriptionPlan) {
            case 'basic':
                amount = 999; // $9.99 per month
                interval = 'month';
                break;
            case 'premium':
                amount = 1999; // $19.99 per month
                interval = 'month';
                break;
            case 'business':
                amount = 4999; // $49.99 per month
                interval = 'month';
                break;
            case 'basic_annual':
                amount = 9990; // $99.90 per year
                interval = 'year';
                break;
            case 'premium_annual':
                amount = 19990; // $199.90 per year
                interval = 'year';
                break;
            case 'business_annual':
                amount = 49990; // $499.90 per year
                interval = 'year';
                break;
            default:
    res.status(400);
                throw new Error('Invalid subscription plan');
        }

        // 2. Create or get customer
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: req.user.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
        } else {
            customer = await stripe.customers.create({
                email: req.user.email,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId
                }
            });
        }

        // 3. Create subscription price
        const price = await stripe.prices.create({
            unit_amount: amount,
            currency: 'usd',
            recurring: {
                interval: interval
            },
            product_data: {
                name: `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan`
            }
        });

        // 4. Create subscription
        const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription'
            },
            metadata: {
                userId: req.user._id.toString(),
                plan: subscriptionPlan
            },
            expand: ['latest_invoice.payment_intent']
        });

        // 5. Create payment record
        await PaymentModel.create({
            user: req.user._id,
      amount,
            type: 'subscription',
            status: subscription.status === 'active' ? 'completed' : 'pending',
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customer.id,
      metadata: {
                plan: subscriptionPlan,
                interval: interval
            }
        });

        // 6. Update user's subscription status
        await UserModel.findByIdAndUpdate(req.user._id, {
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscriptionPlan,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id
        });

        // 7. Handle response based on payment intent status
        const invoice = subscription.latest_invoice;
        const paymentIntent = invoice.payment_intent;

        let response = {
            subscriptionId: subscription.id,
            status: subscription.status,
            plan: subscriptionPlan,
            interval: interval,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        };

        if (paymentIntent.status === 'requires_action') {
            response.clientSecret = paymentIntent.client_secret;
            response.requiresAction = true;
        }

        res.status(200).json({
      success: true,
            data: response
    });

  } catch (error) {
        logger.error('Error processing subscription payment:', error);
    res.status(400);
        throw new Error(error.message || 'Error processing subscription payment');
  }
});

// @desc    Process a payment
// @route   POST /api/payments/process
// @access  Private
const processPayment = asyncHandler(async (req, res) => {
    const { 
        paymentMethodId, 
        paymentId,
        savePaymentMethod = false
    } = req.body;

    try {
        // 1. Find the payment record
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }

        // 2. Verify user authorization
        if (payment.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to process this payment');
        }

        // 3. Check if payment has already been processed
        if (payment.status === 'completed') {
            res.status(400);
            throw new Error('Payment has already been processed');
        }

        // 4. Get or create customer if saving payment method
        let customerId = null;
        if (savePaymentMethod) {
            const existingCustomers = await stripe.customers.list({
                email: req.user.email,
                limit: 1
            });

            if (existingCustomers.data.length > 0) {
                customerId = existingCustomers.data[0].id;
            } else {
                const customer = await stripe.customers.create({
                    email: req.user.email,
                    metadata: {
                        userId: req.user._id.toString()
                    }
                });
                customerId = customer.id;

                // Update user with customer ID
                await UserModel.findByIdAndUpdate(req.user._id, {
                    stripeCustomerId: customerId
                });
            }
        }

        // 5. Create or update payment intent
        let paymentIntent;
        if (payment.stripePaymentId) {
            // Update existing payment intent
            paymentIntent = await stripe.paymentIntents.update(
                payment.stripePaymentId,
                {
                    payment_method: paymentMethodId,
                    customer: customerId,
                    setup_future_usage: savePaymentMethod ? 'off_session' : null
                }
            );
        } else {
            // Create new payment intent
            paymentIntent = await stripe.paymentIntents.create({
                amount: payment.amount,
                currency: payment.currency,
      payment_method: paymentMethodId,
                customer: customerId,
                confirm: true,
                setup_future_usage: savePaymentMethod ? 'off_session' : null,
                metadata: {
                    paymentId: payment._id.toString(),
                    userId: req.user._id.toString(),
                    type: payment.type,
                    ...payment.metadata
                }
            });

            // Update payment record with payment intent ID
            payment.stripePaymentId = paymentIntent.id;
        }

        // 6. Confirm the payment
        if (paymentIntent.status !== 'succeeded') {
            paymentIntent = await stripe.paymentIntents.confirm(paymentIntent.id);
        }

        // 7. Handle different payment statuses
        let response = {
      success: true,
            status: paymentIntent.status,
      paymentIntentId: paymentIntent.id
        };

        switch (paymentIntent.status) {
            case 'succeeded':
                // Update payment record
                payment.status = 'completed';
                payment.completedAt = Date.now();
                await payment.save();

                // If this was an event payment, update event status
                if (payment.type === 'event_payment' && payment.metadata.eventId) {
                    await EventModel.findByIdAndUpdate(
                        payment.metadata.eventId,
                        { paymentStatus: 'paid' }
                    );
                }

                response.message = 'Payment processed successfully';
                break;

            case 'requires_action':
                response.message = 'Additional authentication required';
                response.requiresAction = true;
                response.clientSecret = paymentIntent.client_secret;
                break;

            case 'requires_payment_method':
                payment.status = 'failed';
                await payment.save();
                
                response.message = 'Payment failed, please try another payment method';
                response.requiresNewPaymentMethod = true;
                break;

            default:
                response.message = `Payment status: ${paymentIntent.status}`;
        }

        // 8. If payment method was saved, add it to the response
        if (savePaymentMethod && paymentIntent.status === 'succeeded') {
            const paymentMethod = await stripe.paymentMethods.retrieve(paymentMethodId);
            response.paymentMethod = {
                id: paymentMethod.id,
                brand: paymentMethod.card.brand,
                last4: paymentMethod.card.last4,
                expMonth: paymentMethod.card.exp_month,
                expYear: paymentMethod.card.exp_year
            };
        }

        res.status(200).json(response);

  } catch (error) {
        logger.error('Error processing payment:', error);
        res.status(400);
        throw new Error(error.message || 'Error processing payment');
    }
});

// @desc    Create a new subscription
// @route   POST /api/payments/subscription/create
// @access  Private
const createSubscription = asyncHandler(async (req, res) => {
    const { 
        subscriptionPlan, 
        paymentMethodId,
        billingCycle = 'month',  // 'month' or 'year'
        automaticPayment = true 
    } = req.body;

    try {
        // 1. Validate if user already has an active subscription
        const existingUser = await UserModel.findById(req.user._id);
        if (existingUser.subscriptionStatus === 'active') {
            res.status(400);
            throw new Error('User already has an active subscription');
        }

        // 2. Validate subscription plan and get pricing
        const planPricing = {
            basic: {
                month: 999,    // $9.99/month
                year: 9990     // $99.90/year
            },
            premium: {
                month: 1999,   // $19.99/month
                year: 19990    // $199.90/year
            },
            business: {
                month: 4999,   // $49.99/month
                year: 49990    // $499.90/year
            }
        };

        if (!planPricing[subscriptionPlan]) {
            res.status(400);
            throw new Error('Invalid subscription plan');
        }

        const amount = planPricing[subscriptionPlan][billingCycle];
        if (!amount) {
            res.status(400);
            throw new Error('Invalid billing cycle');
        }

        // 3. Create or get Stripe customer
        let customer;
        const existingCustomers = await stripe.customers.list({
            email: req.user.email,
            limit: 1
        });

        if (existingCustomers.data.length > 0) {
            customer = existingCustomers.data[0];
            // Update customer's payment method if provided
            if (paymentMethodId) {
                await stripe.paymentMethods.attach(paymentMethodId, {
                    customer: customer.id
                });
                await stripe.customers.update(customer.id, {
                    invoice_settings: {
                        default_payment_method: paymentMethodId
                    }
                });
            }
        } else {
            // Create new customer with payment method
            customer = await stripe.customers.create({
                email: req.user.email,
                payment_method: paymentMethodId,
                invoice_settings: {
                    default_payment_method: paymentMethodId
                },
                metadata: {
                    userId: req.user._id.toString()
                }
            });
        }

        // 4. Create subscription price if it doesn't exist
        const priceId = `${subscriptionPlan}_${billingCycle}`;
        let price;
        try {
            price = await stripe.prices.retrieve(priceId);
        } catch {
            price = await stripe.prices.create({
                unit_amount: amount,
                currency: 'usd',
                recurring: {
                    interval: billingCycle
                },
                product_data: {
                    name: `${subscriptionPlan.charAt(0).toUpperCase() + subscriptionPlan.slice(1)} Plan - ${billingCycle}ly`
                },
                lookup_key: priceId
            });
        }

        // 5. Create the subscription
    const subscription = await stripe.subscriptions.create({
            customer: customer.id,
            items: [{ price: price.id }],
            payment_behavior: automaticPayment ? 'default_incomplete' : 'allow_incomplete',
            payment_settings: {
                payment_method_types: ['card'],
                save_default_payment_method: 'on_subscription'
            },
            metadata: {
                userId: req.user._id.toString(),
                plan: subscriptionPlan,
                billingCycle: billingCycle
            },
      expand: ['latest_invoice.payment_intent']
    });

        // 6. Create subscription record in our database
        const subscriptionRecord = await PaymentModel.create({
            user: req.user._id,
            type: 'subscription',
            amount: amount,
            status: subscription.status,
            stripeSubscriptionId: subscription.id,
            stripeCustomerId: customer.id,
            paymentInfo: {
                eventId,
                upgradeType,
                isEventUpgrade: true,
                previousStatus: event.upgradeStatus || 'none'
            }
        });

        // 7. Update user's subscription status
        await UserModel.findByIdAndUpdate(req.user._id, {
            subscriptionStatus: subscription.status,
            subscriptionPlan: subscriptionPlan,
            stripeCustomerId: customer.id,
            stripeSubscriptionId: subscription.id,
            subscriptionStartDate: new Date(),
            subscriptionEndDate: new Date(subscription.current_period_end * 1000)
        });

        // 8. Prepare response based on subscription status
        const response = {
      success: true,
      subscriptionId: subscription.id,
            status: subscription.status,
            plan: subscriptionPlan,
            billingCycle: billingCycle,
            currentPeriodEnd: new Date(subscription.current_period_end * 1000)
        };

        // Add payment intent details if payment is required
        if (subscription.latest_invoice.payment_intent) {
            response.paymentIntent = {
                clientSecret: subscription.latest_invoice.payment_intent.client_secret,
                status: subscription.latest_invoice.payment_intent.status
            };
        }

        res.status(200).json(response);

  } catch (error) {
        logger.error('Error creating subscription:', error);
        res.status(400);
        throw new Error(error.message || 'Error creating subscription');
    }
});

// @desc    Cancel subscription
// @route   POST /api/payments/subscription/cancel
// @access  Private
const cancelSubscription = asyncHandler(async (req, res) => {
  try {
        // 1. Get user's subscription details
        const user = await UserModel.findById(req.user._id);
        if (!user.stripeSubscriptionId) {
            res.status(400);
            throw new Error('No active subscription found');
        }

        // 2. Cancel subscription in Stripe
        const subscription = await stripe.subscriptions.update(
            user.stripeSubscriptionId,
            {
                cancel_at_period_end: true,
                metadata: {
                    canceledBy: req.user._id.toString(),
                    canceledAt: new Date().toISOString()
                }
            }
        );

        // 3. Update subscription status in payment record
        await PaymentModel.findOneAndUpdate(
            { stripeSubscriptionId: user.stripeSubscriptionId },
            {
                $set: {
                    status: 'canceling',
                    metadata: {
                        ...subscription.metadata,
                        cancelAt: subscription.cancel_at
                    }
                }
            }
        );

        // 4. Update user's subscription status
        user.subscriptionStatus = 'canceling';
        user.subscriptionEndsAt = new Date(subscription.cancel_at * 1000);
        await user.save();

        // 5. Send response
        res.status(200).json({
            success: true,
            message: 'Subscription will be canceled at the end of the billing period',
            data: {
                subscriptionId: subscription.id,
                currentPeriodEnd: new Date(subscription.current_period_end * 1000),
                cancelAt: new Date(subscription.cancel_at * 1000),
                status: 'canceling'
            }
        });

    } catch (error) {
        logger.error('Error canceling subscription:', error);
        res.status(400);
        throw new Error(error.message || 'Error canceling subscription');
    }
});

// Helper functions for webhook handling
async function handlePaymentSuccess(paymentIntent) {
  const { eventId, userId } = paymentIntent.metadata;

  await PaymentModel.create({
    user: userId,
    event: eventId,
    amount: paymentIntent.amount,
    status: 'completed',
    stripePaymentId: paymentIntent.id
  });

  // Update event or user status as needed
  if (eventId) {
    const event = await EventModel.findById(eventId);
    if (event) {
      event.paymentStatus = 'paid';
      await event.save();
    }
  }
}

async function handlePaymentFailure(paymentIntent) {
  const { eventId, userId } = paymentIntent.metadata;

  await PaymentModel.create({
    user: userId,
    event: eventId,
    amount: paymentIntent.amount,
    status: 'failed',
    stripePaymentId: paymentIntent.id
  });

  // Handle failure consequences (e.g., cancel registration)
  if (eventId) {
    const event = await EventModel.findById(eventId);
    if (event) {
      event.paymentStatus = 'failed';
      await event.save();
    }
  }
}

// Subscription webhook handlers
const handleSubscriptionCreated = async (subscription) => {
    try {
        const { customer, metadata } = subscription;
        await UserModel.findByIdAndUpdate(metadata.userId, {
            subscriptionStatus: 'active',
            subscriptionPlan: metadata.plan,
            stripeCustomerId: customer,
            stripeSubscriptionId: subscription.id
        });
    } catch (error) {
        logger.error('Error handling subscription creation:', error);
    }
};

const handleSubscriptionUpdated = async (subscription) => {
    try {
        const user = await UserModel.findOne({ stripeSubscriptionId: subscription.id });
        if (user) {
            user.subscriptionStatus = subscription.status;
            user.subscriptionPlan = subscription.metadata.plan;
            await user.save();
        }
    } catch (error) {
        logger.error('Error handling subscription update:', error);
    }
};

const handleSubscriptionCancelled = async (subscription) => {
    try {
        const user = await UserModel.findOne({ stripeSubscriptionId: subscription.id });
        if (user) {
            user.subscriptionStatus = 'cancelled';
            user.subscriptionPlan = null;
            await user.save();
        }
    } catch (error) {
        logger.error('Error handling subscription cancellation:', error);
    }
};

const handleInvoicePaymentFailed = async (invoice) => {
    try {
        const user = await UserModel.findOne({ stripeCustomerId: invoice.customer });
        if (user) {
            user.subscriptionStatus = 'payment_failed';
            await user.save();
            
            // Send notification to user
            // Implement your notification logic here
        }
    } catch (error) {
        logger.error('Error handling invoice payment failure:', error);
    }
};

// Update the handleWebhook function to include subscription events
const handleWebhook = asyncHandler(async (req, res) => {
    const sig = req.headers['stripe-signature'];

    try {
        const event = stripe.webhooks.constructEvent(
            req.body,
            sig,
            process.env.STRIPE_WEBHOOK_SECRET
        );

        // Handle the event
        switch (event.type) {
            case 'payment_intent.succeeded':
                await handlePaymentSuccess(event.data.object);
                break;
            case 'payment_intent.payment_failed':
                await handlePaymentFailure(event.data.object);
                break;
            case 'customer.subscription.created':
                await handleSubscriptionCreated(event.data.object);
                break;
            case 'customer.subscription.updated':
                await handleSubscriptionUpdated(event.data.object);
                break;
            case 'customer.subscription.deleted':
                await handleSubscriptionCancelled(event.data.object);
                break;
            case 'invoice.payment_failed':
                await handleInvoicePaymentFailed(event.data.object);
                break;
            default:
                logger.info(`Unhandled event type ${event.type}`);
        }

        res.json({ received: true });
    } catch (error) {
        logger.error('Webhook error:', error);
        res.status(400).send(`Webhook Error: ${error.message}`);
    }
});

// @desc    Create payment intent
// @route   POST /api/payments/create-payment-intent
// @access  Private
const createPaymentIntent = asyncHandler(async (req, res) => {
    const { amount, currency = 'usd', eventId } = req.body;

    try {
        const paymentIntent = await createStripePayment(amount, currency, {
            eventId,
            userId: req.user._id.toString()
        });

        res.status(200).json({
            clientSecret: paymentIntent.client_secret
        });
    } catch (error) {
        logger.error('Error creating payment intent:', error);
        res.status(400);
        throw new Error('Error creating payment intent');
    }
});

// @desc    Get payment history for user
// @route   GET /api/payments/history
// @access  Private
const getPaymentHistory = asyncHandler(async (req, res) => {
    try {
        const payments = await PaymentModel.find({ user: req.user._id })
            .populate('event', 'title date')
            .sort('-createdAt');

        res.status(200).json({
      success: true,
            count: payments.length,
            data: payments
    });
  } catch (error) {
        logger.error('Error fetching payment history:', error);
        res.status(500);
        throw new Error('Error retrieving payment history');
    }
});

// @desc    Validate payment
// @route   POST /api/payments/validate/:paymentId
// @access  Private
const validatePayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;

    try {
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }

        // Verify user authorization
        if (payment.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to validate this payment');
        }

        const stripePayment = await stripe.paymentIntents.retrieve(
            payment.stripePaymentId
        );

        res.status(200).json({
            success: true,
            isValid: stripePayment.status === 'succeeded',
            paymentStatus: stripePayment.status
        });
    } catch (error) {
        logger.error('Payment validation error:', error);
        res.status(400);
        throw new Error('Error validating payment');
    }
});

// @desc    Refund a payment
// @route   POST /api/payments/refund/:paymentId
// @access  Private
const refundPayment = asyncHandler(async (req, res) => {
    const { paymentId } = req.params;
    const { amount, reason, metadata = {} } = req.body;

    try {
        // 1. Find the payment record
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }

        // 2. Verify user authorization
        if (payment.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to refund this payment');
        }

        // 3. Check if payment can be refunded
        if (payment.status !== 'completed') {
            res.status(400);
            throw new Error('Only completed payments can be refunded');
        }

        if (payment.status === 'refunded') {
            res.status(400);
            throw new Error('Payment has already been refunded');
        }

        // 4. Validate refund amount
        const refundAmount = amount || payment.amount;
        if (refundAmount > payment.amount) {
            res.status(400);
            throw new Error('Refund amount cannot exceed payment amount');
        }

        // Use utility function for refund
        const refund = await processStripeRefund(
            payment.stripePaymentId,
            refundAmount,
            reason || 'requested_by_customer'
        );

        // 6. Update payment record
        payment.status = refundAmount === payment.amount ? 'refunded' : 'partially_refunded';
        payment.refundId = refund.id;
        payment.refundAmount = refundAmount;
        payment.refundReason = reason;
        payment.refundedAt = Date.now();
        payment.metadata = {
            ...payment.metadata,
            refundMetadata: metadata
        };
        await payment.save();

        // 7. Handle specific payment types
        switch (payment.type) {
            case 'event_payment':
                if (payment.metadata.eventId) {
                    await EventModel.findByIdAndUpdate(
                        payment.metadata.eventId,
                        { 
                            paymentStatus: 'refunded',
                            updatedAt: Date.now()
                        }
                    );
                }
                break;

            case 'subscription':
                if (payment.stripeSubscriptionId) {
                    // Cancel subscription if it exists
                    try {
                        await stripe.subscriptions.cancel(payment.stripeSubscriptionId);
                        await UserModel.findByIdAndUpdate(req.user._id, {
                            subscriptionStatus: 'canceled',
                            subscriptionPlan: null,
                            subscriptionEndDate: Date.now()
                        });
                    } catch (error) {
                        logger.error('Error canceling subscription during refund:', error);
                    }
                }
                break;
        }

        // 8. Create refund record
        const refundRecord = await PaymentModel.create({
            user: req.user._id,
            type: 'refund',
            amount: -refundAmount, // Negative amount to indicate refund
            currency: payment.currency,
            status: 'completed',
            stripeRefundId: refund.id,
            relatedPayment: payment._id,
            metadata: {
                originalPaymentId: payment._id,
                reason,
                ...metadata
            }
        });

        // 9. Send response
        res.status(200).json({
            success: true,
            message: 'Refund processed successfully',
            refund: {
                id: refund.id,
                amount: refundAmount,
                status: refund.status,
                reason: refund.reason,
                created: new Date(refund.created * 1000)
            },
            payment: {
                id: payment._id,
                originalAmount: payment.amount,
                refundAmount: refundAmount,
                remainingAmount: payment.amount - refundAmount,
                status: payment.status
            }
        });

    } catch (error) {
        logger.error('Error processing refund:', error);
        res.status(400);
        throw new Error(error.message || 'Error processing refund');
    }
});

// @desc    Verify payment status
// @route   POST /api/payments/verify
// @access  Private
const verifyPayment = asyncHandler(async (req, res) => {
    const { paymentId, razorpayPaymentId, razorpayOrderId, razorpaySignature } = req.body;

    try {
        // Find payment in our database
        const payment = await PaymentModel.findById(paymentId);
        if (!payment) {
            res.status(404);
            throw new Error('Payment not found');
        }

        // Verify payment belongs to user
        if (payment.user.toString() !== req.user._id.toString()) {
            res.status(403);
            throw new Error('Not authorized to verify this payment');
        }

        // Razorpay verification logic
        if (razorpayPaymentId && razorpayOrderId && razorpaySignature) {
            // Verify signature
            const generatedSignature = crypto
                .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
                .update(`${razorpayOrderId}|${razorpayPaymentId}`)
                .digest('hex');
            if (generatedSignature === razorpaySignature) {
                payment.status = 'Completed';
                payment.razorpayOrderId = razorpayOrderId;
                payment.razorpayPaymentId = razorpayPaymentId;
                payment.razorpaySignature = razorpaySignature;
                await payment.save();

                // --- BEGIN: Update user event limit/package after successful payment ---
                if (payment.plan) {
                    const user = await UserModel.findById(payment.user);
                    if (user) {
                        // Determine plan details
                        let plan = await import('../models/subscriptionModel.js').then(m => m.default.findById(payment.plan));
                        if (plan) {
                            // Calculate expiry date
                            let expiryDate = new Date();
                            if (plan.duration) {
                                if (plan.duration === 'Month') expiryDate.setMonth(expiryDate.getMonth() + 1);
                                else if (plan.duration === 'Year') expiryDate.setFullYear(expiryDate.getFullYear() + 1);
                                else if (plan.duration === 'Day') expiryDate.setDate(expiryDate.getDate() + 1);
                            } else if (plan.expiryDate) {
                                expiryDate = new Date(plan.expiryDate);
                            } else {
                                expiryDate.setMonth(expiryDate.getMonth() + 1); // Default 1 month
                            }
                            // Update user eventPackage and eventLimit
                            user.eventPackage = {
                                type: plan.type || plan.planName || plan.name || 'premium',
                                purchaseDate: new Date(),
                                expiryDate,
                                eventsAllowed: plan.eventLimit || plan.eventsAllowed || 100
                            };
                            user.eventLimit = plan.eventLimit || plan.eventsAllowed || 100;
                            // Add to packageHistory
                            user.packageHistory = user.packageHistory || [];
                            user.packageHistory.push({
                                packageId: payment.plan || null,
                                name: plan.type || plan.planName || plan.name || 'premium',
                                purchaseDate: new Date(),
                                expiryDate,
                                eventsAllowed: plan.eventLimit || plan.eventsAllowed || 100,
                                eventsUsed: 0,
                                status: 'completed'
                            });
                            await user.save();
                        }
                    }
                } else if (payment.paymentInfo && payment.paymentInfo.type) {
                    // --- BEGIN: Create order/booking/service after payment ---
                    try {
                        const type = payment.paymentInfo.type;
                        if (type === 'product') {
                            // Create ProductOrder
                            const ProductOrder = (await import('../models/productOrderModel.js')).default;
                            const { ProductModel } = await import('../models/productModel.js');
                            const { EventModel } = await import('../models/eventModel.js');
                            const { BusinessModel } = await import('../models/businessModel.js');
                            const mongoose = (await import('mongoose')).default;
                            // Generate a unique order number (timestamp + user)
                            const orderNumber = `ORD-${Date.now()}-${payment.user.toString().slice(-4)}`;

                            // Fetch all product docs and keep original IDs, try both _id and uuid
                            const productDocs = await Promise.all((payment.paymentInfo.products || []).map(async p => {
                                let prod = null;
                                if (mongoose.Types.ObjectId.isValid(p.productId)) {
                                    prod = await ProductModel.findById(p.productId);
                                }
                                if (!prod) {
                                    // Try to find by uuid if present
                                    prod = await ProductModel.findOne({ uuid: p.productId });
                                }
                                if (!prod) {
                                    logger.error(`Product not found for productId: ${p.productId}`);
                                    throw new Error(`Product not found: ${p.productId}`);
                                }
                                return prod;
                            }));

                            // Determine seller (Business):
                            let seller = null;
                            if (payment.paymentInfo.eventId) {
                                // If order is from event, use event organizer's business
                                const event = await EventModel.findById(payment.paymentInfo.eventId);
                                if (!event) throw new Error('Event not found for product order');
                                seller = await BusinessModel.findOne({ user: event.organizer });
                                if (!seller) throw new Error('Business not found for event organizer');
                            } else {
                                // Otherwise, use the first product's seller's business
                                const firstProduct = productDocs[0];
                                seller = await BusinessModel.findOne({ user: firstProduct.seller });
                                if (!seller) throw new Error('Business not found for product seller');
                            }

                            await ProductOrder.create({
                                user: payment.user,
                                seller: seller._id,
                                sourceEvent: payment.paymentInfo.eventId || undefined,
                                orderNumber,
                                items: productDocs.map((prod, idx) => {
                                    const p = payment.paymentInfo.products[idx];
                                    return {
                                        product: prod._id, // always ObjectId
                                        quantity: p.quantity,
                                        price: {
                                            base: p.price,
                                            discount: 0,
                                            final: p.price
                                        },
                                        productSnapshot: {
                                            name: prod.name,
                                            sku: prod.inventory?.sku || '',
                                            attributes: prod.attributes || {}
                                        }
                                    };
                                }),
                                amounts: {
                                    subtotal: payment.paymentInfo.total || payment.amount,
                                    discount: 0,
                                    tax: 0,
                                    shipping: 0,
                                    total: payment.paymentInfo.total || payment.amount
                                },
                                payment: {
                                    method: 'CARD',
                                    status: 'COMPLETED',
                                    transactions: [{
                                        id: payment.razorpayPaymentId || payment.stripePaymentId,
                                        amount: payment.amount,
                                        status: 'COMPLETED',
                                        type: 'PAYMENT',
                                        date: new Date()
                                    }]
                                },
                                status: 'confirmed'
                            });
                        } else if (type === 'service') {
                            // Create ServiceBooking
                            const ServiceBooking = (await import('../models/serviceBookingModel.js')).default;
                            await ServiceBooking.create({
                                user: payment.user,
                                eventId: payment.paymentInfo.eventId,
                                serviceId: payment.paymentInfo.serviceId,
                                serviceName: payment.paymentInfo.serviceName,
                                price: payment.paymentInfo.price,
                                currency: payment.paymentInfo.currency || 'INR',
                                status: 'confirmed',
                                payment: {
                                    method: 'CARD',
                                    transactionId: payment.razorpayPaymentId || payment.stripePaymentId,
                                    status: 'COMPLETED'
                                }
                            });
                        } else if (type === 'ticket' || type === 'booking') {
                            // Defensive check for quantity
                            const qty = payment.paymentInfo.quantity;
                            if (!Number.isInteger(qty) || qty <= 0) {
                                logger.error('Invalid ticket quantity for booking:', { quantity: qty, paymentInfo: payment.paymentInfo });
                                throw new Error('Invalid ticket quantity for booking: ' + qty);
                            }
                            // Create Booking
                            const Booking = (await import('../models/bookingModel.js')).default;
                            const booking = await Booking.create({
                                user: payment.user,
                                event: payment.paymentInfo.eventId,
                                seats: qty,
                                ticketType: payment.paymentInfo.ticketTypeId || payment.paymentInfo.ticketType,
                                status: 'CONFIRMED',
                                totalAmount: payment.amount,
                                currency: payment.paymentInfo.currency || 'INR'
                            });
                            // Generate tickets and assign to booking
                            try {
                                const tickets = await Promise.all(Array(qty).fill().map(async () => {
                                    const ticketNumber = generateTicketNumber();
                                    const qrCode = await generateQRCode(JSON.stringify({
                                        ticketNumber,
                                        bookingId: booking._id,
                                        timestamp: Date.now()
                                    }));
                                    return {
                                        ticketNumber,
                                        qrCode,
                                        isUsed: false,
                                        createdAt: new Date()
                                    };
                                }));
                                logger.info('Generated tickets for booking:', { quantity: qty, tickets });
                                // Defensive check: ensure no ticketNumber is null/undefined
                                if (tickets.some(t => !t.ticketNumber)) {
                                    logger.error('Ticket generation error: At least one ticketNumber is null/undefined', { tickets });
                                    throw new Error('Ticket generation error: ticketNumber is null/undefined');
                                }
                                booking.tickets = tickets;
                                await booking.save();
                            } catch (ticketErr) {
                                logger.error('Error generating tickets for booking:', ticketErr);
                                throw ticketErr;
                            }
                        }
                    } catch (err) {
                        logger.error('Error creating business record after payment:', err);
                    }
                    // --- END: Create order/booking/service after payment ---
                }
                // --- END: Update user event limit/package ---

                return res.json({
                    success: true,
                    payment: {
                        id: payment._id,
                        status: payment.status,
                        amount: payment.amount,
                        currency: payment.currency,
                        createdAt: payment.createdAt,
                        metadata: payment.metadata
                    }
                });
            } else {
                payment.status = 'Failed';
                payment.razorpayOrderId = razorpayOrderId;
                payment.razorpayPaymentId = razorpayPaymentId;
                payment.razorpaySignature = razorpaySignature;
                await payment.save();
                return res.status(400).json({
                    success: false,
                    message: 'Razorpay signature verification failed',
                    payment: {
                        id: payment._id,
                        status: payment.status,
                        amount: payment.amount,
                        currency: payment.currency,
                        createdAt: payment.createdAt,
                        metadata: payment.metadata
                    }
                });
            }
        }

        // If payment has Stripe ID, verify with Stripe
        if (payment.stripePaymentId) {
            const stripePayment = await stripe.paymentIntents.retrieve(payment.stripePaymentId);
            // Update payment status based on Stripe status
            payment.status = stripePayment.status === 'succeeded' ? 'Completed' : stripePayment.status;
            await payment.save();
            return res.json({
                success: true,
                payment: {
                    id: payment._id,
                    status: payment.status,
                    amount: payment.amount,
                    currency: payment.currency,
                    createdAt: payment.createdAt,
                    metadata: payment.metadata
                }
            });
        }

        // For non-Stripe payments, return current status
        res.json({
            success: true,
            payment: {
                id: payment._id,
                status: payment.status,
                amount: payment.amount,
                currency: payment.currency,
                createdAt: payment.createdAt,
                metadata: payment.metadata
            }
        });

    } catch (error) {
        logger.error('Error verifying payment:', error);
        res.status(400);
        throw new Error(error.message || 'Error verifying payment');
    }
});

// New: Get event upgrade price details
export const getEventUpgradePrice = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const { upgradeType } = req.query;
  if (!upgradeType) {
    return res.status(400).json({ success: false, message: 'upgradeType is required' });
  }
  const event = await EventModel.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  // Fetch upgrade pricing config from DB
  const pricingConfig = await UpgradePricingModel.findOne({ _id: 'global' });
  if (!pricingConfig) {
    return res.status(500).json({ success: false, message: 'Upgrade pricing config not found' });
  }
  const currentStatus = event.upgradeStatus || 'none';
  const price = pricingConfig.upgradePricing?.[currentStatus]?.[upgradeType] ?? null;
  if (price === null) {
    return res.status(400).json({ success: false, message: 'Invalid upgrade path' });
  }
  return res.json({ success: true, eventId, upgradeType, price });
});

// Get valid upgrade options and payment methods for an event
export const getEventUpgradeOptions = asyncHandler(async (req, res) => {
  const { eventId } = req.params;
  const event = await EventModel.findById(eventId);
  if (!event) {
    return res.status(404).json({ success: false, message: 'Event not found' });
  }
  // Fetch upgrade pricing config from DB
  const pricingConfig = await UpgradePricingModel.findOne({ _id: 'global' });
  if (!pricingConfig) {
    return res.status(500).json({ success: false, message: 'Upgrade pricing config not found' });
  }
  const currentStatus = event.upgradeStatus || 'none';
  const validUpgradeTypes = pricingConfig.upgradePricing?.[currentStatus] ? Object.keys(pricingConfig.upgradePricing[currentStatus]) : [];
  // Available payment methods (could be dynamic in future)
  const paymentMethods = ['Credit Card', 'Razorpay', 'PayPal'];
  res.json({
    success: true,
    eventId,
    currentStatus,
    validUpgradeTypes,
    paymentMethods
  });
});

// Export all the functions that are used in routes
export {
    createPaymentIntent,
    handleWebhook,
    getPaymentHistory,
    processRefund,
    validatePayment,
    getPaymentStatus,
    processSubscriptionPayment,
    cancelSubscription,
    confirmPaymentIntent,
    createSubscription,
    initiatePayment,
    processPayment,
    refundPayment,
    upgradeEventPayment,
    verifyPayment
};