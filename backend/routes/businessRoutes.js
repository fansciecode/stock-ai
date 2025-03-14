import express from 'express';
import multer from 'multer';
import path from 'path';
import { protect, isAdmin } from '../middleware/authMiddleware.js';
import {
    submitBusinessVerification,
    processBusinessVerification
} from '../controllers/verificationController.js';

const router = express.Router();

// Configure multer storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, 'uploads/business-documents/');
    },
    filename: function (req, file, cb) {
        cb(null, `${Date.now()}-${file.originalname}`);
    }
});

// Configure file filter
const fileFilter = (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/png', 'application/pdf'];
    if (allowedTypes.includes(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error('Invalid file type. Only JPEG, PNG and PDF files are allowed.'), false);
    }
};

// Initialize multer upload
const upload = multer({ 
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024 // 5MB limit
    }
});

// Configure business document upload
const businessUpload = upload.fields([
    { name: 'BUSINESS_REGISTRATION', maxCount: 1 },
    { name: 'TAX_CERTIFICATE', maxCount: 1 },
    { name: 'ID_PROOF', maxCount: 1 },
    { name: 'ADDRESS_PROOF', maxCount: 1 },
    { name: 'TRADE_LICENSE', maxCount: 1 }
]);

// Maintain existing routes
router.post('/verify', 
    protect, 
    businessUpload, 
    submitBusinessVerification
);

router.put('/verify/:verificationId', 
    protect, 
    isAdmin, 
    processBusinessVerification
);

export default router; 