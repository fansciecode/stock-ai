import mongoose from 'mongoose';

const externalReviewSchema = new mongoose.Schema({
    externalId: {
        type: String,
        required: true
    },
    source: {
        type: String,
        required: true,
        enum: ['google', 'amazon', 'flipkart', 'other']
    },
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    rating: {
        type: Number,
        required: true,
        min: 1,
        max: 5
    },
    comment: {
        type: String,
        required: true,
        trim: true,
        maxlength: 500
    },
    photos: [{
        type: String,
        validate: {
            validator: function(v) {
                return /^https?:\/\/.+/.test(v);
            },
            message: 'Invalid URL format'
        }
    }],
    likes: [{
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }],
    verified: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true
});

// Compound index for querying reviews by external source and ID
externalReviewSchema.index({ externalId: 1, source: 1 });
// Index for user's reviews
externalReviewSchema.index({ user: 1, createdAt: -1 });

// Virtual for formatted date
externalReviewSchema.virtual('formattedDate').get(function() {
    return this.createdAt.toLocaleDateString();
});

// Methods
externalReviewSchema.methods.toggleLike = async function(userId) {
    const userLiked = this.likes.includes(userId);
    if (userLiked) {
        this.likes = this.likes.filter(id => !id.equals(userId));
    } else {
        this.likes.push(userId);
    }
    await this.save();
    return !userLiked;
};

// Statics
externalReviewSchema.statics.getAverageRating = async function(externalId, source) {
    const result = await this.aggregate([
        {
            $match: { externalId, source }
        },
        {
            $group: {
                _id: null,
                averageRating: { $avg: '$rating' },
                totalReviews: { $sum: 1 }
            }
        }
    ]);
    return result[0] || { averageRating: 0, totalReviews: 0 };
};

export const ExternalReview = mongoose.model('ExternalReview', externalReviewSchema); 