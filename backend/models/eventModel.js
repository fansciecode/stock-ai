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
    startTime: {
        type: String,
        default: "00:00"
    },
    endTime: {
        type: String,
        default: "00:00"
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
        city: String,
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
    eventType: {
        type: String,
        enum: ['INFORMATIVE', 'BOOKING', 'PRODUCT', 'SERVICE', 'CONFERENCE', 'WORKSHOP', 'SEMINAR', 'EXHIBITION', 'CONCERT', 'FESTIVAL', 'SPORTING', 'CHARITY', 'NETWORKING', 'MEETING', 'OTHER'],
        default: 'INFORMATIVE'
    },
    organizer: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'published', 'cancelled', 'completed', 'ACTIVE'],
        default: 'ACTIVE'
    },
    tags: [String],
    media: [{
        id: String,
        caption: String,
        type: {
            type: String,
            enum: ['image', 'video', 'document'],
            default: 'image'
        },
        url: String
    }],
    time: { type: String, required: true },
    maxAttendees: { type: Number, required: true },
    imageUrl: { type: String },
    attendees: [{ type: mongoose.Schema.Types.ObjectId, ref: 'User' }],
    guidelines: [String],
    products: [{
        id: String,
        name: String,
        description: String,
        price: Number,
        regularPrice: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        quantity: Number,
        imageUrl: String,
        category: String
    }],
    services: [{
        id: String,
        name: String,
        description: String,
        price: Number,
        duration: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        imageUrl: String,
        category: String,
        availabilitySchedule: {
            availableTimeSlots: [{
                startTime: String,
                endTime: String,
                availableSpots: Number,
                dayOfWeek: String
            }]
        }
    }],
    ticketTypes: [{
        name: String,
        description: String,
        price: Number,
        quantity: Number,
        currency: {
            type: String,
            default: 'USD'
        },
        available: {
            type: Boolean,
            default: true
        }
    }]
}, {
    timestamps: true
});

// Add geospatial index for location queries
eventSchema.index({ 'location.coordinates': '2dsphere' });
// Add compound index for date and status queries
eventSchema.index({ 'date.start': 1, status: 1 });

export const EventModel = mongoose.model('Event', eventSchema);
