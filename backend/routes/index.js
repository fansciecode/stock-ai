import express from "express";
import userRoutes from "./userRoutes.js";
import eventRoutes from "./eventRoutes.js";
import bookingRoutes from "./bookingRoutes.js";
import chatRoutes from "./chatRoutes.js";

const router = express.Router();

router.use("/users", userRoutes);
router.use("/events", eventRoutes);
router.use("/bookings", bookingRoutes);
router.use("/chat", chatRoutes);

export default router;
