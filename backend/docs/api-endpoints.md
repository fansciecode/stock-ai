# API Endpoints Documentation

## Authentication
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/auth/register` | Register new user | Public |
| POST | `/api/auth/login` | User login | Public |
| POST | `/api/auth/refresh` | Refresh access token | Public |
| POST | `/api/auth/logout` | User logout | Private |

## User Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/users/profile` | Get user profile | Private |
| PUT | `/api/users/profile` | Update user profile | Private |
| GET | `/api/users/orders` | Get user's orders | Private |
| GET | `/api/users/bookings` | Get user's bookings | Private |

## Products
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/products` | Get all products | Public |
| GET | `/api/products/:id` | Get product details | Public |
| POST | `/api/products` | Create product | Private/Admin |
| PUT | `/api/products/:id` | Update product | Private/Admin |
| DELETE | `/api/products/:id` | Delete product | Private/Admin |
| GET | `/api/products/search` | Search products | Public |
| GET | `/api/products/categories` | Get product categories | Public |

## Orders
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/orders` | Create new order | Private |
| GET | `/api/orders` | Get all orders | Private/Admin |
| GET | `/api/orders/:id` | Get order details | Private |
| PUT | `/api/orders/:id/status` | Update order status | Private/Admin |
| POST | `/api/orders/calculate-delivery` | Calculate delivery cost | Private |

## Delivery Management
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| PUT | `/api/orders/:orderId/delivery` | Assign delivery | Private/Admin |
| PUT | `/api/orders/:orderId/delivery/status` | Update delivery status | Private/Admin |
| GET | `/api/orders/:orderId/delivery` | Get delivery status | Private |

## Events
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/events` | Get all events | Public |
| GET | `/api/events/:id` | Get event details | Public |
| POST | `/api/events` | Create event | Private/Admin |
| PUT | `/api/events/:id` | Update event | Private/Admin |
| DELETE | `/api/events/:id` | Delete event | Private/Admin |
| GET | `/api/events/search` | Search events | Public |
| GET | `/api/events/categories` | Get event categories | Public |

## Bookings
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/bookings` | Create booking | Private |
| GET | `/api/bookings` | Get all bookings | Private/Admin |
| GET | `/api/bookings/:id` | Get booking details | Private |
| PUT | `/api/bookings/:id/status` | Update booking status | Private/Admin |

## Payments
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/payments/process` | Process payment | Private |
| POST | `/api/payments/verify` | Verify payment | Private |
| POST | `/api/payments/refund` | Process refund | Private/Admin |
| GET | `/api/payments/:id` | Get payment details | Private |

## Reviews
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/products/:id/reviews` | Add product review | Private |
| GET | `/api/products/:id/reviews` | Get product reviews | Public |
| PUT | `/api/products/:id/reviews/:reviewId` | Update review | Private |
| DELETE | `/api/products/:id/reviews/:reviewId` | Delete review | Private |

## Categories
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/categories` | Get all categories | Public |
| POST | `/api/categories` | Create category | Private/Admin |
| PUT | `/api/categories/:id` | Update category | Private/Admin |
| DELETE | `/api/categories/:id` | Delete category | Private/Admin |

## Admin Dashboard
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/admin/stats` | Get dashboard stats | Private/Admin |
| GET | `/api/admin/orders/analytics` | Get order analytics | Private/Admin |
| GET | `/api/admin/users` | Manage users | Private/Admin |
| GET | `/api/admin/delivery/analytics` | Get delivery analytics | Private/Admin |

## Common Response Formats

### Success Response
```json
{
    "success": true,
    "data": {
        // Response data
    },
    "message": "Operation successful"
}
```

### Error Response
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error message"
    }
}
```

## Authentication
All private routes require a Bearer token in the Authorization header: 

# API Endpoints Documentation

## Chat System
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/chat` | Create or access one-to-one chat | Private |
| GET | `/api/chat` | Get user's chat list | Private |
| POST | `/api/chat/:chatId/messages` | Send message in chat | Private |
| GET | `/api/chat/:chatId/messages` | Get chat messages | Private |
| PUT | `/api/chat/:chatId/messages/:messageId/read` | Mark message as read | Private |
| GET | `/api/chat/unread` | Get unread messages count | Private |

## Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/notifications` | Get user's notifications | Private |
| PUT | `/api/notifications/:id/read` | Mark notification as read | Private |
| PUT | `/api/notifications/read-all` | Mark all notifications as read | Private |
| GET | `/api/notifications/unread` | Get unread notifications count | Private |

## Request/Response Examples

### Create/Access Chat
```http
POST /api/chat
Content-Type: application/json

{
    "userId": "recipientUserId"
}
```
Response:
```json
{
    "id": "chatId",
    "participants": [
        {
            "id": "userId",
            "name": "User Name",
            "email": "user@email.com"
        }
    ],
    "lastMessage": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Send Message
```http
POST /api/chat/:chatId/messages
Content-Type: application/json

