import express from 'express';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs';
import { protect } from '../middleware/authMiddleware.js';
import { uploadMedia, getMediaById, updateEventMedia } from '../controllers/mediaController.js';

const router = express.Router();

// Define storage for uploaded files
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const uploadDir = path.resolve(__dirname, '../../uploads');

// Create directories if they don't exist
const imageDir = path.join(uploadDir, 'images');
const videoDir = path.join(uploadDir, 'videos');

// Ensure directories exist
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}
if (!fs.existsSync(imageDir)) {
    fs.mkdirSync(imageDir, { recursive: true });
}
if (!fs.existsSync(videoDir)) {
    fs.mkdirSync(videoDir, { recursive: true });
}

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        // Determine destination based on file mimetype
        const isVideo = file.mimetype.startsWith('video');
        const dest = isVideo ? videoDir : imageDir;
        cb(null, dest);
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

// Routes
router.post('/upload', protect, upload.single('file'), uploadMedia);
router.get('/:id', getMediaById);
router.put('/event/:eventId', protect, updateEventMedia);

export default router; 