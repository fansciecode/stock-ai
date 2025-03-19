import mongoose from 'mongoose';

const eventSchema = new mongoose.Schema({
    title: {
        type: String,
        required: true
    },
    description: String,
    date: {
        start: {
            type: Date,
            required: true
        },
        end: {
            type: Date,
            required: true
        }
    },
    location: {
        type: {
            type: String,
            enum: ['Point'],
            default: 'Point'
        },
        coordinates: {
            type: [Number],
            required: true
        },
        venue: String,
        address: String
    },
    category: {
        type: String,
        required: true
    },
    capacity: {
        total: Number,
        booked: {
            type: Number,
            default: 0
        }
    },
    pricing: [{
        type: {
            type: String,
            required: true
        },
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    }],
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed'],
        default: 'draft'
    },
    tags: [String],
    media: [{
        type: String,
        url: String,
        description: String
    }]
}, {
    timestamps: true
});

// Add geospatial index for location queries
eventSchema.index({ 'location.coordinates': '2dsphere' });
// Add compound index for date and status queries
eventSchema.index({ 'date.start': 1, status: 1 });

export const EventModel = mongoose.model('Event', eventSchema);