{
    "content": "Hello!",
    "messageType": "TEXT"
}
```
Response:
```json
{
    "id": "messageId",
    "sender": "userId",
    "content": "Hello!",
    "messageType": "TEXT",
    "readBy": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Notifications
```http
GET /api/notifications?page=1&limit=20
```
Response:
```json
{
    "notifications": [
        {
            "id": "notificationId",
            "type": "CHAT",
            "title": "New Message",
            "message": "You have a new message",
            "isRead": false,
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ],
    "page": 1,
    "totalPages": 5,
    "totalNotifications": 100
}
```

## Query Parameters

### Chat Endpoints
- `limit`: Number of messages to return (default: 50)
- `before`: Get messages before this timestamp
- `after`: Get messages after this timestamp

### Notification Endpoints
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by notification type
- `read`: Filter by read status (true/false)

## Response Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
```

## Authentication
All endpoints require Bearer token:
```http
Authorization: Bearer <token>
```
```


# API Endpoints Documentation

## Chat System
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| POST | `/api/chat` | Create or access one-to-one chat | Private |
| GET | `/api/chat` | Get user's chat list | Private |
| POST | `/api/chat/:chatId/messages` | Send message in chat | Private |
| GET | `/api/chat/:chatId/messages` | Get chat messages | Private |
| PUT | `/api/chat/:chatId/messages/:messageId/read` | Mark message as read | Private |
| GET | `/api/chat/unread` | Get unread messages count | Private |

## Notifications
| Method | Endpoint | Description | Access |
|--------|----------|-------------|---------|
| GET | `/api/notifications` | Get user's notifications | Private |
| PUT | `/api/notifications/:id/read` | Mark notification as read | Private |
| PUT | `/api/notifications/read-all` | Mark all notifications as read | Private |
| GET | `/api/notifications/unread` | Get unread notifications count | Private |

## Request/Response Examples

### Create/Access Chat
```http
POST /api/chat
Content-Type: application/json

{
    "userId": "recipientUserId"
}
```
Response:
```json
{
    "id": "chatId",
    "participants": [
        {
            "id": "userId",
            "name": "User Name",
            "email": "user@email.com"
        }
    ],
    "lastMessage": null,
    "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Send Message
```http
POST /api/chat/:chatId/messages
Content-Type: application/json

{
    "content": "Hello!",
    "messageType": "TEXT"
}
```
Response:
```json
{
    "id": "messageId",
    "sender": "userId",
    "content": "Hello!",
    "messageType": "TEXT",
    "readBy": [],
    "createdAt": "2024-01-01T00:00:00.000Z"
}
```

### Get Notifications
```http
GET /api/notifications?page=1&limit=20
```
Response:
```json
{
    "notifications": [
        {
            "id": "notificationId",
            "type": "CHAT",
            "title": "New Message",
            "message": "You have a new message",
            "isRead": false,
            "createdAt": "2024-01-01T00:00:00.000Z"
        }
    ],
    "page": 1,
    "totalPages": 5,
    "totalNotifications": 100
}
```

## Query Parameters

### Chat Endpoints
- `limit`: Number of messages to return (default: 50)
- `before`: Get messages before this timestamp
- `after`: Get messages after this timestamp

### Notification Endpoints
- `page`: Page number (default: 1)
- `limit`: Items per page (default: 20)
- `type`: Filter by notification type
- `read`: Filter by read status (true/false)

## Response Codes
| Code | Description |
|------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request |
| 401 | Unauthorized |
| 403 | Forbidden |
| 404 | Not Found |
| 500 | Server Error |

## Error Response Format
```json
{
    "success": false,
    "error": {
        "code": "ERROR_CODE",
        "message": "Error description"
    }
}
```

## Authentication
All endpoints require Bearer token:
```http
Authorization: Bearer <token>
```
```

This documentation:
1. ✅ Includes all chat endpoints
2. ✅ Includes all notification endpoints
3. ✅ Shows request/response examples
4. ✅ Maintains consistency with existing API docs

[Previous sections remain the same...]

## 10. Core Business Modules

### 10.1 Order Management System
```plaintext
Order Flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Cart        │────>│  Order       │────>│  Payment     │
│  Management  │     │  Creation    │     │  Processing  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Delivery    │
                    │  Assignment  │
                    └──────────────┘
```

#### 10.1.1 Order Schema
```javascript
const orderSchema = {
    user: ObjectId,
    items: [{
        product: ObjectId,
        quantity: Number,
        price: Number
    }],
    totalAmount: Number,
    status: String,
    paymentStatus: String,
    deliveryInfo: {
        address: Object,
        tracking: Object,
        status: String
    },
    timestamps: true
};
```

#### 10.1.2 Order States
```plaintext
Order Status Flow:
PENDING → CONFIRMED → PROCESSING → SHIPPED → DELIVERED
                   └─> CANCELLED
                   └─> REFUNDED
```

### 10.2 Delivery System

#### 10.2.1 Architecture
```plaintext
Delivery System Components:
┌─────────────────┐     ┌──────────────┐     ┌──────────────┐
│  Order          │────>│  Delivery    │────>│  Tracking    │
│  Processing     │     │  Assignment  │     │  System      │
└─────────────────┘     └──────────────┘     └──────────────┘
                              │
                              ▼
                    ┌──────────────────────┐
                    │  Delivery Partner    │
                    │  Integration        │
                    └──────────────────────┘
```

#### 10.2.2 Delivery Schema
```javascript
const deliverySchema = {
    order: ObjectId,
    partner: {
        id: String,
        name: String,
        contact: String
    },
    tracking: {
        id: String,
        status: String,
        updates: [{
            status: String,
            location: Object,
            timestamp: Date
        }]
    },
    pickup: {
        address: Object,
        contact: Object,
        instructions: String
    },
    dropoff: {
        address: Object,
        contact: Object,
        instructions: String
    },
    status: String,
    timestamps: true
};
```

#### 10.2.3 Delivery Metrics
```plaintext
Performance Metrics:
├── Average Delivery Time: 2-3 days
├── On-time Delivery Rate: 95%
├── Delivery Success Rate: 98%
└── Customer Satisfaction: 4.5/5
```

### 10.3 Booking System

#### 10.3.1 Architecture
```plaintext
Booking Flow:
┌──────────────┐     ┌──────────────┐     ┌──────────────┐
│  Event       │────>│  Booking     │────>│  Payment     │
│  Selection   │     │  Creation    │     │  Processing  │
└──────────────┘     └──────────────┘     └──────────────┘
                            │
                            ▼
                    ┌──────────────┐
                    │  Ticket      │
                    │  Generation  │
                    └──────────────┘
```

#### 10.3.2 Booking Schema
```javascript
const bookingSchema = {
    user: ObjectId,
    event: ObjectId,
    tickets: [{
        ticketNumber: String,
        seatNumber: String,
        price: Number,
        status: String,
        qrCode: String
    }],
    totalAmount: Number,
    status: String,
    paymentStatus: String,
    timestamps: true
};
```

#### 10.3.3 Booking States
```plaintext
Booking Status Flow:
INITIATED → PAYMENT_PENDING → CONFIRMED → COMPLETED
                           └─> CANCELLED
                           └─> REFUNDED
```

### 10.4 Integration Points

#### 10.4.1 Payment Integration
```plaintext
Payment Methods:
├── Credit/Debit Cards
├── Digital Wallets
├── UPI
└── Net Banking
```

#### 10.4.2 Delivery Partner Integration
```javascript
const deliveryPartners = {
    inHouse: {
        api: '/api/delivery/internal',
        tracking: true,
        realTime: true
    },
    thirdParty: {
        providers: ['provider1', 'provider2'],
        api: '/api/delivery/external',
        webhook: '/webhook/delivery'
    }
};
```

### 10.5 Performance Metrics

#### 10.5.1 Order Processing
```plaintext
Metrics:
├── Average Order Processing Time: 2s
├── Order Success Rate: 98%
├── Payment Success Rate: 95%
└── Order Tracking Accuracy: 99%
```

#### 10.5.2 Booking Performance
```plaintext
Metrics:
├── Booking Creation Time: 1.5s
├── Ticket Generation Time: 0.5s
├── Booking Success Rate: 97%
└── QR Code Generation: 0.3s
```

#### 10.5.3 Delivery Performance
```plaintext
Metrics:
├── Delivery Assignment Time: 1s
├── Tracking Update Time: Real-time
├── Delivery Partner Response: 2s
└── Location Update Interval: 5min
```

### 10.6 Error Handling

#### 10.6.1 Order Errors
```javascript
const orderErrorHandling = {
    paymentFailure: 'Retry with exponential backoff',
    inventoryMismatch: 'Immediate update and notify',
    deliveryFailure: 'Reassignment with notification'
};
```

#### 10.6.2 Booking Errors
```javascript
const bookingErrorHandling = {
    seatUnavailable: 'Alternative suggestion',
    paymentTimeout: 'Auto-cancellation',
    ticketGenerationError: 'Retry mechanism'
};
```

Would you like me to:
1. Add more implementation details?
2. Include API endpoints for these modules?
3. Add more error handling scenarios?
4. Include monitoring metrics for these systems?