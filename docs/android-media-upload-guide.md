# Android Media Upload Guide

## Overview

The media upload process for Android has been improved to handle content URIs. Here's how the process works:

1. **Event Creation with Content URIs**: When creating an event with media, the Android app sends content URIs.
2. **Server Creates Placeholders**: The server creates placeholder URLs for these content URIs.
3. **File Upload**: After event creation, the Android app must upload the actual files.
4. **Media Update**: Once uploaded, the media items in the event are updated with the real URLs.

## Implementation Steps

### 1. Create Event with Content URIs

```kotlin
// Example of how to prepare media items for event creation
val mediaItems = listOf(
    EventMedia(
        id = UUID.randomUUID().toString(),
        caption = "Event image 1",
        type = "image",
        url = "content://com.android.providers.media.documents/document/image:12345"
    ),
    EventMedia(
        id = UUID.randomUUID().toString(),
        caption = "Event video 1",
        type = "video",
        url = "content://com.android.providers.media.documents/document/video:67890"
    )
)

// Include these media items in your event creation request
val event = EnhancedEvent(
    // other event details...
    media = mediaItems
)

// Send the event creation request
apiService.createEvent(event)
```

### 2. Upload Files After Event Creation

Once the event is created, you'll receive a response with the event ID and media placeholders. You need to upload the actual files:

```kotlin
// After successful event creation:
fun uploadMediaFiles(eventId: String, mediaItems: List<EventMedia>) {
    for (mediaItem in mediaItems) {
        val contentUri = Uri.parse(mediaItem.url)
        
        // Convert content URI to file
        val file = convertContentUriToFile(contentUri)
        
        // Create multipart form data
        val requestBody = RequestBody.create(MediaType.parse("multipart/form-data"), file)
        val filePart = MultipartBody.Part.createFormData("file", file.name, requestBody)
        
        // Create other parameters
        val eventIdParam = RequestBody.create(MediaType.parse("text/plain"), eventId)
        val mediaIdParam = RequestBody.create(MediaType.parse("text/plain"), mediaItem.id)
        val captionParam = RequestBody.create(MediaType.parse("text/plain"), mediaItem.caption ?: "")
        
        // Make the upload API call
        apiService.uploadMedia(filePart, eventIdParam, mediaIdParam, captionParam)
    }
}

// Helper function to convert content URI to file
fun convertContentUriToFile(contentUri: Uri): File {
    val inputStream = context.contentResolver.openInputStream(contentUri)
    val fileName = getFileName(contentUri)
    val tempFile = File(context.cacheDir, fileName)
    
    tempFile.outputStream().use { outputStream ->
        inputStream?.copyTo(outputStream)
    }
    
    return tempFile
}

// Helper function to get filename from content URI
fun getFileName(contentUri: Uri): String {
    var fileName = "file_${System.currentTimeMillis()}"
    val cursor = context.contentResolver.query(contentUri, null, null, null, null)
    
    cursor?.use {
        if (it.moveToFirst()) {
            val displayNameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (displayNameIndex != -1) {
                fileName = it.getString(displayNameIndex)
            }
        }
    }
    
    return fileName
}
```

### 3. API Endpoints

- **Create Event**: `POST /api/events`
- **Upload Media**: `POST /api/media/upload`
  - Parameters: 
    - `file`: The actual media file (image/video)
    - `eventId`: ID of the event to associate with
    - `mediaId`: ID of the specific media item to update
    - `caption`: Optional caption for the media

## Best Practices

1. **Generate Unique IDs**: Always generate unique IDs for each media item.
2. **Show Upload Progress**: Implement progress indicators during the upload process.
3. **Handle Errors**: Implement proper error handling for failed uploads.
4. **Compress Large Files**: Consider compressing large images and videos before upload.
5. **Background Processing**: Handle uploads in a background service to continue if the app is closed.

## Testing

You can verify the upload process by:

1. Creating an event with content URIs
2. Checking the database for placeholder URLs
3. Uploading actual files
4. Verifying the database entries have been updated with actual file URLs 