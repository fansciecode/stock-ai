import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { MediaModel } from '../models/mediaModel.js';
import { EventModel } from '../models/eventModel.js';
import asyncHandler from 'express-async-handler';

const logger = createLogger('mediaController');

/**
 * @desc    Upload media file
 * @route   POST /api/media/upload
 * @access  Private
 */
export const uploadMedia = asyncHandler(async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded',
                errorCode: 'NO_FILE'
            });
        }

        logger.info(`File uploaded: ${req.file.originalname}, saved as ${req.file.filename}`);

        // Get additional parameters
        const { eventId, mediaId, caption, replaceContentUri } = req.body;

        // Determine media type from mimetype
        const type = req.file.mimetype.startsWith('video') ? 'video' : 'image';

        // Create relative URL path
        const urlPath = `/uploads/${type}s/${req.file.filename}`;
        
        // Create media entry in database
        const media = await MediaModel.create({
            filename: req.file.filename,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: req.file.path,
            url: urlPath,
            type: type,
            uploader: req.user._id,
            caption: caption || '',
            metadata: {
                eventId: eventId || null,
                mediaId: mediaId || null,
                replaceContentUri: replaceContentUri || null
            }
        });

        // If eventId and mediaId are provided, update the event's media
        if (eventId && mediaId) {
            try {
                // Find the event and update the media with matching ID
                const event = await EventModel.findById(eventId);
                
                if (event) {
                    // Find the index of the media item to update
                    const mediaIndex = event.media.findIndex(m => m.id === mediaId);
                    
                    if (mediaIndex !== -1) {
                        // Update the media URL
                        event.media[mediaIndex].url = urlPath;
                        
                        // If caption was provided, update it too
                        if (caption) {
                            event.media[mediaIndex].caption = caption;
                        }
                        
                        await event.save();
                        logger.info(`Updated media for event ${eventId}, media ID ${mediaId}`);
                    } else {
                        // If the mediaId doesn't exist, add it as a new media item
                        event.media.push({
                            id: mediaId,
                            url: urlPath,
                            type: type,
                            caption: caption || ''
                        });
                        
                        await event.save();
                        logger.info(`Added new media to event ${eventId} with ID ${mediaId}`);
                    }
                }
            } catch (error) {
                logger.error(`Error updating event media: ${error.message}`);
                // We still want to return the uploaded file info, so just log the error
            }
        }

        // Return the media information
        res.status(201).json({
            success: true,
            data: {
                id: media._id,
                url: urlPath,
                type: type,
                filename: req.file.filename
            },
            message: eventId ? 'File uploaded and event updated' : 'File uploaded successfully'
        });
    } catch (error) {
        logger.error(`Media upload error: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Error uploading file',
            errorCode: 'UPLOAD_ERROR'
        });
    }
});

/**
 * @desc    Get media by ID
 * @route   GET /api/media/:id
 * @access  Public
 */
export const getMediaById = asyncHandler(async (req, res) => {
    try {
        const media = await MediaModel.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found',
                errorCode: 'NOT_FOUND'
            });
        }

        res.json({
            success: true,
            data: {
                id: media._id,
                url: media.url,
                type: media.type,
                filename: media.filename,
                originalname: media.originalname,
                mimetype: media.mimetype,
                size: media.size,
                createdAt: media.createdAt
            }
        });
    } catch (error) {
        logger.error(`Error retrieving media: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Error retrieving media',
            errorCode: 'RETRIEVAL_ERROR'
        });
    }
});

/**
 * @desc    Update event media
 * @route   PUT /api/media/event/:eventId
 * @access  Private
 */
export const updateEventMedia = asyncHandler(async (req, res) => {
    try {
        const { eventId } = req.params;
        const { mediaItems } = req.body;
        
        if (!mediaItems || !Array.isArray(mediaItems)) {
            return res.status(400).json({
                success: false,
                message: 'Media items are required and must be an array',
                errorCode: 'INVALID_INPUT'
            });
        }
        
        // Find the event
        const event = await EventModel.findById(eventId);
        
        if (!event) {
            return res.status(404).json({
                success: false,
                message: 'Event not found',
                errorCode: 'NOT_FOUND'
            });
        }
        
        // Check if user has permission to update this event
        if (event.organizer.toString() !== req.user._id.toString()) {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to update this event',
                errorCode: 'PERMISSION_DENIED'
            });
        }
        
        // Update the event media
        event.media = mediaItems.map(item => ({
            id: item.id,
            caption: item.caption || '',
            type: item.type || 'image',
            url: item.url
        }));
        
        await event.save();
        
        res.json({
            success: true,
            data: event.media,
            message: 'Event media updated successfully'
        });
    } catch (error) {
        logger.error(`Error updating event media: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Error updating event media',
            errorCode: 'UPDATE_ERROR'
        });
    }
}); 