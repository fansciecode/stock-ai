import mongoose from "mongoose";

const bookingSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    event: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    seats: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['PENDING', 'CONFIRMED', 'CANCELLED', 'COMPLETED'],
        default: 'PENDING'
    },
    tickets: [{
        ticketNumber: {
            type: String,
            required: true,
            unique: true
        },
        qrCode: {
            type: String,  // Stores the encrypted QR data
            required: true
        },
        status: {
            type: String,
            enum: ['VALID', 'USED', 'CANCELLED', 'EXPIRED'],
            default: 'VALID'
        },
        checkedIn: {
            status: Boolean,
            timestamp: Date,
            checkedBy: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'User'
            }
        },
        seatInfo: {
            section: String,
            row: String,
            seatNumber: String
        }
    }],
    totalAmount: {
        type: Number,
        required: true
    },
    cancelledAt: Date,
    cancellationReason: String
}, {
    timestamps: true
});

bookingSchema.methods.existingMethods = function() {
    // ... existing functionality stays the same ...
};

export default mongoose.model("Booking", bookingSchema);
