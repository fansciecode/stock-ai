# External Events API Documentation

## Overview
This document provides details about the External Events API endpoints that integrate with Google Places API and handle user reviews.

## Base URL
```
http://localhost:5001/api/external
```

## Authentication
Some endpoints require JWT authentication. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Endpoints

### 1. Search Nearby Events
Search for events near a specific location.

**Endpoint:** `GET /events/search`

**Query Parameters:**
- `latitude` (required): User's latitude (float)
- `longitude` (required): User's longitude (float)
- `radius` (optional): Search radius in kilometers (default: 5)
- `type` (optional): Type of event (e.g., "restaurant", "museum", "park")
- `keyword` (optional): Search keyword

**Response:**
```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "id": "place123",
      "name": "Event Name",
      "location": {
        "lat": 19.0760,
        "lng": 72.8777,
        "address": "Full Address"
      },
      "type": "restaurant",
      "rating": 4.5,
      "photos": ["photo_url1", "photo_url2"],
      "openNow": true,
      "priceLevel": 2
    }
  ]
}
```

### 2. Get Event Details
Get detailed information about a specific event.

**Endpoint:** `GET /events/:source/:id`

**Parameters:**
- `source`: Source of the event (e.g., "google", "local")
- `id`: Unique identifier of the event

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "place123",
    "name": "Event Name",
    "description": "Detailed description",
    "location": {
      "lat": 19.0760,
      "lng": 72.8777,
      "address": "Full Address"
    },
    "photos": ["photo_url1", "photo_url2"],
    "rating": 4.5,
    "internalRating": 4.2,
    "totalInternalReviews": 15,
    "openingHours": [
      "Monday: 9:00 AM - 10:00 PM",
      "Tuesday: 9:00 AM - 10:00 PM"
    ],
    "website": "https://example.com",
    "phoneNumber": "+1234567890"
  }
}
```

### 3. Search Offers
Search for local and online offers.

**Endpoint:** `GET /offers/search`

**Query Parameters:**
- `latitude` (required): User's latitude (float)
- `longitude` (required): User's longitude (float)
- `radius` (optional): Search radius in kilometers (default: 5)
- `category` (optional): Offer category (e.g., "food", "shopping", "entertainment")

**Response:**
```json
{
  "success": true,
  "data": {
    "localOffers": [
      {
        "id": "offer123",
        "title": "50% Off on Dinner",
        "description": "Valid until end of month",
        "venue": "Restaurant Name",
        "location": {
          "lat": 19.0760,
          "lng": 72.8777,
          "address": "Full Address"
        },
        "expiryDate": "2024-03-31T23:59:59Z"
      }
    ],
    "onlineOffers": [
      {
        "id": "online123",
        "title": "20% Off on First Order",
        "platform": "Amazon",
        "category": "shopping",
        "couponCode": "FIRST20",
        "expiryDate": "2024-03-31T23:59:59Z"
      }
    ]
  }
}
```

### 4. Add Review
Add a review for an event (requires authentication).

**Endpoint:** `POST /events/:source/:id/reviews`

**Parameters:**
- `source`: Source of the event
- `id`: Event ID

**Request Body:**
```json
{
  "rating": 5,
  "comment": "Great experience!",
  "photos": ["photo_url1", "photo_url2"]
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "review123",
    "externalId": "place123",
    "source": "google",
    "user": {
      "id": "user123",
      "name": "John Doe",
      "avatar": "avatar_url"
    },
    "rating": 5,
    "comment": "Great experience!",
    "photos": ["photo_url1", "photo_url2"],
    "likes": [],
    "createdAt": "2024-03-15T12:00:00Z"
  }
}
```

### 5. Get Reviews
Get reviews for an event.

**Endpoint:** `GET /events/:source/:id/reviews`

**Query Parameters:**
- `page` (optional): Page number (default: 1)
- `limit` (optional): Results per page (default: 10)

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "review123",
      "user": {
        "id": "user123",
        "name": "John Doe",
        "avatar": "avatar_url"
      },
      "rating": 5,
      "comment": "Great experience!",
      "photos": ["photo_url1"],
      "likes": ["user456"],
      "createdAt": "2024-03-15T12:00:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "limit": 10,
    "total": 25,
    "pages": 3
  }
}
```

### 6. Toggle Review Like
Toggle like on a review (requires authentication).

**Endpoint:** `POST /reviews/:reviewId/toggle-like`

**Response:**
```json
{
  "success": true,
  "data": {
    "isLiked": true,
    "likesCount": 15
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
- `401`: Unauthorized
- `404`: Not Found
- `429`: Too Many Requests
- `500`: Internal Server Error

## Rate Limiting
- Default: 100 requests per IP per hour
- Authenticated users: 1000 requests per hour

## Environment Variables
Required environment variables for the external events module:
```
GOOGLE_MAPS_API_KEY=your_google_maps_api_key
GOOGLE_PLACES_API_BASE_URL=https://maps.googleapis.com/maps/api/place
EXTERNAL_EVENTS_CACHE_TTL=3600
MAX_RADIUS_KM=50
DEFAULT_SEARCH_LIMIT=20
```