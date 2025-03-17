import asyncHandler from "express-async-handler";
import { EventModel } from "../models/eventModel.js";
import Booking  from '../models/bookingModel.js';

// @desc    Create new review
// @route   POST /api/events/:id/reviews
// @access  Private
export const createEventReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;

    const event = await Event.findById(req.params.id);

    if (event) {
        const alreadyReviewed = event.reviews.find(
            (r) => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            res.status(400);
            throw new Error('Event already reviewed');
        }

        const review = {
            user: req.user._id,
            rating: Number(rating),
            comment,
        };

        event.reviews.push(review);
        event.numReviews = event.reviews.length;
        event.averageRating =
            event.reviews.reduce((acc, item) => item.rating + acc, 0) /
            event.reviews.length;

        await event.save();
        res.status(201).json({ message: 'Review added' });
    } else {
        res.status(404);
        throw new Error('Event not found');
    }
});

// @desc    Get event reviews
// @route   GET /api/events/:id/reviews
// @access  Public
export const getEventReviews = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id)
        .populate('reviews.user', 'name avatar');

    if (event) {
        res.json(event.reviews);
    } else {
        res.status(404);
        throw new Error('Event not found');
    }
});

// @desc    Respond to a review
// @route   POST /api/events/:id/reviews/:reviewId/respond
// @access  Private/Seller
export const respondToReview = asyncHandler(async (req, res) => {
    const { comment } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    review.response = {
        comment,
        respondedBy: req.user._id,
        respondedAt: new Date()
    };

    await event.save();
    res.json(review);
});

// Review moderation
export const moderateReview = asyncHandler(async (req, res) => {
    const { status, moderationNote } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Only admin or event organizer can moderate
    if (!req.user.isAdmin && event.organizer.toString() !== req.user.businessId) {
        res.status(403);
        throw new Error('Not authorized to moderate reviews');
    }

    review.status = status;
    review.moderationNote = moderationNote;
    review.moderatedBy = req.user._id;
    review.moderatedAt = new Date();

    await event.save();
    res.json(review);
});

// Review analytics
export const getReviewAnalytics = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    // Only organizer can view analytics
    if (event.organizer.toString() !== req.user.businessId) {
        res.status(403);
        throw new Error('Not authorized to view review analytics');
    }

    const analytics = {
        totalReviews: event.reviews.length,
        averageRating: event.averageRating,
        ratingDistribution: {
            5: event.reviews.filter(r => r.rating === 5).length,
            4: event.reviews.filter(r => r.rating === 4).length,
            3: event.reviews.filter(r => r.rating === 3).length,
            2: event.reviews.filter(r => r.rating === 2).length,
            1: event.reviews.filter(r => r.rating === 1).length
        },
        helpfulCount: event.reviews.reduce((acc, r) => acc + (r.helpful?.length || 0), 0),
        reportedCount: event.reviews.reduce((acc, r) => acc + (r.reported?.length || 0), 0),
        responseRate: event.reviews.filter(r => r.response).length / event.reviews.length
    };

    res.json(analytics);
});

// Add missing functions
export const updateReview = asyncHandler(async (req, res) => {
    const { rating, comment } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Check if user owns the review
    if (review.user.toString() !== req.user._id.toString()) {
        res.status(403);
        throw new Error('Not authorized to update this review');
    }

    review.rating = Number(rating) || review.rating;
    review.comment = comment || review.comment;
    review.updatedAt = Date.now();

    await event.save();
    res.json(review);
});

export const deleteReview = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Check if user owns the review or is admin
    if (review.user.toString() !== req.user._id.toString() && !req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized to delete this review');
    }

    event.reviews.pull(req.params.reviewId);
    await event.save();

    res.json({ message: 'Review removed' });
});

export const markReviewHelpful = asyncHandler(async (req, res) => {
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Check if user already marked as helpful
    const helpfulIndex = review.helpful?.findIndex(
        (userId) => userId.toString() === req.user._id.toString()
    );

    if (helpfulIndex > -1) {
        // Remove helpful mark
        review.helpful.splice(helpfulIndex, 1);
    } else {
        // Add helpful mark
        if (!review.helpful) review.helpful = [];
        review.helpful.push(req.user._id);
    }

    await event.save();
    res.json({ helpful: review.helpful.length });
});

export const reportReview = asyncHandler(async (req, res) => {
    const { reason } = req.body;
    const event = await Event.findById(req.params.id);

    if (!event) {
        res.status(404);
        throw new Error('Event not found');
    }

    const review = event.reviews.id(req.params.reviewId);

    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    // Add report
    if (!review.reported) review.reported = [];
    review.reported.push({
        user: req.user._id,
        reason,
        date: new Date()
    });

    await event.save();
    res.json({ message: 'Review reported' });
});
