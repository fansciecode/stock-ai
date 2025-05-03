import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { MediaModel } from '../models/mediaModel.js';
import { EventModel } from '../models/eventModel.js';
import asyncHandler from 'express-async-handler';
import { uploadToFirebase, deleteFileFromFirebase } from '../utils/firebaseStorage.js';
import { v4 as uuidv4 } from 'uuid';

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

        logger.info(`File upload initiated: ${req.file.originalname}`);

        // Get additional parameters
        const { eventId, mediaId, caption, replaceContentUri, fileType: explicitFileType } = req.body;

        // Determine media type from mimetype
        const fileType = explicitFileType || (req.file.mimetype.startsWith('video') ? 'video' : 'image');

        // Upload file to Firebase Storage
        const firebaseUrl = await uploadToFirebase(req.file.path, {
            fileType,
            originalname: req.file.originalname,
            mimetype: req.file.mimetype
        });

        // Create media entry in database
        const media = await MediaModel.create({
            filename: path.basename(firebaseUrl),
            originalname: req.file.originalname,
            mimetype: req.file.mimetype,
            size: req.file.size,
            path: firebaseUrl,
            url: firebaseUrl, // Use the Firebase URL directly
            type: fileType,
            uploader: req.user._id,
            caption: caption || '',
            metadata: {
                eventId: eventId || null,
                mediaId: mediaId || null,
                replaceContentUri: replaceContentUri || null,
                firebaseStorage: true
            }
        });

        // Clean up the local temporary file
        try {
            fs.unlinkSync(req.file.path);
            logger.info(`Temporary file deleted: ${req.file.path}`);
        } catch (err) {
            logger.warn(`Failed to delete temporary file: ${err.message}`);
        }

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
                        event.media[mediaIndex].url = firebaseUrl;
                        
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
                            url: firebaseUrl,
                            type: fileType,
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
                url: firebaseUrl,
                type: fileType,
                filename: path.basename(firebaseUrl)
            },
            message: eventId ? 'File uploaded to Firebase Storage and event updated' : 'File uploaded to Firebase Storage successfully'
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

/**
 * @desc    Delete media file
 * @route   DELETE /api/media/:id
 * @access  Private
 */
export const deleteMedia = asyncHandler(async (req, res) => {
    try {
        const media = await MediaModel.findById(req.params.id);
        
        if (!media) {
            return res.status(404).json({
                success: false,
                message: 'Media not found',
                errorCode: 'NOT_FOUND'
            });
        }

        // Check if user has permission (is uploader or admin)
        if (media.uploader.toString() !== req.user._id.toString() && req.user.role !== 'admin') {
            return res.status(403).json({
                success: false,
                message: 'You do not have permission to delete this media',
                errorCode: 'PERMISSION_DENIED'
            });
        }

        // Delete from Firebase Storage if stored there
        if (media.metadata?.firebaseStorage || media.url.includes('storage.googleapis.com')) {
            try {
                await deleteFileFromFirebase(media.url);
                logger.info(`Firebase file deleted: ${media.url}`);
            } catch (error) {
                logger.error(`Error deleting file from Firebase: ${error.message}`);
                // Continue with database deletion even if file deletion fails
            }
        } else {
            // Try to delete from local filesystem
            try {
                const filePath = path.resolve(process.cwd(), '..', media.url.replace(/^\//, ''));
                if (fs.existsSync(filePath)) {
                    fs.unlinkSync(filePath);
                    logger.info(`Local file deleted: ${filePath}`);
                }
            } catch (error) {
                logger.error(`Error deleting local file: ${error.message}`);
                // Continue with database deletion even if file deletion fails
            }
        }

        // Delete from database
        await MediaModel.findByIdAndDelete(req.params.id);

        res.json({
            success: true,
            message: 'Media deleted successfully'
        });
    } catch (error) {
        logger.error(`Error deleting media: ${error}`);
        res.status(500).json({
            success: false,
            message: error.message || 'Error deleting media',
            errorCode: 'DELETE_ERROR'
        });
    }
}); 