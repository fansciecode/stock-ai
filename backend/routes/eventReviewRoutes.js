import express from "express";
import { protect, isSeller } from "../middleware/authMiddleware.js";
import {
    createEventReview,
    getEventReviews,
    updateReview,
    deleteReview,
    respondToReview,
    markReviewHelpful,
    reportReview,
    moderateReview,
    getReviewAnalytics
} from "../controllers/eventReviewController.js";

const router = express.Router();

// Review routes
router.route('/:id/reviews')
    .post(protect, createEventReview)
    .get(getEventReviews);

router.route('/:id/reviews/:reviewId')
    .put(protect, updateReview)
    .delete(protect, deleteReview);

router.post('/:id/reviews/:reviewId/respond', protect, isSeller, respondToReview);
router.post('/:id/reviews/:reviewId/helpful', protect, markReviewHelpful);
router.post('/:id/reviews/:reviewId/report', protect, reportReview);
router.put('/:id/reviews/:reviewId/moderate', protect, isSeller, moderateReview);
router.get('/:id/reviews/analytics', protect, isSeller, getReviewAnalytics);

export default router;
