Notification Flow:

1. Event Trigger → 2. Notification Creation → 3. Delivery → 4. Status Update

┌─ Event Triggers ─┐     ┌─ Create Notification ┐    ┌─ Delivery ─┐
│ - New Message    │────>│ POST /notifications  │───>│ - Push     │
│ - Order Update   │     └───────────────────┘     │ - Email    │
│ - Booking Update │                                │ - SMS      │
└─────────────────┘                                └───────────┘
         │                                               │
         │                                               ▼
         │                                        ┌─ Status Update ─┐
         └───────────────────────────────────────>│ - Read         │
                                                 │ - Delivered     │
                                                 └───────────────┘

                                                 // 1. Create Notification API
POST /api/notifications
Request: {
    userId: string,
    type: 'CHAT' | 'ORDER' | 'BOOKING' | 'SYSTEM',
    title: string,
    message: string,
    data: object,
    priority: 'HIGH' | 'NORMAL' | 'LOW'
}

// 2. Get User Notifications API
GET /api/notifications
Query Parameters: {
    page: number,
    limit: number,
    type: string,
    read: boolean
}
Response: {
    notifications: [{
        id: string,
        type: string,
        title: string,
        message: string,
        read: boolean,
        createdAt: date
    }],
    unreadCount: number
}

// 3. Mark Notification Read API
PUT /api/notifications/:id/read
Response: {
    success: boolean,
    readAt: date
}

// 4. Notification Preferences API
PUT /api/users/notification-preferences
Request: {
    email: boolean,
    push: boolean,
    sms: boolean,
    types: {
        chat: boolean,
        order: boolean,
        booking: boolean,
        promotional: boolean
    }
}