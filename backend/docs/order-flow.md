Order Flow:

1. User Auth → 2. Product Browse → 3. Cart Management → 4. Checkout → 5. Payment → 6. Delivery

┌─ User Login/Auth ─┐    ┌─ Product Browse ─┐    ┌─ Product Details ─┐
│  POST /auth/login │───>│  GET /products   │───>│  GET /products/:id│
└─────────────────┘     │  Filters:        │    └──────────────────┘
                        │  - category       │            │
                        │  - price         │            │
                        │  - rating        │            ▼
                        └─────────────────┘     ┌─ Cart Management ─┐
                                               │ POST /cart/add    │
                                               └──────────────────┘
                                                       │
                                                       ▼
┌─ Create Order ─┐      ┌─ Process Payment ─┐   ┌─ Delivery Setup ─┐
│ POST /orders   │<─────│ POST /payments    │<──│ - Address        │
└───────────────┘      └──────────────────┘   │ - Tracking       │
        │                                       └────────────────┘
        ▼                                              │
┌─ Order Tracking ─┐                                   │
│ GET /orders/:id  │<──────────────────────────────────┘
└─────────────────┘

// 1. Product Browse API
GET /api/products
Query Parameters: {
    category: string,
    priceRange: object,
    rating: number,
    page: number,
    limit: number
}

// 2. Cart Management APIs
POST /api/cart/add
Request: {
    productId: string,
    quantity: number
}

GET /api/cart
Response: {
    items: [{
        product: object,
        quantity: number,
        price: number
    }],
    total: number
}

// 3. Create Order API
POST /api/orders
Request: {
    items: [{
        productId: string,
        quantity: number
    }],
    deliveryAddress: {
        street: string,
        city: string,
        pinCode: string
    },
    paymentMethod: string
}
Response: {
    orderId: string,
    total: number,
    deliveryEstimate: date,
    paymentUrl: string
}

// 4. Order Tracking API
GET /api/orders/:id/track
Response: {
    status: string,
    delivery: {
        status: string,
        trackingId: string,
        currentLocation: object,
        estimatedDelivery: date
    }
}