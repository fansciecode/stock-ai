import mongoose from 'mongoose';

const userBehaviorSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    context: {
        location: {
            type: { type: String },
            coordinates: [Number]
        },
        timeOfDay: Number,
        dayOfWeek: Number
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
});

export const UserBehavior = mongoose.model('UserBehavior', userBehaviorSchema);

const searchPatternSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    query: String,
    selectedResult: {
        type: mongoose.Schema.Types.ObjectId,
        refPath: 'resultType'
    },
    resultType: {
        type: String,
        enum: ['Event', 'Business', 'Product']
    },
    timestamp: Date
});

export const SearchPattern = mongoose.model('SearchPattern', searchPatternSchema);
