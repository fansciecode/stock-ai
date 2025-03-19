import mongoose from 'mongoose';

const venueSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
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
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        }
    },
    capacity: {
        total: Number,
        seating: Number,
        standing: Number
    },
    amenities: [{
        type: String,
        enum: ['parking', 'wifi', 'accessibility', 'food', 'bar', 'security', 'sound', 'lighting']
    }],
    categories: [{
        type: String,
        enum: ['concert', 'conference', 'sports', 'exhibition', 'wedding', 'party', 'other']
    }],
    availability: [{
        date: Date,
        timeSlots: [{
            start: Date,
            end: Date,
            isBooked: Boolean,
            price: Number
        }]
    }],
    metrics: {
        rating: {
            type: Number,
            min: 0,
            max: 5,
            default: 0
        },
        reviews: [{
            userId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            },
            rating: Number,
            comment: String,
            date: Date
        }],
        bookings: {
            type: Number,
            default: 0
        }
    },
    media: {
        images: [{
            url: String,
            type: String,
            description: String
        }],
        virtualTour: String,
        floorPlan: String
    },
    policies: {
        cancellation: String,
        insurance: String,
        minBookingTime: Number,
        maxBookingTime: Number
    },
    status: {
        type: String,
        enum: ['active', 'maintenance', 'closed', 'deleted'],
        default: 'active'
    },
    owner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    }
}, {
    timestamps: true
});

// Geospatial index for location-based queries
venueSchema.index({ location: '2dsphere' });
// Compound index for availability searches
venueSchema.index({ 'availability.date': 1, status: 1 });
// Index for category-based searches
venueSchema.index({ categories: 1 });

export const VenueModel = mongoose.model('Venue', venueSchema); 