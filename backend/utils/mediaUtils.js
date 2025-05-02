import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import axios from 'axios';
import { createLogger } from './logger.js';

const logger = createLogger('mediaUtils');

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Create upload directories if they don't exist
const uploadDir = path.resolve(__dirname, '../../uploads');
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');

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
} catch (error) {
    logger.error('Error creating upload directories:', error);
}

/**
 * Process media URLs from Android content URIs
 * @param {Array} mediaItems - Array of media items with content URIs
 * @returns {Promise<Array>} - Array of processed media items with updated URLs
 */
export const processMediaUrls = async (mediaItems) => {
    if (!mediaItems || !Array.isArray(mediaItems)) {
        return [];
    }

    // For now, just convert content URIs to placeholder image URLs
    // In a real implementation, you would handle the actual file upload
    return mediaItems.map(item => {
        const url = item.url || '';
        
        // Check if it's a content URI
        if (url.startsWith('content://')) {
            // For a real implementation, you would upload the file and get a proper URL
            // For now, return a placeholder URL
            const type = item.type === 'video' ? 'videos' : 'images';
            const placeholder = `/uploads/${type}/placeholder_${item.id || Date.now()}.jpg`;
            
            logger.info(`Converted content URI to placeholder: ${placeholder}`);
            
            return {
                ...item,
                url: placeholder,
                originalUrl: url // Keep the original URL for reference
            };
        }
        
        return item;
    });
};

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