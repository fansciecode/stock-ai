import mongoose from 'mongoose';

const videoSchema = new mongoose.Schema({
    url: {
        type: String,
        required: true
    },
    publicId: {
        type: String,
        required: true
    },
    metadata: {
        duration: Number,
        format: String,
        size: Number,
        resolution: {
            width: Number,
            height: Number
        },
        bitrate: Number,
        fps: Number
    },
    analysis: {
        transcription: String,
        labels: [String],
        scenes: [{
            startTime: Number,
            endTime: Number,
            description: String,
            confidence: Number
        }],
        objects: [{
            name: String,
            confidence: Number,
            timeRanges: [{
                start: Number,
                end: Number
            }]
        }],
        safetyCheck: {
            isExplicit: Boolean,
            isViolent: Boolean,
            isMedical: Boolean,
            isSpoof: Boolean
        }
    },
    processing: {
        status: {
            type: String,
            enum: ['queued', 'processing', 'completed', 'failed'],
            default: 'queued'
        },
        progress: {
            type: Number,
            default: 0
        },
        error: String
    },
    versions: [{
        quality: String,
        url: String,
        format: String,
        size: Number
    }],
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['event', 'product', 'content', 'advertisement'],
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'processing', 'active', 'deleted'],
        default: 'draft'
    }
}, {
    timestamps: true
});

videoSchema.index({ userId: 1, contentType: 1 });
videoSchema.index({ 'analysis.labels': 1 });
videoSchema.index({ 'processing.status': 1 });

export const VideoModel = mongoose.model('Video', videoSchema); 