# Event Subscription Payment Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Event Payment Types](#event-payment-types)
3. [Implementation Guide](#implementation-guide)
4. [Payment Flows](#payment-flows)
5. [Webhook Handling](#webhook-handling)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

## Overview

### Event Payment Models
```javascript
// Event Payment Structure
{
  eventId: String,          // Reference to the event
  userId: String,           // User making the payment
  amount: Number,           // Payment amount
  currency: String,         // Payment currency
  type: String,            // 'standard', 'vip', 'early_bird'
  status: String,          // 'pending', 'completed', 'failed', 'refunded'
  provider: String,        // Payment provider used
  metadata: Object         // Additional event-specific data
}
```

## Event Payment Types

### 1. Standard Event Payment
```javascript
// Example implementation
const standardEventPayment = {
  type: 'standard',
  features: ['basic_access', 'general_seating'],
  pricing: {
    amount: 2999,    // $29.99
    currency: 'usd'
  }
};
```

### 2. VIP Event Payment
```javascript
const vipEventPayment = {
  type: 'vip',
  features: ['premium_access', 'reserved_seating', 'meet_and_greet'],
  pricing: {
    amount: 9999,    // $99.99
    currency: 'usd'
  }
};
```

### 3. Early Bird Payment
```javascript
const earlyBirdPayment = {
  type: 'early_bird',
  features: ['basic_access', 'discounted_rate'],
  pricing: {
    amount: 1999,    // $19.99
    currency: 'usd'
  },
  validUntil: 'YYYY-MM-DD'
};
```

## Implementation Guide

### 1. Create Event Payment
```javascript
// In your payment service
export const createEventPayment = async (eventId, userId, paymentType) => {
  try {
    // 1. Validate event and user
    const event = await Event.findById(eventId);
    if (!event) throw new Error('Event not found');

    const user = await User.findById(userId);
    if (!user) throw new Error('User not found');

    // 2. Check if user already paid
    const existingPayment = await Payment.findOne({
      event: eventId,
      user: userId,
      status: 'completed'
    });
    if (existingPayment) {
      throw new Error('Payment already exists for this event');
    }

    // 3. Calculate payment amount based on type
    const amount = calculateEventPaymentAmount(event, paymentType);

    // 4. Create payment record
    const payment = await Payment.create({
      event: eventId,
      user: userId,
      amount,
      currency: event.currency,
      type: paymentType,
      status: 'pending',
      metadata: {
        eventTitle: event.title,
        eventDate: event.date,
        paymentType
      }
    });

    return payment;
  } catch (error) {
    logger.error('Error creating event payment:', error);
    throw error;
  }
};
```

### 2. Process Event Payment
```javascript
// Route handler
router.post('/events/:eventId/pay', protect, async (req, res) => {
  try {
    const { eventId } = req.params;
    const { paymentType, paymentMethodId } = req.body;

    // 1. Create payment record
    const payment = await createEventPayment(eventId, req.user._id, paymentType);

    // 2. Initialize payment with provider
    const paymentIntent = await stripe.paymentIntents.create({
      amount: payment.amount,
      currency: payment.currency,
      payment_method: paymentMethodId,
      metadata: {
        eventId,
        userId: req.user._id,
        paymentType
      }
    });

    // 3. Update payment record with provider details
    payment.providerPaymentId = paymentIntent.id;
    await payment.save();

    res.json({
      success: true,
      clientSecret: paymentIntent.client_secret,
      paymentId: payment._id
    });
  } catch (error) {
    res.status(400).json({
      success: false,
      error: error.message
    });
  }
});
```

## Payment Flows

### 1. Standard Event Registration Flow
```javascript
// Frontend implementation
const handleEventRegistration = async (eventId, paymentType) => {
  try {
    // 1. Create payment
    const { clientSecret, paymentId } = await api.post(`/events/${eventId}/pay`, {
      paymentType: 'standard'
    });

    // 2. Collect payment method
    const { paymentMethod } = await stripe.createPaymentMethod({
      type: 'card',
      card: elements.getElement('card')
    });

    // 3. Confirm payment
    const result = await stripe.confirmCardPayment(clientSecret, {
      payment_method: paymentMethod.id
    });

    if (result.error) {
      throw new Error(result.error.message);
    }

    // 4. Verify payment completion
    await api.post(`/payments/${paymentId}/verify`, {
      paymentIntentId: result.paymentIntent.id
    });

    return result.paymentIntent;
  } catch (error) {
    console.error('Payment failed:', error);
    throw error;
  }
};
```

### 2. VIP Event Registration Flow
```javascript
const handleVIPRegistration = async (eventId) => {
  try {
    // 1. Create VIP payment
    const { clientSecret, paymentId } = await api.post(`/events/${eventId}/pay`, {
      paymentType: 'vip'
    });

    // 2. Handle payment confirmation
    // Similar to standard flow but with VIP-specific handling

    // 3. Update user VIP status
    await api.post(`/events/${eventId}/vip-status`, {
      paymentId
    });

    return result.paymentIntent;
  } catch (error) {
    console.error('VIP payment failed:', error);
    throw error;
  }
};
```

## Webhook Handling

### 1. Payment Success Webhook
```javascript
// In your webhook handler
const handleEventPaymentSuccess = async (paymentIntent) => {
  try {
    const { eventId, userId } = paymentIntent.metadata;
    
    // 1. Update payment status
    const payment = await Payment.findOneAndUpdate(
      { providerPaymentId: paymentIntent.id },
      { 
        status: 'completed',
        paidAt: new Date()
      },
      { new: true }
    );

    // 2. Update event registration
    await Event.findByIdAndUpdate(eventId, {
      $push: {
        attendees: {
          user: userId,
          paymentId: payment._id,
          type: payment.type
        }
      }
    });

    // 3. Send confirmation email
    await sendEventConfirmation(userId, eventId, payment);

  } catch (error) {
    logger.error('Error handling payment success:', error);
    throw error;
  }
};
```

### 2. Payment Failure Webhook
```javascript
const handleEventPaymentFailure = async (paymentIntent) => {
  try {
    const { eventId, userId } = paymentIntent.metadata;
    
    // 1. Update payment status
    await Payment.findOneAndUpdate(
      { providerPaymentId: paymentIntent.id },
      { 
        status: 'failed',
        failureReason: paymentIntent.last_payment_error?.message
      }
    );

    // 2. Notify user
    await sendPaymentFailureNotification(userId, eventId);

  } catch (error) {
    logger.error('Error handling payment failure:', error);
    throw error;
  }
};
```

## Error Handling

### Common Event Payment Errors
```javascript
// Error handling middleware
const handleEventPaymentError = (error, req, res, next) => {
  switch (error.code) {
    case 'event_full':
      return res.status(400).json({
        error: 'Event is at full capacity'
      });

    case 'already_registered':
      return res.status(400).json({
        error: 'Already registered for this event'
      });

    case 'registration_closed':
      return res.status(400).json({
        error: 'Event registration is closed'
      });

    case 'invalid_payment_type':
      return res.status(400).json({
        error: 'Invalid payment type for this event'
      });

    default:
      return res.status(500).json({
        error: 'Payment processing error'
      });
  }
};
```

## Testing

### Test Event Payments
```javascript
describe('Event Payment Integration', () => {
  it('should process standard event payment', async () => {
    const payment = await createEventPayment(
      'test-event-id',
      'test-user-id',
      'standard'
    );
    expect(payment.status).toBe('pending');
    expect(payment.type).toBe('standard');
  });

  it('should handle VIP payment', async () => {
    const payment = await createEventPayment(
      'test-event-id',
      'test-user-id',
      'vip'
    );
    expect(payment.type).toBe('vip');
    expect(payment.amount).toBe(9999);
  });
});
```

Would you like me to:
1. Add more specific payment flow examples?
2. Include refund handling documentation?
3. Add subscription-based event documentation?
4. Create API reference documentation for event payments?