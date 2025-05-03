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

    let tempFilePath = null;
    let shouldDeleteTempFile = false;

    try {
        const { fileType = 'image', originalname = 'file', mimetype = 'image/jpeg' } = options;
        
        logger.info(`Original file source: ${typeof file === 'string' ? 'filepath' : 'buffer'}`);
        
        // Verify source file exists and is readable
        if (typeof file === 'string') {
            tempFilePath = file;
            logger.info(`Using provided file path: ${tempFilePath}`);
            
            if (!fs.existsSync(tempFilePath)) {
                throw new Error(`Source file does not exist: ${tempFilePath}`);
            }
            
            // Check file size and readability
            const stats = fs.statSync(tempFilePath);
            logger.info(`Source file size: ${stats.size} bytes`);
            
            if (stats.size === 0) {
                throw new Error('Source file is empty');
            }

            // Try to read the file directly to verify it's readable
            try {
                const testData = fs.readFileSync(tempFilePath, { encoding: null, flag: 'r' });
                logger.info(`Successfully read ${testData.length} bytes directly from file`);
                
                if (testData.length === 0) {
                    throw new Error('File appears to be empty or corrupted');
                }
                
                // For small files (< 5MB), use the file content directly
                if (stats.size < 5 * 1024 * 1024) {
                    logger.info(`Small file detected (${stats.size} bytes), using direct content upload`);
                    
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
                    
                    // Create a file in the bucket
                    const bucketFile = bucket.file(uniqueFilename);
                    
                    // Upload the file content directly
                    await bucketFile.save(testData, {
                        metadata: {
                            contentType: mimetype,
                            metadata: {
                                firebaseStorageDownloadTokens: uuidv4(),
                            }
                        },
                        resumable: false
                    });
                    
                    logger.info(`Direct content upload successful for: ${uniqueFilename}`);
                    
                    // Try to make the file public
                    try {
                        await bucketFile.makePublic().catch(err => {
                            if (err.message.includes('uniform bucket-level access is enabled')) {
                                logger.info('Bucket has uniform access control - file inherits bucket permissions');
                            } else {
                                logger.warn(`Could not make file public: ${err.message}`);
                            }
                        });
                    } catch (err) {
                        logger.warn(`Error making file public: ${err.message}`);
                    }
                    
                    // Return the public URL
                    const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
                    logger.info(`File uploaded successfully via direct method: ${publicUrl}`);
                    return publicUrl;
                }
            } catch (e) {
                logger.error(`Error reading file: ${e.message}`);
                throw new Error(`File access error: ${e.message}`);
            }
        } else {
            // Handle buffer input
            if (!Buffer.isBuffer(file)) {
                logger.warn(`Input is not a buffer, attempting to convert`);
                if (typeof file === 'object') {
                    file = Buffer.from(file);
                } else {
                    throw new Error('Invalid file input: Not a buffer or string path');
                }
            }
            
            if (file.length === 0) {
                throw new Error('Input buffer is empty');
            }
            
            logger.info(`Buffer size: ${file.length} bytes`);
            
            // For buffer input, we can upload directly to Firebase
            // Determine file extension
            const fileExtension = path.extname(originalname) || 
                             (mimetype.includes('png') ? '.png' : 
                              mimetype.includes('jpeg') || mimetype.includes('jpg') ? '.jpg' :
                              mimetype.includes('gif') ? '.gif' :
                              mimetype.includes('mp4') ? '.mp4' :
                              mimetype.includes('mov') ? '.mov' : '.dat');
            
            // Generate a unique filename with the correct extension
            const uniqueFilename = `${fileType}s/${uuidv4()}${fileExtension}`;
            logger.info(`Uploading buffer to path: ${uniqueFilename}`);
            
            // Create a file in the bucket
            const bucketFile = bucket.file(uniqueFilename);
            
            // Upload the buffer directly
            await bucketFile.save(file, {
                metadata: {
                    contentType: mimetype,
                    metadata: {
                        firebaseStorageDownloadTokens: uuidv4(),
                    }
                },
                resumable: false
            });
            
            logger.info(`Direct buffer upload successful for: ${uniqueFilename}`);
            
            // Try to make the file public
            try {
                await bucketFile.makePublic().catch(err => {
                    if (err.message.includes('uniform bucket-level access is enabled')) {
                        logger.info('Bucket has uniform access control - file inherits bucket permissions');
                    } else {
                        logger.warn(`Could not make file public: ${err.message}`);
                    }
                });
            } catch (err) {
                logger.warn(`Error making file public: ${err.message}`);
            }
            
            // Return the public URL
            const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
            logger.info(`Buffer uploaded successfully via direct method: ${publicUrl}`);
            return publicUrl;
        }
        
        // For larger files, use streaming upload
        // Determine file extension
        const fileExtension = path.extname(originalname) || 
                         (mimetype.includes('png') ? '.png' : 
                          mimetype.includes('jpeg') || mimetype.includes('jpg') ? '.jpg' :
                          mimetype.includes('gif') ? '.gif' :
                          mimetype.includes('mp4') ? '.mp4' :
                          mimetype.includes('mov') ? '.mov' : '.dat');
        
        // Generate a unique filename with the correct extension
        const uniqueFilename = `${fileType}s/${uuidv4()}${fileExtension}`;
        
        logger.info(`Uploading large file via stream to path: ${uniqueFilename}`);
        
        // Create a file in the bucket
        const bucketFile = bucket.file(uniqueFilename);
        
        // Create a write stream to the bucket file
        const writeStream = bucketFile.createWriteStream({
            metadata: {
                contentType: mimetype,
                metadata: {
                    firebaseStorageDownloadTokens: uuidv4(),
                }
            },
            resumable: false
        });
        
        // Create a readable stream from the file
        const readStream = fs.createReadStream(tempFilePath);
        
        // Stream data and handle completion or errors
        await new Promise((resolve, reject) => {
            let bytesSent = 0;
            
            readStream.on('data', (chunk) => {
                bytesSent += chunk.length;
                if (bytesSent % (512 * 1024) === 0) { // Log every 512KB
                    logger.info(`Streamed ${bytesSent / 1024 / 1024} MB so far...`);
                }
            });
            
            readStream.on('error', (error) => {
                logger.error(`Read stream error: ${error.message}`);
                reject(error);
            });
            
            writeStream.on('error', (error) => {
                logger.error(`Write stream error: ${error.message}`);
                reject(error);
            });
            
            writeStream.on('finish', () => {
                logger.info(`Stream upload complete, total bytes: ${bytesSent}`);
                resolve();
            });
            
            // Pipe the read stream to the write stream
            readStream.pipe(writeStream);
        });
        
        logger.info(`File stream upload successful for: ${uniqueFilename}`);
        
        // Try to make the file public
        try {
            await bucketFile.makePublic().catch(err => {
                if (err.message.includes('uniform bucket-level access is enabled')) {
                    logger.info('Bucket has uniform access control - file inherits bucket permissions');
                } else {
                    logger.warn(`Could not make file public: ${err.message}`);
                }
            });
        } catch (err) {
            logger.warn(`Error making file public: ${err.message}`);
        }
        
        // Return the public URL
        const publicUrl = `https://storage.googleapis.com/${bucketName}/${uniqueFilename}`;
        logger.info(`File uploaded successfully via streaming: ${publicUrl}`);
        return publicUrl;
    } catch (error) {
        logger.error(`Error uploading file to Firebase Storage: ${error.message}`);
        throw error;
    } finally {
        // No temp file cleanup needed as we're using streams or direct upload
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