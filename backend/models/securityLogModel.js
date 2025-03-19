import mongoose from 'mongoose';

const securityLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    type: {
        type: String,
        enum: ['auth', 'verification', 'fraud', 'spam', 'other'],
        required: true
    },
    action: {
        type: String,
        required: true
    },
    status: {
        type: String,
        enum: ['success', 'failure', 'warning', 'blocked'],
        required: true
    },
    details: {
        type: Map,
        of: mongoose.Schema.Types.Mixed
    },
    ip: String,
    userAgent: String,
    timestamp: {
        type: Date,
        default: Date.now
    }
});

securityLogSchema.index({ timestamp: -1 });
securityLogSchema.index({ userId: 1, type: 1 });

export const SecurityLogModel = mongoose.model('SecurityLog', securityLogSchema); 