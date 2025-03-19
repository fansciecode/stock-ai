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

### 7. Search by Category
Search for events and places by specific categories and subcategories.

**Endpoint:** `GET /events/category`

**Query Parameters:**
- `latitude` (required): User's latitude (float)
- `longitude` (required): User's longitude (float)
- `radius` (optional): Search radius in kilometers (default: 5)
- `category` (required): Main category
- `subcategory` (optional): Specific subcategory

**Available Categories:**

1. **Sports & Recreation** (`sports`)
   - Racing
   - Badminton
   - Horse Riding
   - Cycling
   - Online Gaming
   - Football
   - Basketball
   - Swimming
   - Cricket
   - Tennis
   - Adventure Sports

2. **Cultural & Arts** (`culture`)
   - Visual Arts
   - Dance Performances
   - Music Concerts
   - Literature & Poetry
   - Traditional & Folk Events

3. **Entertainment & Nightlife** (`entertainment`)
   - Comedy Shows
   - Movie Screenings
   - Theatre & Drama
   - Music Festivals
   - Clubbing & Nightlife
   - DJ Nights

4. **Health & Fitness** (`health`)
   - Gym & Personal Training
   - Yoga & Meditation
   - Martial Arts
   - CrossFit & HIIT
   - Nutrition Consultation
   - Alternative Healing

5. **Fashion & Beauty** (`fashion`)
   - Salons & Haircuts
   - Spa & Wellness
   - Fashion Exhibitions
   - Beauty Services
   - Jewelry & Accessories

6. **Hospitality & Tourism** (`hospitality`)
   - Hotels & Resorts
   - Guest Houses
   - Travel Agencies
   - Transport Services

7. **Food & Beverages** (`food`)
   - Restaurants
   - Food Festivals
   - Cooking Classes
   - Local Food
   - Wine & Beer Tasting

8. **Education & Professional** (`education`)
   - Schools & Colleges
   - Courses & Training
   - Workshops & Seminars
   - Professional Services

9. **Services** (`services`)
   - Home Services
   - Pet Services
   - Transport & Logistics
   - Financial Services

**Example Request:**
```
GET /api/external/events/category?latitude=19.0760&longitude=72.8777&category=sports&subcategory=cricket
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "place123",
      "source": "google",
      "type": "stadium",
      "title": "Cricket Ground Name",
      "address": "Full Address",
      "location": {
        "latitude": 19.0760,
        "longitude": 72.8777
      },
      "rating": 4.5,
      "totalRatings": 1000,
      "photos": ["photo_url1", "photo_url2"],
      "openNow": true,
      "category": "sports",
      "types": ["stadium", "sports_complex"]
    }
  ]
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