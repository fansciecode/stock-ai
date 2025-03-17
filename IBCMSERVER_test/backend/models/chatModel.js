import mongoose from "mongoose";

// Define MessageSchema first
const messageSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    content: {
        type: String,
        required: true
    },
    messageType: {
        type: String,
        enum: ['TEXT', 'IMAGE', 'FILE'],
        default: 'TEXT'
    },
    readBy: [{
        user: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        readAt: Date
    }]
}, {
    timestamps: true
});

// Then use it in ChatSchema
const chatSchema = new mongoose.Schema({
    chatName: { type: String, required: true },
    isGroupChat: { type: Boolean, default: false },
    users: [{ type: mongoose.Schema.Types.ObjectId, ref: "User" }],
    latestMessage: { type: mongoose.Schema.Types.ObjectId, ref: "Message" },
    groupAdmin: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
    participants: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }],
    messages: [messageSchema],
    lastMessage: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Message'
    },
    chatType: {
        type: String,
        enum: ['INDIVIDUAL', 'GROUP'],
        default: 'INDIVIDUAL'
    },
    isActive: {
        type: Boolean,
        default: true
    }
}, { timestamps: true });

const Chat = mongoose.model("Chat", chatSchema);

export default Chat;
