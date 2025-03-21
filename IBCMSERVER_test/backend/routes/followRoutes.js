import express from "express";
import { followUser, unfollowUser, getUserFollowers, getUserFollowing } from "../controllers/followController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

// Follow a user
router.post("/:id/follow", protect, followUser);

// Unfollow a user
router.post("/:id/unfollow", protect, unfollowUser);

// Get followers of a user
router.get("/:id/followers", protect, getUserFollowers);

// Get users followed by a user
router.get("/:id/following", protect, getUserFollowing);

export default router;
