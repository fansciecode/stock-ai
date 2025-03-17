import mongoose from 'mongoose';

const audioSchema = new mongoose.Schema({
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
        bitrate: Number,
        sampleRate: Number,
        channels: Number
    },
    analysis: {
        transcription: {
            text: String,
            language: String,
            confidence: Number,
            timestamps: [{
                word: String,
                start: Number,
                end: Number
            }]
        },
        sentiment: {
            score: Number,
            magnitude: Number,
            labels: [String]
        },
        voiceCharacteristics: {
            pitch: Number,
            speed: Number,
            clarity: Number,
            accent: String,
            gender: String
        },
        noiseProfile: {
            snr: Number,
            background: [String],
            quality: String
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
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    contentType: {
        type: String,
        enum: ['voice-command', 'message', 'content', 'verification'],
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

// Indexes for common queries
audioSchema.index({ userId: 1, contentType: 1 });
audioSchema.index({ 'processing.status': 1 });
audioSchema.index({ 'analysis.transcription.language': 1 });

export const AudioModel = mongoose.model('Audio', audioSchema); 