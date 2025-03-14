import asyncHandler from "express-async-handler";
import { NotificationModel } from "../models/notificationModel.js";

// @desc Send a notification
// @route POST /api/notifications
// @access Private
const sendNotification = asyncHandler(async (req, res) => {
    const { recipient, type, message, referenceId } = req.body;

    const notification = await Notification.create({
        recipient,
        sender: req.user._id,
        type,
        message,
        referenceId,
    });

    res.status(201).json(notification);
});

// @desc Get all notifications for a user
// @route GET /api/notifications
// @access Private
const getUserNotifications = asyncHandler(async (req, res) => {
    const notifications = await Notification.find({ recipient: req.user._id }).sort({ createdAt: -1 });
    res.status(200).json(notifications);
});

// @desc Mark notification as read
// @route PUT /api/notifications/read/:id
// @access Private
const markAsRead = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndUpdate(req.params.id, { isRead: true }, { new: true });

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    res.status(200).json(notification);
});

// @desc Delete a notification
// @route DELETE /api/notifications/delete/:id
// @access Private
const deleteNotification = asyncHandler(async (req, res) => {
    const notification = await Notification.findByIdAndDelete(req.params.id);

    if (!notification) {
        res.status(404);
        throw new Error("Notification not found");
    }

    res.status(200).json({ message: "Notification deleted" });
});

export { sendNotification, getUserNotifications, markAsRead, deleteNotification };
