# Android API Guide for Media Handling

## New Media Upload System

We've implemented a new media upload system that properly handles content URIs from Android devices. This guide explains how to use the new system with your app.

## Issue with Current Implementation

The current implementation tries to send content URIs (e.g., `content://com.android.providers.media.documents/document/image%3A159654`) directly to the server, which doesn't work because:
1. The server cannot access local files on the Android device
2. The server expects actual image/video files, not URIs

## Solution Overview

We've built a new media upload API that supports two approaches:

1. **Two-Step Approach (Preferred):** Upload files first, then create/update events using the returned URLs
2. **Compatibility Mode:** Send content URIs in event creation, and the server will create placeholders

## API Endpoints

### 1. Media Upload API

```
POST /api/media/upload
```

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: The media file (image or video)
- `eventId` (optional): ID of the event to associate with this media
- `mediaId` (optional): ID of the media item to replace
- `caption` (optional): Caption for the media

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mediaId",
    "url": "/uploads/images/file-1234567890.jpg",
    "type": "image",
    "filename": "file-1234567890.jpg"
  },
  "message": "File uploaded successfully"
}
```

### 2. Update Event Media

```
PUT /api/media/event/:eventId
```

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "mediaItems": [
    {
      "id": "media1Id",
      "caption": "First image",
      "type": "image",
      "url": "/uploads/images/file-1234567890.jpg"
    },
    {
      "id": "media2Id",
      "caption": "Video",
      "type": "video",
      "url": "/uploads/videos/file-0987654321.mp4"
    }
  ]
}
```

**Response:**
```json
{
  "success": true,
  "data": [
    {
      "id": "media1Id",
      "caption": "First image",
      "type": "image",
      "url": "/uploads/images/file-1234567890.jpg"
    },
    {
      "id": "media2Id",
      "caption": "Video",
      "type": "video",
      "url": "/uploads/videos/file-0987654321.mp4"
    }
  ],
  "message": "Event media updated successfully"
}
```

### 3. Android Helper API: Handle Content URIs

This API helps with converting content URIs into placeholders and preparing for upload:

```
POST /api/android/handle-content-uris
```

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: application/json`

**Request Body:**
```json
{
  "contentUris": [
    "content://com.android.providers.media.documents/document/image%3A159654",
    "content://com.android.providers.media.documents/document/video%3A157445"
  ],
  "eventId": "eventId" // Optional - If provided, adds placeholders to the event
}
```

**Response:**
```json
{
  "success": true,
  "data": {
    "processedItems": [
      {
        "id": "generatedId1",
        "uri": "content://com.android.providers.media.documents/document/image%3A159654",
        "type": "image",
        "placeholder": "/uploads/images/placeholder_generatedId1.jpg",
        "uploadUrl": "/api/media/upload"
      },
      {
        "id": "generatedId2",
        "uri": "content://com.android.providers.media.documents/document/video%3A157445",
        "type": "video",
        "placeholder": "/uploads/videos/placeholder_generatedId2.jpg",
        "uploadUrl": "/api/media/upload"
      }
    ],
    "uploadInstructions": "For each item, upload the content URI file using multipart form to the uploadUrl, including the item.id as mediaId and eventId as eventId in the form data."
  }
}
```

## Implementation Guide

### Option 1: Two-Step Approach (Recommended)

#### Step 1: Upload Media Files First
```kotlin
// For each selected media file
for (mediaFile in selectedMediaFiles) {
    // Create multipart form with the file
    val requestBody = MultipartBody.Builder()
        .setType(MultipartBody.FORM)
        .addFormDataPart("file", filename, fileRequestBody)
        .addFormDataPart("caption", caption)
        .build()
        
    // Upload file
    val response = apiService.uploadMedia(requestBody)
    
    // Store the returned URL for use in event creation
    uploadedMediaUrls.add(response.data.url)
}
```

#### Step 2: Create Event with Uploaded Media URLs
```kotlin
// Create event with uploaded media URLs
val eventData = EventCreateRequest(
    title = title,
    description = description,
    // ... other fields
    media = uploadedMediaUrls.map { url ->
        MediaItem(
            id = UUID.randomUUID().toString(),
            caption = "Media",
            type = if (url.contains("/videos/")) "video" else "image",
            url = url
        )
    }
)

// Create the event
apiService.createEvent(eventData)
```

### Option 2: Use the Helper API for Content URIs

#### Step 1: Process Content URIs First
```kotlin
// Process content URIs before creating event
val contentUris = selectedMediaFiles.map { it.uri.toString() }
val response = apiService.handleContentUris(ContentUriRequest(contentUris))

// Store the processed items for later upload
val processedItems = response.data.processedItems
```

#### Step 2: Create Event with Placeholders (Optional)
```kotlin
// Create event with placeholder URLs from processed items
val eventData = EventCreateRequest(
    title = title,
    description = description,
    // ... other fields
    media = processedItems.map { item ->
        MediaItem(
            id = item.id,
            caption = "Pending upload",
            type = item.type,
            url = item.placeholder
        )
    }
)

// Create the event
val eventResponse = apiService.createEvent(eventData)
val eventId = eventResponse.data.id
```

#### Step 3: Upload Actual Files and Update
```kotlin
// For each processed item, upload the actual file
for (item in processedItems) {
    val mediaFile = selectedMediaFiles.find { it.uri.toString() == item.uri }
    
    if (mediaFile != null) {
        // Create multipart form with the file
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", filename, fileRequestBody)
            .addFormDataPart("mediaId", item.id)
            .addFormDataPart("eventId", eventId)
            .build()
            
        // Upload file
        apiService.uploadMedia(requestBody)
    }
}
```

## Version Compatibility API

We've also added a version check API to help you adapt your app to API changes:

```
GET /api/android/version-check?version=YOUR_APP_VERSION
```

**Response:**
```json
{
  "success": true,
  "data": {
    "compatible": true,
    "requiresUpdate": false,
    "hasUpdate": true,
    "minVersion": "1.0.0",
    "latestVersion": "2.0.0",
    "features": {
      "mediaUpload": true,
      "contentUriHandling": true
    }
  }
}
```

This helps your app adapt to available features or show update prompts if needed.

## Best Practices

1. **Always upload files first** when possible, then create/update events
2. **Use the Helper API** if you need to support older app versions that send content URIs
3. **Show upload progress** to users for a better experience
4. **Implement retry logic** for failed uploads
5. **Handle large files** by checking file size before upload and compressing if needed

## Support

If you encounter any issues or need assistance, please contact the backend team with:
- App version
- Device information
- Logs of the upload process
- Sample content URIs that are failing 