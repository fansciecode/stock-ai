import express from "express";
import {
    createBooking,
    createEnhancedBooking,
    getUserBookings,
    getEventBookings,
    getMyBookings,
    getBookingById,
    updateBookingStatus,
    validateTicket,
    cancelBooking,
    enhanceBooking,
    checkInBooking,
    generateTicketQR,
    validateEventTicket,
    getEventCheckInStats
} from "../controllers/bookingController.js";
import { protect, isSeller, isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, createBooking).get(protect, getMyBookings);
router.route("/:id").get(protect, getBookingById);
router.put("/:id/status", protect, isAdmin, updateBookingStatus);
router.post("/:id/cancel", protect, cancelBooking);
router.post("/:id/enhance", protect, isAdmin, enhanceBooking);
router.post("/:id/check-in", protect, checkInBooking);
router.post("/:id/validate", protect, validateTicket);
router.get("/user/:userId", protect, isAdmin, getUserBookings);
router.get("/event/:eventId", protect, isSeller, getEventBookings);
router.get('/:bookingId/tickets/:ticketId/qr', protect, generateTicketQR);
router.post('/events/:eventId/validate-ticket', protect, validateEventTicket);
router.get('/events/:eventId/checkin-stats', protect, getEventCheckInStats);

export default router;
