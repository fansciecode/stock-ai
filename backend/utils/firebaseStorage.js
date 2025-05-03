import admin from '../config/firebaseConfig.js';
import { createLogger } from './logger.js';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';
import os from 'os';

const logger = createLogger('firebaseStorage');
const bucketName = process.env.FIREBASE_STORAGE_BUCKET || 'ibcmserver_init';

// Initialize Firebase Storage
let bucket = null;
try {
    if (admin.apps.length) {
        bucket = admin.storage().bucket(bucketName);
        logger.info(`Firebase Storage initialized successfully with bucket: ${bucketName}`);
        
        // Test bucket access
        bucket.getMetadata()
            .then(() => {
                logger.info('Firebase Storage bucket access confirmed');
            })
            .catch((error) => {
                logger.error(`Firebase Storage bucket access error: ${error.message}`);
                if (error.message.includes('Permission')) {
                    logger.error(`Firebase Storage permission error. Please ensure the service account has Storage Admin role for bucket ${bucketName}.`);
                    logger.error('You may need to run: gsutil iam ch serviceAccount:firebase-adminsdk-fbsvc@ibcm-28799.iam.gserviceaccount.com:objectCreator gs://ibcmserver_init');
                }
            });
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
        
        logger.info(`Original file path: ${file}`);
        logger.info(`Using temp file path: ${tempFilePath}`);
        logger.info(`File type: ${fileType}, MIME type: ${mimetype}`);
        
        // Validate source file exists if it's a path
        if (typeof file === 'string') {
            if (!fs.existsSync(file)) {
                throw new Error(`Source file does not exist: ${file}`);
            }
            
            // Check file size to ensure it's not empty
            const stats = fs.statSync(file);
            logger.info(`Source file size: ${stats.size} bytes`);
            
            if (stats.size === 0) {
                throw new Error('Source file is empty');
            }
            
            // For string paths, we need to make sure the file is actually readable
            await fs.promises.access(file, fs.constants.R_OK);
        } else {
            // If file is a buffer, write it to a temp file
            await fs.promises.writeFile(tempFilePath, file);
            
            // Verify the temp file was written correctly
            const stats = fs.statSync(tempFilePath);
            logger.info(`Temp file created with size: ${stats.size} bytes`);
            
            if (stats.size === 0) {
                throw new Error('Failed to write data to temp file');
            }
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
            },
            resumable: true,
            validation: 'crc32c'
        };
        
        // Log the file that will be uploaded
        logger.info(`Attempting to upload file ${tempFilePath} (exists: ${fs.existsSync(tempFilePath)}) to ${uniqueFilename}`);
        
        const [uploadedFile] = await bucket.upload(tempFilePath, uploadOptions);
        
        // Validate the upload was successful by checking the file exists in bucket
        const [exists] = await bucket.file(uniqueFilename).exists();
        if (!exists) {
            throw new Error('Upload appeared successful but file does not exist in bucket');
        }
        
        // Clean up the temp file if we created one
        if (typeof file !== 'string') {
            try {
                await fs.promises.unlink(tempFilePath);
                logger.info(`Temp file deleted: ${tempFilePath}`);
            } catch (cleanupError) {
                logger.warn(`Failed to clean up temp file: ${cleanupError.message}`);
                // Continue despite cleanup error
            }
        }
        
        // Get the public URL - for uniform bucket-level access, we don't need to make individual files public
        // The bucket itself should be configured for public access
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
        logger.info(`File uploaded successfully: ${publicUrl}`);
        
        // Check if we need to verify public access
        try {
            // Try to make the file public - this will fail on uniform bucket-level access but we'll catch it
            await bucket.file(uniqueFilename).makePublic().catch(err => {
                if (err.message.includes('uniform bucket-level access is enabled')) {
                    logger.info('Bucket has uniform access control - file inherits bucket permissions');
                } else {
                    // Log other types of errors but continue
                    logger.warn(`Note: Could not explicitly make file public: ${err.message}`);
                }
            });
        } catch (aclError) {
            // Just log the error but don't fail - if bucket has public access the file will be available
            logger.warn(`Note: Error configuring file permissions: ${aclError.message}`);
        }
        
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