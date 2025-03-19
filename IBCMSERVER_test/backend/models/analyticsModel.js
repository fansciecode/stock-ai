import mongoose from 'mongoose';

const analyticsSchema = new mongoose.Schema({
    entityId: {
        type: mongoose.Schema.Types.ObjectId,
        required: true
    },
    entityType: {
        type: String,
        enum: ['user', 'content', 'event', 'product'],
        required: true
    },
    metrics: {
        type: Map,
        of: Number,
        default: {}
    },
    dimensions: {
        type: Map,
        of: String,
        default: {}
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

analyticsSchema.index({ entityId: 1, entityType: 1 });
analyticsSchema.index({ timestamp: -1 });

export const AnalyticsModel = mongoose.model('Analytics', analyticsSchema); 