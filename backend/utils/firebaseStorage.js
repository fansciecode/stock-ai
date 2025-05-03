import admin from '../config/firebaseConfig.js';
import { createLogger } from './logger.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';

const logger = createLogger('firebaseStorage');
const bucketName = 'ibcmserver_init';

// Initialize Firebase Storage
let bucket = null;
try {
    if (admin.apps.length) {
        bucket = admin.storage().bucket(bucketName);
        logger.info('Firebase Storage initialized successfully');
    } else {
        logger.warn('Firebase Admin not initialized, Storage features may not work');
    }
} catch (error) {
    logger.error(`Firebase Storage initialization error: ${error.message}`);
}

/**
 * Upload a file to Firebase Storage
 * @param {Buffer|string} file - File buffer or file path
 * @param {Object} options - Upload options
 * @param {string} options.fileType - Type of file ('image' or 'video')
 * @param {string} options.originalname - Original file name
 * @param {string} options.mimetype - MIME type of the file
 * @returns {Promise<string>} - Public URL of the uploaded file
 */
export const uploadToFirebase = async (file, options = {}) => {
    if (!bucket) {
        throw new Error('Firebase Storage not initialized');
    }

    try {
        const { fileType = 'image', originalname = 'file', mimetype = 'image/jpeg' } = options;
        const tempFilePath = typeof file === 'string' ? file : path.join(os.tmpdir(), `${uuidv4()}-${originalname}`);
        
        // If file is a buffer, write it to a temp file
        if (typeof file !== 'string') {
            await fs.promises.writeFile(tempFilePath, file);
        }

        // Determine file extension
        const fileExtension = path.extname(originalname) || 
                             (mimetype.includes('png') ? '.png' : 
                              mimetype.includes('jpeg') || mimetype.includes('jpg') ? '.jpg' :
                              mimetype.includes('gif') ? '.gif' :
                              mimetype.includes('mp4') ? '.mp4' :
                              mimetype.includes('mov') ? '.mov' : '.dat');

        // Generate a unique filename with the correct extension
        const uniqueFilename = `${fileType}s/${uuidv4()}${fileExtension}`;
        
        logger.info(`Uploading file to path: ${uniqueFilename}`);

        // Upload to Firebase Storage
        const uploadOptions = {
            destination: uniqueFilename,
            metadata: {
                contentType: mimetype,
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                }
            }
        };

        const [uploadedFile] = await bucket.upload(tempFilePath, uploadOptions);
        
        // If we created a temp file, clean it up
        if (typeof file !== 'string') {
            await fs.promises.unlink(tempFilePath);
        }

        // Get the public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
        logger.info(`File uploaded successfully: ${publicUrl}`);
        
        return publicUrl;
    } catch (error) {
        logger.error(`Error uploading file to Firebase Storage: ${error.message}`);
        throw error;
    }
};

/**
 * Get file from Firebase Storage
 * @param {string} fileUrl - URL of the file
 * @returns {Promise<Buffer>} - File buffer
 */
export const getFileFromFirebase = async (fileUrl) => {
    if (!bucket) {
        throw new Error('Firebase Storage not initialized');
    }

    try {
        // Extract file path from URL
        const urlPath = new URL(fileUrl).pathname;
        const filePath = urlPath.split(`/${bucketName}/`)[1];
        
        if (!filePath) {
            throw new Error('Invalid file URL');
        }

        // Download file to memory
        const [fileContents] = await bucket.file(filePath).download();
        return fileContents;
    } catch (error) {
        logger.error(`Error getting file from Firebase Storage: ${error.message}`);
        throw error;
    }
};

/**
 * Delete file from Firebase Storage
 * @param {string} fileUrl - URL of the file to delete
 * @returns {Promise<boolean>} - Success status
 */
export const deleteFileFromFirebase = async (fileUrl) => {
    if (!bucket) {
        throw new Error('Firebase Storage not initialized');
    }

    try {
        // Extract file path from URL
        const urlPath = new URL(fileUrl).pathname;
        const filePath = urlPath.split(`/${bucketName}/`)[1];
        
        if (!filePath) {
            throw new Error('Invalid file URL');
        }

        // Delete the file
        await bucket.file(filePath).delete();
        logger.info(`File deleted successfully: ${fileUrl}`);
        return true;
    } catch (error) {
        logger.error(`Error deleting file from Firebase Storage: ${error.message}`);
        throw error;
    }
}; 