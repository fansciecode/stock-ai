import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['purchase', 'refund', 'subscription', 'deposit', 'withdrawal'],
        required: true
    },
    amount: {
        value: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    payment: {
        method: {
            type: String,
            enum: ['credit_card', 'debit_card', 'bank_transfer', 'wallet', 'crypto'],
            required: true
        },
        status: {
            type: String,
            enum: ['pending', 'completed', 'failed', 'refunded', 'disputed'],
            default: 'pending'
        },
        gateway: String,
        reference: String
    },
    risk: {
        score: {
            type: Number,
            min: 0,
            max: 1,
            default: 0
        },
        flags: [{
            type: String,
            reason: String,
            severity: {
                type: String,
                enum: ['low', 'medium', 'high']
            }
        }],
        verification: {
            required: Boolean,
            method: String,
            status: String
        }
    },
    metadata: {
        ip: String,
        device: String,
        location: {
            country: String,
            city: String,
            coordinates: {
                type: [Number],
                index: '2dsphere'
            }
        },
        userAgent: String
    },
    items: [{
        productId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product'
        },
        quantity: Number,
        price: Number,
        description: String
    }],
    billing: {
        address: {
            street: String,
            city: String,
            state: String,
            country: String,
            postalCode: String
        },
        name: String,
        email: String,
        phone: String
    }
}, {
    timestamps: true
});

// Indexes for common queries
transactionSchema.index({ userId: 1, createdAt: -1 });
transactionSchema.index({ 'payment.status': 1 });
transactionSchema.index({ 'risk.score': 1 });
transactionSchema.index({ 'metadata.location.coordinates': '2dsphere' });

export const TransactionModel = mongoose.model('Transaction', transactionSchema); 