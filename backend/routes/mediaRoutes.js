import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMedia, getMediaById, updateEventMedia, deleteMedia } from '../controllers/mediaController.js';

const router = express.Router();

// Define storage for uploaded files (temporary storage before Firebase upload)
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');
const tempDir = path.join(uploadDir, 'temp');

// Create directories if they don't exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(tempDir)) {
    fs.mkdirSync(tempDir, { recursive: true });
}

// Configure multer storage for temporary files
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // All files go to temp directory first, then to Firebase
        cb(null, tempDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename with original extension
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, file.fieldname + '-' + uniqueSuffix + ext);
    }
});

// File filter to accept only images and videos
const fileFilter = (req, file, cb) => {
    console.log('Received file:', file.originalname, 'Mimetype:', file.mimetype, 'Size:', file.size);
    
    // Log request headers for debugging
    console.log('Request headers:', JSON.stringify(req.headers));
    
    // Check if fileType is explicitly specified in request body
    const explicitFileType = req.body.fileType;
    console.log('Explicit fileType from request:', explicitFileType);
    
    // Accept the file if:
    // 1. The mimetype starts with image/ or video/
    // 2. OR if fileType is explicitly set to 'image' or 'video' in the request
    // 3. OR the originalname ends with common image/video extensions
    if (
        file.mimetype.startsWith('image/') || 
        file.mimetype.startsWith('video/') ||
        explicitFileType === 'image' || 
        explicitFileType === 'video' ||
        /\.(jpg|jpeg|png|gif|bmp|webp|mp4|mov|avi|webm|mkv)$/i.test(file.originalname)
    ) {
        console.log('File accepted:', file.originalname);
        cb(null, true);
    } else {
        console.log('File rejected:', file.originalname, 'Mimetype:', file.mimetype);
        cb(new Error(`Only images and videos are allowed. Received: ${file.mimetype}`), false);
    }
};

// Set up multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 100 * 1024 * 1024, // 100MB limit
        files: 1 // Allow only one file
    },
    preservePath: true
});

// Custom middleware for debugging file upload issues
const logUpload = (req, res, next) => {
    console.log('Upload middleware called with body:', req.body);
    
    // Check for content type to ensure we're getting a multipart form
    console.log('Content-Type:', req.headers['content-type']);
    if (!req.headers['content-type'] || !req.headers['content-type'].includes('multipart/form-data')) {
        console.error('Invalid Content-Type, expected multipart/form-data but got:', req.headers['content-type']);
    }
    
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err.message, err.stack);
            return res.status(500).json({
                success: false,
                message: err.message || 'Error uploading file',
                errorCode: 'UPLOAD_ERROR'
            });
        }
        
        // No file attached
        if (!req.file) {
            console.error('No file in request or file was rejected');
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or file was rejected',
                errorCode: 'NO_FILE'
            });
        }
        
        console.log('File successfully received:', {
            filename: req.file.filename,
            originalname: req.file.originalname,
            path: req.file.path,
            size: req.file.size,
            mimetype: req.file.mimetype
        });
        
        // Check if file exists and is readable
        if (!fs.existsSync(req.file.path)) {
            console.error('File was uploaded but does not exist on disk:', req.file.path);
            return res.status(500).json({
                success: false,
                message: 'File upload issue: File was processed but not found on disk',
                errorCode: 'FILE_NOT_FOUND'
            });
        }
        
        // Check file size to ensure it's not empty
        const stats = fs.statSync(req.file.path);
        console.log('Uploaded file size:', stats.size, 'bytes');
        
        if (stats.size === 0) {
            console.error('Uploaded file is empty:', req.file.path);
            return res.status(400).json({
                success: false,
                message: 'Uploaded file is empty',
                errorCode: 'EMPTY_FILE'
            });
        }
        
        // Add extra check to verify file data integrity
        try {
            // Read first few bytes to verify file is properly written
            const fd = fs.openSync(req.file.path, 'r');
            const buffer = Buffer.alloc(1024);
            const bytesRead = fs.readSync(fd, buffer, 0, 1024, 0);
            fs.closeSync(fd);
            
            console.log(`Verified file integrity: Read ${bytesRead} bytes successfully`);
            
            if (bytesRead === 0) {
                console.error('File exists but cannot be read properly');
                return res.status(400).json({
                    success: false,
                    message: 'File exists but cannot be read properly',
                    errorCode: 'FILE_READ_ERROR'
                });
            }
        } catch (readError) {
            console.error('Error verifying file integrity:', readError);
            return res.status(400).json({
                success: false,
                message: `Error verifying file integrity: ${readError.message}`,
                errorCode: 'FILE_READ_ERROR'
            });
        }
        
        next();
    });
};

/**
 * @swagger
 * /api/media/upload:
 *   post:
 *     summary: Upload a media file to Firebase Storage
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               file:
 *                 type: string
 *                 format: binary
 *               eventId:
 *                 type: string
 *               mediaId:
 *                 type: string
 *               caption:
 *                 type: string
 *               fileType:
 *                 type: string
 *                 enum: [image, video]
 *     responses:
 *       201:
 *         description: File uploaded successfully
 *       400:
 *         description: Invalid input
 *       401:
 *         description: Unauthorized
 */
router.post('/upload', protect, logUpload, uploadMedia);

/**
 * @swagger
 * /api/media/{id}:
 *   get:
 *     summary: Get media by ID
 *     tags: [Media]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media details
 *       404:
 *         description: Media not found
 */
router.get('/:id', getMediaById);

/**
 * @swagger
 * /api/media/event/{eventId}:
 *   put:
 *     summary: Update event media
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: eventId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               mediaItems:
 *                 type: array
 *     responses:
 *       200:
 *         description: Event media updated
 *       401:
 *         description: Unauthorized
 */
router.put('/event/:eventId', protect, updateEventMedia);

/**
 * @swagger
 * /api/media/{id}:
 *   delete:
 *     summary: Delete media by ID
 *     tags: [Media]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Media deleted successfully
 *       401:
 *         description: Unauthorized
 *       403:
 *         description: Forbidden - no permission
 *       404:
 *         description: Media not found
 */
router.delete('/:id', protect, deleteMedia);

export default router; 