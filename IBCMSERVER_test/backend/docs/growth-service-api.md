# Growth Service API Documentation

## Overview
The Growth Service API provides endpoints for user acquisition, engagement tracking, and platform growth features. It works in conjunction with the External Events service to provide a rich user experience even before signup.

## Base URL
```
http://localhost:5001/api/growth
```

## Endpoints

### 1. Landing Page Content
Get curated content for the landing page including trending events, offers, and platform statistics.

**Endpoint:** `GET /landing`

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
      "trending": [...],
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
    "testimonials": [...],
    "popularCategories": [...],
    "upcomingEvents": [...]
  }
}
```

### 2. Track Anonymous Activity
Track user activity before signup to provide personalized experience.

**Endpoint:** `POST /track`

**Request Body:**
```json
{
  "sessionId": "string",
  "activity": {
    "action": "view_event | search | click_offer",
    "category": "string",
    "eventId": "string",
    "timestamp": "ISO-8601 date"
  }
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shouldPromptSignup": boolean,
    "prompt": {
      "title": "string",
      "message": "string",
      "benefits": ["string"],
      "cta": "string"
    }
  }
}
```

### 3. Share Content Generation
Generate shareable content for events and offers.

**Endpoint:** `GET /share/:eventId`

**Response:**
```json
{
  "success": true,
  "data": {
    "whatsapp": {
      "text": "string"
    },
    "twitter": {
      "text": "string"
    },
    "facebook": {
      "quote": "string",
      "hashtag": "string"
    }
  }
}
```

### 4. Track Share Activity
Track sharing metrics and conversion.

**Endpoint:** `POST /share/track`

**Request Body:**
```json
{
  "eventId": "string",
  "platform": "whatsapp | twitter | facebook",
  "shareId": "string"
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "shares": number,
    "views": number,
    "signups": number
  }
}
```

### 5. SEO Metadata
Get SEO metadata for different pages.

**Endpoint:** `GET /seo/:pageType`

**Parameters:**
- `pageType`: "home" | "category" | "event"

**Query Parameters:**
- `category` (required for category type)
- `eventId` (required for event type)

**Response:**
```json
{
  "success": true,
  "data": {
    "title": "string",
    "description": "string",
    "keywords": ["string"],
    "structuredData": {...}
  }
}
```

## Error Responses
All endpoints follow the same error response format:

```json
{
  "success": false,
  "error": {
    "code": "string",
    "message": "string"
  }
}
```

Common error codes:
- `400`: Bad Request
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting
- Anonymous users: 100 requests per hour
- Shared links: 1000 views per hour

## Integration with External Events
The Growth Service works seamlessly with the External Events service:
1. Landing page content includes both external and user-generated events
2. Activity tracking works for both types of events
3. Sharing features are available for all event types
4. SEO metadata is generated for both external and internal events 