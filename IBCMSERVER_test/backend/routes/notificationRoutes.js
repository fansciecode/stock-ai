import express from "express";
import { sendNotification, getUserNotifications, markAsRead, deleteNotification } from "../controllers/notificationController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, sendNotification).get(protect, getUserNotifications);
router.route("/read/:id").put(protect, markAsRead);
router.route("/delete/:id").delete(protect, deleteNotification);

export default router;
