import mongoose from 'mongoose';

const contentSchema = new mongoose.Schema({
    type: {
        type: String,
        enum: ['event', 'product', 'article', 'media'],
        required: true
    },
    title: {
        type: String,
        required: true
    },
    description: String,
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document'],
            required: true
        },
        url: String,
        metadata: Map
    }],
    categories: [String],
    tags: [String],
    status: {
        type: String,
        enum: ['draft', 'pending', 'published', 'archived'],
        default: 'draft'
    },
    author: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    analytics: {
        views: { type: Number, default: 0 },
        likes: { type: Number, default: 0 },
        shares: { type: Number, default: 0 }
    }
}, {
    timestamps: true
});

contentSchema.index({ title: 'text', description: 'text' });
contentSchema.index({ categories: 1, status: 1 });

export const ContentModel = mongoose.model('Content', contentSchema); 