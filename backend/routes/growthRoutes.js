import express from 'express';
import { rateLimiter } from '../middleware/rateLimiter.js';
import growthService from '../services/growthService.js';
import { asyncHandler } from '../middleware/asyncHandler.js';

const router = express.Router();

// Landing page content
router.get(
    '/landing-content',
    rateLimiter,
    asyncHandler(async (req, res) => {
        const { latitude, longitude, city } = req.query;
        const content = await growthService.generateLandingPageContent({
            latitude,
            longitude,
            city
        });
        res.json({ success: true, data: content });
    })
);

// Track anonymous activity
router.post(
    '/track-activity',
    rateLimiter,
    asyncHandler(async (req, res) => {
        const { sessionId, activity } = req.body;
        const result = await growthService.trackUserActivity(sessionId, activity);
        res.json({ success: true, data: result });
    })
);

// Generate share content
router.get(
    '/share-content/:eventId',
    rateLimiter,
    asyncHandler(async (req, res) => {
        const { eventId } = req.params;
        const content = growthService.generateShareContent(eventId);
        res.json({ success: true, data: content });
    })
);

// Track share activity
router.post(
    '/track-share',
    rateLimiter,
    asyncHandler(async (req, res) => {
        const shareData = req.body;
        const result = await growthService.trackShareActivity(shareData);
        res.json({ success: true, data: result });
    })
);

// Get SEO metadata
router.get(
    '/seo-metadata',
    rateLimiter,
    asyncHandler(async (req, res) => {
        const { page, data } = req.query;
        const metadata = await growthService.generateSEOMetadata(page, data);
        res.json({ success: true, data: metadata });
    })
);

export default router; 