import asyncHandler from 'express-async-handler';
import growthService from '../services/growthService.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('growthController');

// @desc    Get landing page content
// @route   GET /api/growth/landing
// @access  Public
export const getLandingContent = asyncHandler(async (req, res) => {
    const { latitude, longitude, city } = req.query;
    const content = await growthService.generateLandingPageContent({ latitude, longitude, city });
    res.json({ success: true, data: content });
});

// @desc    Track anonymous user activity
// @route   POST /api/growth/track
// @access  Public
export const trackActivity = asyncHandler(async (req, res) => {
    const { sessionId, activity } = req.body;
    const result = await growthService.trackUserActivity(sessionId, activity);
    res.json({ success: true, data: result });
});

// @desc    Generate share content
// @route   GET /api/growth/share/:eventId
// @access  Public
export const getShareContent = asyncHandler(async (req, res) => {
    const { eventId } = req.params;
    const event = await growthService.getEventDetails(eventId);
    const shareContent = growthService.generateShareContent(event);
    res.json({ success: true, data: shareContent });
});

// @desc    Track share activity
// @route   POST /api/growth/share/track
// @access  Public
export const trackShare = asyncHandler(async (req, res) => {
    const shareData = req.body;
    const metrics = await growthService.trackShareActivity(shareData);
    res.json({ success: true, data: metrics });
});

// @desc    Get SEO metadata
// @route   GET /api/growth/seo/:pageType
// @access  Public
export const getSEOMetadata = asyncHandler(async (req, res) => {
    const { pageType } = req.params;
    const { category, eventId } = req.query;
    
    let data = {};
    if (pageType === 'event' && eventId) {
        data = await growthService.getEventDetails(eventId);
    } else if (pageType === 'category' && category) {
        data = { category, location: req.query.location };
    }

    const metadata = await growthService.generateSEOMetadata(pageType, data);
    res.json({ success: true, data: metadata });
}); 