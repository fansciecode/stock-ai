Chat Flow:

1. Chat Init → 2. Message Exchange → 3. Real-time Updates → 4. Notifications

┌─ Start Chat ─┐        ┌─ Send Message ─┐      ┌─ Real-time ─┐
│ POST /chats  │───────>│ POST /messages │─────>│ WebSocket   │
└─────────────┘        └───────────────┘      └────────────┘
       │                       │                     │
       │                       │                     │
       ▼                       ▼                     ▼
┌─ Chat History ─┐    ┌─ Message Status ─┐   ┌─ Notifications ─┐
│ GET /chats     │    │ - Delivered      │   │ - Push         │
│ GET /messages  │    │ - Read           │   │ - In-App       │
└───────────────┘    └────────────────┘   └───────────────┘

// 1. Initialize Chat API
POST /api/chats
Request: {
    participantId: string,
    initialMessage: string
}
Response: {
    chatId: string,
    participants: object[],
    messages: []
}

// 2. Send Message API
POST /api/chats/:chatId/messages
Request: {
    content: string,
    type: 'TEXT' | 'IMAGE' | 'FILE'
}
Response: {
    messageId: string,
    timestamp: date,
    status: string
}

// 3. WebSocket Events
socket.on('message', {
    chatId: string,
    message: {
        sender: object,
        content: string,
        timestamp: date
    }
});

// 4. Get Chat History
GET /api/chats/:chatId/messages
Query Parameters: {
    page: number,
    limit: number,
    before: date
}