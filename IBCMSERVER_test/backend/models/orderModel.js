import mongoose from 'mongoose';

const orderSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    eventId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event',
        required: true
    },
    tickets: [{
        type: {
            type: String,
            required: true
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            amount: Number,
            currency: {
                type: String,
                default: 'USD'
            }
        }
    }],
    total: {
        amount: Number,
        currency: {
            type: String,
            default: 'USD'
        }
    },
    status: {
        type: String,
        enum: ['pending', 'confirmed', 'cancelled', 'refunded'],
        default: 'pending'
    },
    payment: {
        method: String,
        transactionId: String,
        status: String
    },
    metadata: {
        ip: String,
        userAgent: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: [Number]
        }
    }
}, {
    timestamps: true
});

// Add indexes for common queries
orderSchema.index({ userId: 1, status: 1 });
orderSchema.index({ eventId: 1, status: 1 });
orderSchema.index({ 'payment.transactionId': 1 });

export const OrderModel = mongoose.model('Order', orderSchema); 