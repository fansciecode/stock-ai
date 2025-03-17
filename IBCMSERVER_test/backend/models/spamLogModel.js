import mongoose from 'mongoose';

const spamLogSchema = new mongoose.Schema({
    contentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Content',
        required: true
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: ['comment', 'message', 'content', 'other'],
        required: true
    },
    confidence: {
        type: Number,
        required: true,
        min: 0,
        max: 1
    },
    flags: [{
        type: String,
        reason: String,
        confidence: Number
    }],
    action: {
        type: String,
        enum: ['flagged', 'blocked', 'removed', 'approved'],
        required: true
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

spamLogSchema.index({ timestamp: -1 });
spamLogSchema.index({ contentId: 1, type: 1 });

export const SpamLogModel = mongoose.model('SpamLog', spamLogSchema); 