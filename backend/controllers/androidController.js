import { createLogger } from '../utils/logger.js';
import asyncHandler from 'express-async-handler';
import { EventModel } from '../models/eventModel.js';
import { MediaModel } from '../models/mediaModel.js';
import mongoose from 'mongoose';

const logger = createLogger('androidController');

/**
 * @desc    Handle content URIs in event media
 * @route   POST /api/android/handle-content-uris
 * @access  Private
 */
export const handleContentUris = asyncHandler(async (req, res) => {
    try {
        const { contentUris, eventId } = req.body;
        
        if (!contentUris || !Array.isArray(contentUris) || contentUris.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Content URIs are required',
                errorCode: 'INVALID_INPUT'
            });
        }
        
        // Process the content URIs
        const processedItems = contentUris.map(uri => {
            const isVideo = uri.toLowerCase().includes('video');
            const mediaType = isVideo ? 'video' : 'image';
            const mediaId = new mongoose.Types.ObjectId().toString();
            
            return {
                id: mediaId,
                uri: uri,
                type: mediaType,
                placeholder: `/uploads/${mediaType}s/placeholder_${mediaId}.jpg`,
                uploadUrl: `/api/media/upload`
            };
        });
        
        // If eventId is provided, add placeholders to the event
        if (eventId) {
            const event = await EventModel.findById(eventId);
            
            if (event) {
                // Add placeholder media items to the event
                const placeholderMedia = processedItems.map(item => ({
                    id: item.id,
                    caption: 'Pending upload',
                    type: item.type,
                    url: item.placeholder,
                }));
                
                // Append placeholders to existing media
                event.media = [...(event.media || []), ...placeholderMedia];
                await event.save();
                
                logger.info(`Added ${placeholderMedia.length} media placeholders to event ${eventId}`);
            }
        }
        
        res.json({
            success: true,
            data: {
                processedItems,
                uploadInstructions: "For each item, upload the content URI file using multipart form to the uploadUrl, including the item.id as mediaId and eventId as eventId in the form data."
            }
        });
    } catch (error) {
        logger.error(`Error handling content URIs: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Error processing content URIs',
            errorCode: 'PROCESSING_ERROR'
        });
    }
});

/**
 * @desc    Check app version compatibility
 * @route   GET /api/android/version-check
 * @access  Public
 */
export const checkVersion = asyncHandler(async (req, res) => {
    const { version } = req.query;
    
    // Define minimum required versions
    const minVersion = '1.0.0';
    const latestVersion = '2.0.0';
    const requiresUpdate = version && compareVersions(version, minVersion) < 0;
    const hasUpdate = version && compareVersions(version, latestVersion) < 0;
    
    res.json({
        success: true,
        data: {
            compatible: !requiresUpdate,
            requiresUpdate,
            hasUpdate,
            minVersion,
            latestVersion,
            features: {
                mediaUpload: version && compareVersions(version, '1.5.0') >= 0,
                contentUriHandling: version && compareVersions(version, '1.8.0') >= 0
            }
        }
    });
});

/**
 * Helper function to compare versions
 */
function compareVersions(a, b) {
    const aParts = a.split('.').map(Number);
    const bParts = b.split('.').map(Number);
    
    for (let i = 0; i < Math.max(aParts.length, bParts.length); i++) {
        const aVal = aParts[i] || 0;
        const bVal = bParts[i] || 0;
        
        if (aVal > bVal) return 1;
        if (aVal < bVal) return -1;
    }
    
    return 0;
} 