# Payment Provider Integration Guide

## Table of Contents
1. [Overview](#overview)
2. [Supported Providers](#supported-providers)
3. [Basic Integration](#basic-integration)
4. [Provider-Specific Integration](#provider-specific-integration)
5. [Webhook Setup](#webhook-setup)
6. [Error Handling](#error-handling)
7. [Testing](#testing)

## Overview

The payment system supports multiple payment providers through a unified interface. Each provider can be integrated using the `PaymentProviderService` class.

### Basic Usage
```javascript
import PaymentProviderService from '../services/paymentService.js';

const processor = new PaymentProviderService('stripe'); // or 'paypal', 'razorpay', etc.
const payment = await processor.createPayment({
  amount: 1000,
  currency: 'usd',
  description: 'Product purchase'
});
```

## Supported Providers

Each provider has specific features and requirements:

### Stripe
```javascript
{
  name: 'stripe',
  currencies: ['usd', 'eur', 'gbp', 'inr'],
  features: ['cards', 'wallets', 'bank_transfer'],
  requiresWebhook: true,
  supportsSplitPayments: true
}

// Environment Variables Required
STRIPE_SECRET_KEY=sk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
```

### PayPal
```javascript
{
  name: 'paypal',
  currencies: ['usd', 'eur', 'gbp'],
  features: ['paypal_balance', 'cards'],
  requiresWebhook: true,
  supportsSplitPayments: false
}

// Environment Variables Required
PAYPAL_CLIENT_ID=client_id...
PAYPAL_SECRET=secret...
```

### Razorpay
```javascript
{
  name: 'razorpay',
  currencies: ['inr'],
  features: ['upi', 'cards', 'netbanking'],
  requiresWebhook: true,
  supportsSplitPayments: true
}

// Environment Variables Required
RAZORPAY_KEY_ID=key_id...
RAZORPAY_KEY_SECRET=key_secret...
```

## Basic Integration

### 1. Initialize Payment Provider
```javascript
const processor = new PaymentProviderService(providerName);
```

### 2. Create Payment
```javascript
const paymentDetails = {
  amount: 1000, // Amount in smallest currency unit (cents/paise)
  currency: 'usd',
  description: 'Product purchase',
  metadata: {
    orderId: 'ORDER123',
    customerId: 'CUST456'
  }
};

const payment = await processor.createPayment(paymentDetails);
```

### 3. Handle Payment Verification
```javascript
const verificationData = {
  paymentId: 'payment_123',
  signature: 'sig_456',
  // Provider-specific verification data
};

const isVerified = await processor.verifyPayment(verificationData);
```

## Provider-Specific Integration

### Stripe Integration
```javascript
// 1. Create Payment Intent
const stripePayment = await processor.createPayment({
  amount: 1000,
  currency: 'usd',
  payment_method_types: ['card'],
  metadata: { orderId: 'ORDER123' }
});

// 2. Confirm Payment
const confirmation = await processor.confirmPayment(stripePayment.id, {
  payment_method: 'pm_card_visa'
});

// 3. Handle 3D Secure if needed
if (confirmation.requiresAction) {
  // Handle 3D Secure authentication
  const result = await processor.handleCardAction(confirmation.clientSecret);
}
```

### PayPal Integration
```javascript
// 1. Create Order
const paypalOrder = await processor.createPayment({
  amount: 1000,
  currency: 'usd',
  intent: 'CAPTURE'
});

// 2. Capture Payment
const capture = await processor.capturePayment(paypalOrder.id);

// 3. Handle Verification
const verification = await processor.verifyPayment({
  orderId: paypalOrder.id,
  payerId: 'PAYER123'
});
```

### Razorpay Integration
```javascript
// 1. Create Order
const razorpayOrder = await processor.createPayment({
  amount: 100000, // amount in paise
  currency: 'INR',
  receipt: 'ORDER123'
});

// 2. Verify Payment
const verification = await processor.verifyPayment({
  orderId: razorpayOrder.id,
  paymentId: 'pay_123',
  signature: 'sig_456'
});
```

## Webhook Setup

### 1. Configure Webhook URLs
Set up webhook endpoints in your provider dashboard:
- Stripe: `https://your-domain.com/api/payments/webhook/stripe`
- PayPal: `https://your-domain.com/api/payments/webhook/paypal`
- Razorpay: `https://your-domain.com/api/payments/webhook/razorpay`

### 2. Handle Webhook Events
```javascript
// In your route handler
router.post('/webhook/:provider', async (req, res) => {
  const { provider } = req.params;
  const processor = new PaymentProviderService(provider);
  
  try {
    const event = await processor.handleWebhook(req.body);
    res.json({ received: true });
  } catch (error) {
    res.status(400).send(`Webhook Error: ${error.message}`);
  }
});
```

## Error Handling

### Common Error Patterns
```javascript
try {
  const payment = await processor.createPayment(paymentDetails);
} catch (error) {
  if (error.code === 'insufficient_funds') {
    // Handle insufficient funds
  } else if (error.code === 'card_declined') {
    // Handle declined card
  } else if (error.requiresAction) {
    // Handle required actions (3D Secure, etc.)
  } else {
    // Handle other errors
  }
}
```

### Error Codes
Common error codes across providers:
- `payment_failed`
- `insufficient_funds`
- `card_declined`
- `invalid_card`
- `expired_card`
- `authentication_required`
- `currency_not_supported`

## Testing

### Test Cards
```javascript
// Stripe Test Cards
const testCards = {
  success: '4242424242424242',
  decline: '4000000000000002',
  insufficient_funds: '4000000000009995',
  requires_3d_secure: '4000000000003220'
};

// Test Mode
const processor = new PaymentProviderService('stripe', { testMode: true });
```

### Test Webhooks
```bash
# Stripe
stripe listen --forward-to localhost:3000/api/payments/webhook/stripe

# PayPal
# Use PayPal Sandbox environment

# Razorpay
# Use Razorpay Test Mode
```

### Integration Testing
```javascript
describe('Payment Integration', () => {
  it('should process payment successfully', async () => {
    const processor = new PaymentProviderService('stripe', { testMode: true });
    const payment = await processor.createPayment({
      amount: 1000,
      currency: 'usd',
      payment_method: 'pm_card_visa'
    });
    expect(payment.status).toBe('succeeded');
  });
});
```
```

Would you like me to:
1. Add more specific provider examples?
2. Include security best practices?
3. Add troubleshooting guides?
4. Create API reference documentation?