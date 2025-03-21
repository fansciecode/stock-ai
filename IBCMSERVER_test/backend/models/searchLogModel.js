import mongoose from 'mongoose';

const searchLogSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    query: {
        type: String,
        required: true
    },
    filters: {
        type: Map,
        of: String,
        default: {}
    },
    results: {
        count: Number,
        relevanceScore: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            default: [0, 0]
        }
    },
    device: {
        type: String,
        required: false
    },
    sessionId: {
        type: String,
        required: true
    }
});

searchLogSchema.index({ timestamp: -1 });
searchLogSchema.index({ location: '2dsphere' });

export const SearchLogModel = mongoose.model('SearchLog', searchLogSchema); 