# Android Media Upload Integration Guide

This document explains how to implement media uploads from your Android app to the backend server.

## Overview

The backend now supports robust media uploads via a dedicated API. When creating events with images or videos, you'll need to:

1. Upload media files to the server first
2. Include the returned URLs in your event creation request

## API Endpoints

### Upload Media File

```
POST /api/media/upload
```

**Headers:**
- `Authorization: Bearer YOUR_JWT_TOKEN`
- `Content-Type: multipart/form-data`

**Request Body:**
- `file`: The media file (image or video)

**Response:**
```json
{
  "success": true,
  "data": {
    "id": "mediaId",
    "url": "/uploads/images/file-1234567890.jpg",
    "type": "image",
    "filename": "file-1234567890.jpg"
  }
}
```

## Integration Steps

### 1. Add Required Dependencies

In your app's build.gradle file:

```gradle
implementation 'com.squareup.okhttp3:okhttp:4.9.1'
implementation 'com.squareup.retrofit2:retrofit:2.9.0'
```

### 2. Create Media Upload Function

```kotlin
import android.content.Context
import android.net.Uri
import android.provider.OpenableColumns
import okhttp3.*
import org.json.JSONObject
import java.io.File
import java.io.IOException

class MediaUploadService(private val context: Context, private val apiBaseUrl: String) {

    private val client = OkHttpClient()
    
    /**
     * Upload a media file to the server
     *
     * @param uri The content URI of the file to upload
     * @param token The JWT authentication token
     * @param callback Callback with the upload result
     */
    fun uploadMedia(uri: Uri, token: String, callback: (success: Boolean, url: String?, error: String?) -> Unit) {
        // Get file from URI
        val file = getFileFromUri(context, uri) ?: run {
            callback(false, null, "Failed to get file from URI")
            return
        }
        
        val mediaType = context.contentResolver.getType(uri)?.toMediaTypeOrNull()
            ?: "application/octet-stream".toMediaTypeOrNull()
            
        // Create request body
        val requestBody = MultipartBody.Builder()
            .setType(MultipartBody.FORM)
            .addFormDataPart("file", file.name, RequestBody.create(mediaType, file))
            .build()
            
        // Create request
        val request = Request.Builder()
            .url("${apiBaseUrl}/api/media/upload")
            .header("Authorization", "Bearer $token")
            .post(requestBody)
            .build()
            
        // Execute request
        client.newCall(request).enqueue(object : Callback {
            override fun onFailure(call: Call, e: IOException) {
                callback(false, null, e.message ?: "Network error")
            }
            
            override fun onResponse(call: Call, response: Response) {
                val responseBody = response.body?.string()
                if (response.isSuccessful && responseBody != null) {
                    try {
                        val jsonObject = JSONObject(responseBody)
                        val data = jsonObject.getJSONObject("data")
                        val url = data.getString("url")
                        val id = data.getString("id")
                        val type = data.getString("type")
                        
                        callback(true, url, null)
                    } catch (e: Exception) {
                        callback(false, null, "Failed to parse response: ${e.message}")
                    }
                } else {
                    callback(false, null, "Server error: ${response.code}")
                }
            }
        })
    }
    
    /**
     * Get a File object from a content URI
     */
    private fun getFileFromUri(context: Context, uri: Uri): File? {
        // Implementation of getting a file from URI
        // This depends on how you handle files in your app
        // For a complete implementation, see:
        // https://developer.android.com/training/data-storage/shared/documents-files
        
        // Simple example for copying to a temp file:
        try {
            val inputStream = context.contentResolver.openInputStream(uri) ?: return null
            val fileName = getFileNameFromUri(context, uri) ?: "temp_${System.currentTimeMillis()}"
            val outputFile = File(context.cacheDir, fileName)
            
            inputStream.use { input ->
                outputFile.outputStream().use { output ->
                    input.copyTo(output)
                }
            }
            
            return outputFile
        } catch (e: Exception) {
            e.printStackTrace()
            return null
        }
    }
    
    /**
     * Get filename from URI
     */
    private fun getFileNameFromUri(context: Context, uri: Uri): String? {
        // Try to get the file name from the content provider
        val cursor = context.contentResolver.query(uri, null, null, null, null)
        
        return cursor?.use {
            val nameIndex = it.getColumnIndex(OpenableColumns.DISPLAY_NAME)
            if (nameIndex >= 0 && it.moveToFirst()) {
                it.getString(nameIndex)
            } else null
        } ?: uri.lastPathSegment
    }
}
```

### 3. Using the Media Upload Service

