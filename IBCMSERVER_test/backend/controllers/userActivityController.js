import asyncHandler from "express-async-handler";
import { UserModel } from "../models/userModel.js";
import UserActivityModel from "../models/userActivityModel.js";

// Track user interest in events
export const trackUserInterest = asyncHandler(async (req, res) => {
    const { category } = req.body;
    const user = await User.findById(req.user._id);

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    if (!user.interests.includes(category)) {
        user.interests.push(category);
    }

    await user.save();
    res.json({ message: "Interest tracked successfully" });
});
// @desc    Log user activity
// @route   POST /api/user-activity
// @access  Private
export const logUserActivity = asyncHandler(async (req, res) => {
    const { event, action } = req.body;

    const activity = new UserActivity({
        user: req.user._id,
        event,
        action,
    });

    const createdActivity = await activity.save();
    res.status(201).json(createdActivity);
});