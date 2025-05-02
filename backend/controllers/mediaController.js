import mongoose from 'mongoose';
import fs from 'fs';
import path from 'path';
import { createLogger } from '../utils/logger.js';
import { MediaModel } from '../models/mediaModel.js';
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
            uploader: req.user._id
        });

        res.status(201).json({
            success: true,
            data: {
                id: media._id,
                url: urlPath,
                type: type,
                filename: req.file.filename
            }
        });
    } catch (error) {
        logger.error('Media upload error:', error);
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
        logger.error('Error retrieving media:', error);
        res.status(500).json({
            success: false,
            message: error.message || 'Error retrieving media',
            errorCode: 'RETRIEVAL_ERROR'
        });
    }
}); 