```kotlin
import android.app.Activity
import android.content.Intent
import android.net.Uri
import android.os.Bundle
import android.widget.Toast
import androidx.appcompat.app.AppCompatActivity
import org.json.JSONArray
import org.json.JSONObject
import java.util.UUID

class CreateEventActivity : AppCompatActivity() {

    private lateinit var mediaUploadService: MediaUploadService
    private val mediaList = mutableListOf<MediaItem>()
    
    override fun onCreate(savedInstanceState: Bundle?) {
        super.onCreate(savedInstanceState)
        setContentView(R.layout.activity_create_event)
        
        mediaUploadService = MediaUploadService(this, ApiConstants.BASE_URL)
        
        // Setup UI components
        // ...
        
        // Handle image selection button
        selectImageButton.setOnClickListener {
            openImagePicker()
        }
        
        // Handle event creation button
        createEventButton.setOnClickListener {
            uploadMediaAndCreateEvent()
        }
    }
    
    private fun openImagePicker() {
        val intent = Intent(Intent.ACTION_GET_CONTENT)
        intent.type = "image/*"
        startActivityForResult(intent, REQUEST_IMAGE_PICK)
    }
    
    override fun onActivityResult(requestCode: Int, resultCode: Int, data: Intent?) {
        super.onActivityResult(requestCode, resultCode, data)
        
        if (requestCode == REQUEST_IMAGE_PICK && resultCode == Activity.RESULT_OK) {
            data?.data?.let { uri ->
                // Add to pending uploads
                val mediaItem = MediaItem(
                    id = UUID.randomUUID().toString(),
                    url = uri.toString(),
                    type = "image",
                    caption = ""
                )
                mediaList.add(mediaItem)
                updateMediaPreview() // Update UI to show selected media
            }
        }
    }
    
    private fun uploadMediaAndCreateEvent() {
        showLoading(true)
        
        val uploadJobs = mediaList.size
        var completedJobs = 0
        val uploadedMedia = mutableListOf<MediaItem>()
        
        // If no media, create event directly
        if (mediaList.isEmpty()) {
            createEvent(emptyList())
            return
        }
        
        // Upload each media item
        mediaList.forEach { mediaItem ->
            val uri = Uri.parse(mediaItem.url)
            
            // Only upload if it's a content URI
            if (uri.toString().startsWith("content://")) {
                mediaUploadService.uploadMedia(uri, userToken) { success, url, error ->
                    runOnUiThread {
                        completedJobs++
                        
                        if (success && url != null) {
                            uploadedMedia.add(mediaItem.copy(url = url))
                        } else {
                            Toast.makeText(this, "Failed to upload media: $error", Toast.LENGTH_SHORT).show()
                        }
                        
                        // When all uploads are done
                        if (completedJobs == uploadJobs) {
                            createEvent(uploadedMedia)
                        }
                    }
                }
            } else {
                // Already a URL, just add it
                completedJobs++
                uploadedMedia.add(mediaItem)
                
                // When all uploads are done
                if (completedJobs == uploadJobs) {
                    createEvent(uploadedMedia)
                }
            }
        }
    }
    
    private fun createEvent(media: List<MediaItem>) {
        // Create event JSON with media URLs
        val eventJson = JSONObject().apply {
            put("title", titleEditText.text.toString())
            put("description", descriptionEditText.text.toString())
            // Add other event fields
            
            // Add media array
            put("media", JSONArray().apply {
                media.forEach { mediaItem ->
                    put(JSONObject().apply {
                        put("id", mediaItem.id)
                        put("url", mediaItem.url)
                        put("type", mediaItem.type)
                        put("caption", mediaItem.caption)
                    })
                }
            })
        }
        
        // Make API call to create event
        // ...
        
        showLoading(false)
    }
    
    companion object {
        private const val REQUEST_IMAGE_PICK = 1001
    }
    
    data class MediaItem(
        val id: String,
        val url: String,
        val type: String,
        val caption: String
    )
}
```

## Notes for Production

1. **Error Handling**: Implement proper error handling and retry logic for uploads
2. **Progress Tracking**: Add progress indicators for uploads
3. **Image Compression**: Consider compressing images before upload to reduce bandwidth
4. **Background Processing**: For large uploads, consider using WorkManager for background processing
5. **Token Handling**: Ensure your authentication token is valid before attempting uploads

## API Response Details

### Successful Upload Response

```json
{
  "success": true,
  "data": {
    "id": "615f8a2d0c87a92b28e1f5c3",
    "url": "/uploads/images/file-1633695277123.jpg",
    "type": "image",
    "filename": "file-1633695277123.jpg"
  }
}
```

### Error Response

```json
{
  "success": false,
  "message": "Error message",
  "errorCode": "ERROR_CODE"
}
```

## Common Error Codes

- `NO_FILE`: No file was included in the upload request
- `UPLOAD_ERROR`: General error during file upload
- `UNAUTHORIZED`: Authentication token is missing or invalid

## Support

For any issues with media uploads, please contact the backend team with detailed error logs. 