Event Booking Flow:

1. User Authentication → 2. Event Discovery → 3. Event Selection → 4. Booking → 5. Payment → 6. Confirmation

┌─ User Login/Auth ─┐     ┌─ Event Discovery ─┐    ┌─ Event Details ─┐
│  POST /auth/login │────>│  GET /events      │───>│  GET /events/:id│
└─────────────────┘      │  Query Parameters: │    └────────────────┘
                         │  - location        │            │
                         │  - category        │            │
                         │  - date           │            ▼
                         └──────────────────┘     ┌─ Seat/Ticket ─┐
                                                  │  Selection    │
                                                  └──────────────┘
                                                        │
                                                        ▼
┌─ Create Booking ─┐     ┌─ Process Payment ─┐    ┌─ Confirmation ─┐
│ POST /bookings   │<────│ POST /payments    │<───│ - Generate QR  │
└─────────────────┘     └──────────────────┘    │ - Send Email   │
                                                  └──────────────┘// 1. Event Discovery API
GET /api/events
Query Parameters: {
    location: string,
    category: string,
    date: date,
    price: range,
    page: number,
    limit: number
}

// 2. Event Details API
GET /api/events/:id
Response: {
    event: {
        title: string,
        description: string,
        date: date,
        venue: object,
        tickets: [{
            type: string,
            price: number,
            available: number
        }]
    }
}

// 3. Create Booking API
POST /api/bookings
Request: {
    eventId: string,
    tickets: [{
        type: string,
        quantity: number
    }],
    paymentMethod: string
}
Response: {
    bookingId: string,
    totalAmount: number,
    paymentUrl: string
}

// 4. Confirm Booking API
POST /api/bookings/:id/confirm
Response: {
    status: string,
    tickets: [{
        qrCode: string,
        seatNumber: string
    }]
}
// 1. Event Discovery API
GET /api/events
Query Parameters: {
    location: string,
    category: string,
    date: date,
    price: range,
    page: number,
    limit: number
}

// 2. Event Details API
GET /api/events/:id
Response: {
    event: {
        title: string,
        description: string,
        date: date,
        venue: object,
        tickets: [{
            type: string,
            price: number,
            available: number
        }]
    }
}

// 3. Create Booking API
POST /api/bookings
Request: {
    eventId: string,
    tickets: [{
        type: string,
        quantity: number
    }],
    paymentMethod: string
}
Response: {
    bookingId: string,
    totalAmount: number,
    paymentUrl: string
}

// 4. Confirm Booking API
POST /api/bookings/:id/confirm
Response: {
    status: string,
    tickets: [{
        qrCode: string,
        seatNumber: string
    }]
}