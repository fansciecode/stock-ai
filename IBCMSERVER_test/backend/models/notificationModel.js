import mongoose from "mongoose";

const notificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },
    type: {
        type: String,
        enum: ["ORDER", "DELIVERY", "INVENTORY", "GENERAL"],
        required: true
    },
    message: {
        type: String,
        required: true
    },
    data: mongoose.Schema.Types.Mixed,
    read: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

const NotificationModel = mongoose.model("Notification", notificationSchema);

export {NotificationModel};
