# API Documentation

## Table of Contents
1. [Authentication](#authentication)
2. [Payment Endpoints](#payment-endpoints)
3. [Event Payment Endpoints](#event-payment-endpoints)
4. [Subscription Endpoints](#subscription-endpoints)
5. [Payment Method Endpoints](#payment-method-endpoints)
6. [Webhook Endpoints](#webhook-endpoints)

## Authentication

All API requests require authentication using Bearer token.

```http
Authorization: Bearer <your_token>
```

## Payment Endpoints

### Create Payment Intent

Creates a new payment intent for processing payment.

```http
POST /api/payments/create
```

**Request Body:**
```json
{
  "amount": 1000,              // Amount in cents/paise
  "currency": "usd",           // Currency code
  "paymentMethod": "card",     // Payment method type
  "description": "string",     // Payment description
  "metadata": {               // Optional metadata
    "orderId": "string",
    "customerId": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "paymentIntent": {
    "id": "string",
    "clientSecret": "string",
    "amount": 1000,
    "currency": "usd",
    "status": "requires_payment_method"
  }
}
```

### Confirm Payment

Confirms a payment intent with payment method details.

```http
POST /api/payments/confirm
```

**Request Body:**
```json
{
  "paymentIntentId": "string",
  "paymentMethodId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "string",
    "status": "succeeded",
    "amount": 1000,
    "currency": "usd"
  }
}
```

### Get Payment Status

Retrieves the current status of a payment.

```http
GET /api/payments/:paymentId
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "string",
    "status": "string",
    "amount": 1000,
    "currency": "usd",
    "createdAt": "2024-03-21T12:00:00Z",
    "updatedAt": "2024-03-21T12:00:00Z"
  }
}
```

## Event Payment Endpoints

### Create Event Payment

Creates a payment for event registration.

```http
POST /api/payments/events/:eventId/pay
```

**Request Body:**
```json
{
  "paymentType": "standard|vip|early_bird",
  "paymentMethodId": "string",
  "metadata": {
    "additionalInfo": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "payment": {
    "id": "string",
    "eventId": "string",
    "amount": 1000,
    "currency": "usd",
    "status": "pending",
    "clientSecret": "string"
  }
}
```

### Verify Event Payment

Verifies the completion of an event payment.

```http
POST /api/payments/events/:eventId/verify
```

**Request Body:**
```json
{
  "paymentId": "string",
  "verificationData": {
    "transactionId": "string",
    "signature": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "verified": true,
  "registration": {
    "eventId": "string",
    "userId": "string",
    "status": "confirmed"
  }
}
```

## Subscription Endpoints

### Create Subscription

Creates a new subscription for recurring payments.

```http
POST /api/subscriptions/create
```

**Request Body:**
```json
{
  "planId": "string",
  "paymentMethodId": "string",
  "metadata": {
    "customerId": "string"
  }
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "string",
    "planId": "string",
    "status": "active",
    "currentPeriodEnd": "2024-04-21T12:00:00Z",
    "paymentMethodId": "string"
  }
}
```

### Cancel Subscription

Cancels an active subscription.

```http
POST /api/subscriptions/:subscriptionId/cancel
```

**Request Body:**
```json
{
  "cancelReason": "string",
  "cancelAtPeriodEnd": boolean
}
```

**Response:**
```json
{
  "success": true,
  "subscription": {
    "id": "string",
    "status": "canceled",
    "canceledAt": "2024-03-21T12:00:00Z",
    "endDate": "2024-04-21T12:00:00Z"
  }
}
```

## Payment Method Endpoints

### Add Payment Method

Adds a new payment method for a user.

```http
POST /api/payment-methods/add
```

**Request Body:**
```json
{
  "type": "card",
  "paymentMethodId": "string",
  "isDefault": boolean
}
```

**Response:**
```json
{
  "success": true,
  "paymentMethod": {
    "id": "string",
    "type": "card",
    "last4": "string",
    "brand": "string",
    "isDefault": boolean
  }
}
```

### List Payment Methods

Retrieves all payment methods for a user.

```http
GET /api/payment-methods
```

**Response:**
```json
{
  "success": true,
  "paymentMethods": [
    {
      "id": "string",
      "type": "card",
      "last4": "string",
      "brand": "string",
      "isDefault": boolean,
      "expiryMonth": number,
      "expiryYear": number
    }
  ]
}
```

## Webhook Endpoints

### Handle Payment Webhook

Endpoint for receiving payment provider webhooks.

```http
POST /api/webhooks/:provider
```

**Request Headers:**
```http
Stripe-Signature: string      // For Stripe webhooks
X-Razorpay-Signature: string // For Razorpay webhooks
```

**Response:**
```json
{
  "received": true
}
```

## Error Responses

All endpoints may return the following error responses:

### 400 Bad Request
```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string",
    "details": {}
  }
}
```

### 401 Unauthorized
```json
{
  "success": false,
  "error": {
    "code": "unauthorized",
    "message": "Authentication required"
  }
}
```

### 403 Forbidden
```json
{
  "success": false,
  "error": {
    "code": "forbidden",
    "message": "Insufficient permissions"
  }
}
```

### 404 Not Found
```json
{
  "success": false,
  "error": {
    "code": "not_found",
    "message": "Resource not found"
  }
}
```

### 500 Server Error
```json
{
  "success": false,
  "error": {
    "code": "server_error",
    "message": "Internal server error"
  }
}
```

## Rate Limiting

API requests are subject to rate limiting:

```http
X-RateLimit-Limit: 100
X-RateLimit-Remaining: 99
X-RateLimit-Reset: 1616501730
```

## Pagination

For endpoints that return lists, pagination is supported using:

```http
GET /api/payments?page=1&limit=10
```

**Response:**
```json
{
  "success": true,
  "data": [...],
  "pagination": {
    "total": 100,
    "pages": 10,
    "currentPage": 1,
    "limit": 10
  }
}
```
```

