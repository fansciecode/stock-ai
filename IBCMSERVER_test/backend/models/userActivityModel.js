import mongoose from "mongoose";

const userActivitySchema = mongoose.Schema(
    {
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            required: true,
        },
        event: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "Event",
            required: true,
        },
        action: {
            type: String,
            enum: ["viewed", "clicked", "registered", "liked"],
            required: true,
        },
        timestamp: {
            type: Date,
            default: Date.now,
        },
    },
    { timestamps: true }
);

const UserActivityModel = mongoose.model("UserActivity", userActivitySchema);
export default UserActivityModel;
