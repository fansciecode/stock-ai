Registration Flow:

1. Sign Up → 2. Verification → 3. Profile Setup → 4. Preferences

┌─ Sign Up Form ─┐      ┌─ Email Verification ┐    ┌─ Profile Setup ─┐
│ POST /register │─────>│ POST /verify/email  │───>│ POST /profile   │
└───────────────┘      └───────────────────┘     └───────────────┘
        │                                               │
        │                                               ▼
        │                                        ┌─ Preferences ─┐
        └───────────────────────────────────────>│ Categories   │
                                                │ Notifications │
                                                └──────────────┘

                                                // 1. Registration API
POST /api/auth/register
Request: {
    name: string,
    email: string,
    password: string,
    phone: string
}
Response: {
    userId: string,
    verificationToken: string
}

// 2. Email Verification API
POST /api/auth/verify-email
Request: {
    token: string
}
Response: {
    verified: boolean,
    redirectUrl: string
}

// 3. Profile Setup API
POST /api/users/profile
Request: {
    userId: string,
    avatar: file,
    location: {
        city: string,
        coordinates: [number, number]
    },
    preferences: {
        categories: string[],
        notificationPreferences: object
    }
}