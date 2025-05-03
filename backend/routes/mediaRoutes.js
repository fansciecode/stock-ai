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
    console.log('Received file:', file.originalname, 'Mimetype:', file.mimetype);
    
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
        fileSize: 100 * 1024 * 1024 // 100MB limit
    }
});

// Custom error handler for multer errors
const handleMulterError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // A Multer error occurred when uploading
        console.error('Multer error:', err);
        return res.status(400).json({
            success: false,
            message: `File upload error: ${err.message}`,
            errorCode: 'UPLOAD_ERROR'
        });
    } else if (err) {
        // An unknown error occurred
        console.error('Upload error:', err);
        return res.status(500).json({
            success: false,
            message: err.message || 'An unknown error occurred during file upload',
            errorCode: 'UPLOAD_ERROR'
        });
    }
    
    // No error occurred, continue
    next();
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
router.post('/upload', protect, (req, res, next) => {
    upload.single('file')(req, res, (err) => {
        if (err) {
            console.error('File upload error:', err.message);
            return res.status(500).json({
                success: false,
                message: err.message || 'Error uploading file',
                errorCode: 'UPLOAD_ERROR'
            });
        }
        // No file attached
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: 'No file uploaded or file was rejected',
                errorCode: 'NO_FILE'
            });
        }
        next();
    });
}, uploadMedia);

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