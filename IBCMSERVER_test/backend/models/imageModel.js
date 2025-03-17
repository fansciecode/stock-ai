import mongoose from 'mongoose';

const imageSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    metadata: {
        width: Number,
        height: Number,
        format: String,
        size: Number,
        tags: [String]
    },
    analysis: {
        labels: [String],
        objects: [{
            name: String,
            confidence: Number,
            boundingBox: {
                top: Number,
                left: Number,
                width: Number,
                height: Number
            }
        }],
        safetyCheck: {
            isExplicit: Boolean,
            isViolent: Boolean,
            isMedical: Boolean,
            isSpoof: Boolean
        }
    },
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['profile', 'event', 'product', 'content'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'active', 'deleted'],
        default: 'pending'
    }
}, {
    timestamps: true
});

imageSchema.index({ userId: 1, contentType: 1 });
imageSchema.index({ 'analysis.labels': 1 });

export const ImageModel = mongoose.model('Image', imageSchema); 