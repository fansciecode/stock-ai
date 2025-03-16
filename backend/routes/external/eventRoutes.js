import express from 'express';
import { protect } from '../../middleware/authMiddleware.js';
import {
    searchEvents,
    getEventDetails,
    searchOffers,
    addReview,
    getReviews,
    toggleReviewLike
} from '../../controllers/external/eventController.js';

const router = express.Router();

// Event routes
router.get('/events/search', searchEvents);
router.get('/events/:source/:id', getEventDetails);
router.get('/offers/search', searchOffers);

// Review routes
router.route('/events/:source/:id/reviews')
    .get(getReviews)
    .post(protect, addReview);

router.post('/reviews/:reviewId/toggle-like', protect, toggleReviewLike);

export default router; 