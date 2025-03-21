# Growth & Engagement API Documentation

## Overview
This document outlines the APIs for user growth and engagement features that work alongside the external events system.

## Base URL
```
http://localhost:5001/api
```

## Endpoints

### 1. Landing Page Content
Get curated content for the landing page including trending events, offers, and platform statistics.

**Endpoint:** `GET /landing-content`

**Query Parameters:**
- `latitude` (optional): User's latitude
- `longitude` (optional): User's longitude
- `city` (optional): City name

**Response:**
```json
{
  "success": true,
  "data": {
    "highlights": {
      "trending": [
        {
          "id": "event123",
          "title": "Weekend Festival",
          "category": "entertainment",
          "location": {
            "city": "Mumbai",
            "venue": "City Mall"
          },
          "thumbnail": "image_url",
          "date": "2024-03-20T18:00:00Z"
        }
      ],
      "featured": [...],
      "thisWeekend": [...],
      "offers": [...]
    },
    "statistics": {
      "totalEvents": "1000+",
      "activeOffers": "500+",
      "cities": "50+",
      "categories": "15+"
    },
    "popularCategories": [
      {
        "name": "Sports",
        "count": 150,
        "icon": "sports_icon"
      }
    ]
  }
}
```

### 2. Track Anonymous Activity
Track anonymous user activity and get personalized signup prompts.

**Endpoint:** `POST /track-activity`

**Request Body:**
```json
{
  "sessionId": "session123",
  "activity": {
    "type": "view_event",
    "eventId": "event123",
    "category": "sports",
    "timestamp": "2024-03-15T10:30:00Z"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shouldPrompt": true,
    "prompt": {
      "title": "Don't miss out!",
      "message": "Love sports? Sign up to get notifications about upcoming sports events!",
      "benefits": [
        "Get personalized recommendations",
        "Save your favorite events",
        "Exclusive offers and early access",
        "Create and share your own events"
      ],
      "cta": "Sign up now - it's free!"
    }
  }
}
```

### 3. Share Content Generation
Generate shareable content for social media.

**Endpoint:** `GET /share-content/:eventId`

**Response:**
```json
{
  "success": true,
  "data": {
    "whatsapp": {
      "text": "Check out Weekend Festival and more events on EventPlatform! http://eventplatform.com/e/event123?ref=share"
    },
    "twitter": {
      "text": "Discovered amazing entertainment events in Mumbai! http://eventplatform.com/e/event123?ref=share #Events #Entertainment",
    },
    "facebook": {
      "quote": "Looking for entertainment events in Mumbai? Check out Weekend Festival and more!",
      "hashtag": "#EntertainmentEvents"
    }
  }
}
```

### 4. Track Share Activity
Track when users share events.

**Endpoint:** `POST /track-share`

**Request Body:**
```json
{
  "eventId": "event123",
  "platform": "whatsapp",
  "shareId": "share123",
  "referrer": "user456"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shares": 15,
    "views": 45,
    "signups": 3
  }
}
```

### 5. SEO Metadata
Get SEO metadata for different pages.

**Endpoint:** `GET /seo-metadata`

**Query Parameters:**
- `page`: Page type (home, category, event)
- `data`: Additional data for metadata generation

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "Discover Events & Offers Near You | EventPlatform",
    "description": "Find and explore local events, activities, and exclusive offers in your city. Join our community to create and share events.",
    "keywords": ["events", "local events", "offers", "activities", "community"],
    "structuredData": {
      "@context": "http://schema.org",
      "@type": "WebPage",
      "name": "EventPlatform - Discover Events",
      // ... more structured data
    }
  }
}
```

## Error Responses
All endpoints follow the same error response format:

```json
{
  "success": false,
  "error": {
    "message": "Error description",
    "code": "ERROR_CODE"
  }
}
```

Common error codes:
- `400`: Bad Request
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting
- Anonymous users: 100 requests per hour per IP
- Authenticated users: 1000 requests per hour

## Integration with External Events
The growth and engagement APIs work alongside the external events system:
1. Landing page content includes both external and user-generated events
2. Activity tracking works for both types of events
3. Sharing features work uniformly across all event types
4. SEO metadata is generated for both external and platform events

## Environment Variables
Required environment variables:
```
PLATFORM_NAME=YourPlatformName
PLATFORM_URL=https://yourplatform.com
ACTIVITY_TRACKING_ENABLED=true
SIGNUP_PROMPT_THRESHOLD=3
SHARE_TRACKING_ENABLED=true
``` 