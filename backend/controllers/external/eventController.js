import asyncHandler from 'express-async-handler';
import ExternalEventService from '../../services/external/eventService.js';
import { ExternalReview } from '../../models/external/reviewModel.js';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('externalEventController');

// @desc    Search for nearby events
// @route   GET /api/external/events/search
// @access  Public
export const searchEvents = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius, type, keyword } = req.query;

    if (!latitude || !longitude) {
        res.status(400);
        throw new Error('Latitude and longitude are required');
    }

    const events = await ExternalEventService.searchNearbyEvents({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        type,
        keyword
    });

    res.json({
        success: true,
        count: events.length,
        data: events
    });
});

// @desc    Get event details
// @route   GET /api/external/events/:source/:id
// @access  Public
export const getEventDetails = asyncHandler(async (req, res) => {
    const { source, id } = req.params;

    const [eventDetails, reviewStats] = await Promise.all([
        ExternalEventService.getEventDetails(id),
        ExternalReview.getAverageRating(id, source)
    ]);

    res.json({
        success: true,
        data: {
            ...eventDetails,
            internalRating: reviewStats.averageRating,
            totalInternalReviews: reviewStats.totalReviews
        }
    });
});

// @desc    Search for offers (both local and online)
// @route   GET /api/external/offers/search
// @access  Public
export const searchOffers = asyncHandler(async (req, res) => {
    const { latitude, longitude, radius, category } = req.query;

    if (!latitude || !longitude) {
        res.status(400);
        throw new Error('Latitude and longitude are required');
    }

    const offers = await ExternalEventService.searchOffers({
        latitude: parseFloat(latitude),
        longitude: parseFloat(longitude),
        radius: parseInt(radius),
        category
    });

    res.json({
        success: true,
        data: offers
    });
});

// @desc    Add a review for an external event
// @route   POST /api/external/events/:source/:id/reviews
// @access  Private
export const addReview = asyncHandler(async (req, res) => {
    const { source, id } = req.params;
    const { rating, comment, photos } = req.body;

    // Validate rating
    if (!rating || rating < 1 || rating > 5) {
        res.status(400);
        throw new Error('Rating must be between 1 and 5');
    }

    // Check if user has already reviewed this event
    const existingReview = await ExternalReview.findOne({
        externalId: id,
        source,
        user: req.user._id
    });

    if (existingReview) {
        res.status(400);
        throw new Error('You have already reviewed this event');
    }

    const review = await ExternalReview.create({
        externalId: id,
        source,
        user: req.user._id,
        rating,
        comment,
        photos: photos || []
    });

    await review.populate('user', 'name avatar');

    res.status(201).json({
        success: true,
        data: review
    });
});

// @desc    Get reviews for an external event
// @route   GET /api/external/events/:source/:id/reviews
// @access  Public
export const getReviews = asyncHandler(async (req, res) => {
    const { source, id } = req.params;
    const page = parseInt(req.query.page) || 1;
    const limit = parseInt(req.query.limit) || 10;

    const reviews = await ExternalReview.find({ externalId: id, source })
        .populate('user', 'name avatar')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

    const total = await ExternalReview.countDocuments({ externalId: id, source });

    res.json({
        success: true,
        data: reviews,
        pagination: {
            page,
            limit,
            total,
            pages: Math.ceil(total / limit)
        }
    });
});

// @desc    Toggle like on a review
// @route   POST /api/external/reviews/:reviewId/toggle-like
// @access  Private
export const toggleReviewLike = asyncHandler(async (req, res) => {
    const review = await ExternalReview.findById(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    const isLiked = await review.toggleLike(req.user._id);

    res.json({
        success: true,
        data: {
            isLiked,
            likesCount: review.likes.length
        }
    });
}); 