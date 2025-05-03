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
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(new Error('Only images and videos are allowed'), false);
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
router.post('/upload', protect, upload.single('file'), uploadMedia);

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