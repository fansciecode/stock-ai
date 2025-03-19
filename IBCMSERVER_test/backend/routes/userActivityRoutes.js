import express from "express";
import { trackUserInterest,logUserActivity } from "../controllers/userActivityController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.post("/track-interest", protect, trackUserInterest);
router.post("/", protect, logUserActivity);

export default router;
