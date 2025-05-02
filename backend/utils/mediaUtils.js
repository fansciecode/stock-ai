import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createLogger } from './logger.js';
import FormData from 'form-data';
import mime from 'mime-types';

const logger = createLogger('mediaUtils');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDir = path.resolve(__dirname, '../../uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');
const tempDir = path.join(uploadDir, 'temp');

// Ensure directories exist
try {
    if (!fs.existsSync(uploadDir)) {
        fs.mkdirSync(uploadDir, { recursive: true });
    }
    if (!fs.existsSync(imageDir)) {
        fs.mkdirSync(imageDir, { recursive: true });
    }
    if (!fs.existsSync(videoDir)) {
        fs.mkdirSync(videoDir, { recursive: true });
    }
    if (!fs.existsSync(tempDir)) {
        fs.mkdirSync(tempDir, { recursive: true });
    }
} catch (error) {
    logger.error('Error creating upload directories:', error);
}

/**
 * Process media URLs from Android content URIs
 * @param {Array} mediaItems - Array of media items with content URIs
 * @param {Object} options - Options for processing
 * @returns {Promise<Array>} - Array of processed media items with updated URLs
 */
export const processMediaUrls = async (mediaItems, options = {}) => {
    if (!mediaItems || !Array.isArray(mediaItems)) {
        return [];
    }

    const baseUrl = options.baseUrl || '';
    const processedItems = [];

    for (const item of mediaItems) {
        const url = item.url || '';
        
        // Check if it's a content URI
        if (url.startsWith('content://')) {
            try {
                // Convert content URI to server URL by uploading
                // For now, using a placeholder since actual upload requires client-side action
                const type = item.type === 'video' ? 'videos' : 'images';
                const filename = `placeholder_${item.id || Date.now()}.jpg`;
                const mediaUrl = `${baseUrl}/uploads/${type}/${filename}`;

                logger.info(`Content URI detected, would need actual file upload: ${url}`);
                logger.info(`Using placeholder URL: ${mediaUrl}`);
                
                processedItems.push({
                    ...item,
                    url: mediaUrl,
                    originalUrl: url,
                    status: 'placeholder' // Indicate this is a placeholder, real upload needed
                });
            } catch (error) {
                logger.error(`Error processing media item: ${error.message}`);
                // Include item with error flag but don't fail the whole operation
                processedItems.push({
                    ...item,
                    error: error.message,
                    status: 'error'
                });
            }
        } else if (url.startsWith('http://') || url.startsWith('https://')) {
            // Already a web URL, just pass through
            processedItems.push(item);
        } else if (url.startsWith('/uploads/')) {
            // Already a server path, just add base URL if needed
            const fullUrl = baseUrl ? `${baseUrl}${url}` : url;
            processedItems.push({
                ...item,
                url: fullUrl
            });
        } else {
            // Unknown format, keep as is but log warning
            logger.warn(`Unknown URL format: ${url}`);
            processedItems.push(item);
        }
    }

    return processedItems;
};

/**
 * Instructions for the client app to upload media files
 * 
 * 1. For each media item with content:// URI:
 *    - Read the file from the URI using ContentResolver
 *    - Create a multipart form and add the file
 *    - POST to /api/media/upload with the Authorization header
 *    - Get the returned URL and save it with your event
 * 
 * 2. Android code example:
 *    ```kotlin
 *    fun uploadMedia(context: Context, uri: Uri): String? {
 *        val file = getFileFromUri(context, uri)
 *        val requestBody = MultipartBody.Builder()
 *            .setType(MultipartBody.FORM)
 *            .addFormDataPart("file", file.name, file.asRequestBody())
 *            .build()
 *        
 *        val request = Request.Builder()
 *            .url("${API_BASE_URL}/api/media/upload")
 *            .header("Authorization", "Bearer $token")
 *            .post(requestBody)
 *            .build()
 *            
 *        // Execute request and parse response
 *        // Return the URL from the response
 *    }
 *    ```
 */

/**
 * Extracts file extension from URL or filename
 * @param {string} url - URL or filename
 * @returns {string} - File extension
 */
export const getFileExtension = (url) => {
    const filename = url.split('/').pop();
    const extension = filename.split('.').pop();
    return extension.toLowerCase();
};

export default {
    processMediaUrls,
    getFileExtension
}; 