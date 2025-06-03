import mongoose from 'mongoose';

const serviceBookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    serviceId: {
        type: String,
        required: true
    },
    serviceName: {
        type: String,
        required: true
    },
    price: {
        type: Number,
        required: true
    },
    currency: {
        type: String,
        default: 'INR',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'completed'],
        default: 'confirmed'
    },
    payment: {
        method: String,
        transactionId: String,
        status: String
    }
}, {
    timestamps: true
});

const ServiceBooking = mongoose.model('ServiceBooking', serviceBookingSchema);
export default ServiceBooking; 