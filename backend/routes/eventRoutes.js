import express from "express";
import { createEvent, getEvents, 
        getEvent, updateEvent, deleteEvent ,
        addEventReview,getEventsByCategory,
        upgradeEvent,upgradeEventPayment, confirmUpgradePayment,
        uploadEventMedia, addEventProducts,
        createOptimizedEvent,
        getEventOptimizations,
        optimizeExistingEvent,
        autoGenerateEvent
    } from "../controllers/eventController.js";
import { protect, isSeller, isAdmin } from "../middleware/authMiddleware.js";
import { checkEventLimit } from "../middleware/eventLimitMiddleware.js";
import { createEventReview, getEventReviews, updateReview, deleteReview, respondToReview, markReviewHelpful, reportReview, moderateReview, getReviewAnalytics } from "../controllers/eventReviewController.js";
import { aiMiddleware } from '../middleware/aiMiddleware.js';
import { searchHandler } from "../controllers/searchController.js";

const router = express.Router();

router.route("/").post(protect, checkEventLimit,createEvent).get(getEvents);
router.route("/:id").get(getEvent).put(protect, updateEvent).delete(protect, deleteEvent);
router.post("/:id/reviews", protect, addEventReview);
router.get("/category/:categoryId", getEventsByCategory);
router.post("/upgrade", protect, upgradeEvent);
router.post("/upgrade/:eventId", protect, upgradeEventPayment);
router.post("/upgrade/verify/:eventId", protect, confirmUpgradePayment);

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

router.put('/:eventId/media', protect, isSeller, uploadEventMedia);
router.put('/:eventId/products', protect, isSeller, addEventProducts);

router.post('/events',
    aiMiddleware.processEvent,
    createEvent
);

// AI-Enhanced Event Routes
router.post('/create-optimized', protect, createOptimizedEvent);
router.post('/optimize', protect, getEventOptimizations);
router.get('/optimize/:eventId', protect, optimizeExistingEvent);

// Auto-generate event with minimal input
router.post('/auto-generate', protect, autoGenerateEvent);

// Add event search route BEFORE /:id
router.get("/search", searchHandler);

export default router;
