import mongoose from 'mongoose';

const productSchema = new mongoose.Schema({
    name: {
        type: String,
        required: true,
        index: true
    },
    description: String,
    price: {
        amount: {
            type: Number,
            required: true
        },
        currency: {
            type: String,
            default: 'USD'
        }
    },
    category: {
        main: {
            type: String,
            required: true
        },
        sub: String
    },
    attributes: [{
        name: String,
        value: mongoose.Schema.Types.Mixed
    }],
    media: [{
        type: {
            type: String,
            enum: ['image', 'video', 'document']
        },
        url: String,
        thumbnail: String,
        order: Number
    }],
    inventory: {
        quantity: {
            type: Number,
            default: 0
        },
        sku: String,
        status: {
            type: String,
            enum: ['in_stock', 'low_stock', 'out_of_stock'],
            default: 'in_stock'
        }
    },
    ratings: {
        average: {
            type: Number,
            default: 0
        },
        count: {
            type: Number,
            default: 0
        }
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    status: {
        type: String,
        enum: ['draft', 'active', 'inactive', 'deleted'],
        default: 'draft'
    },
    tags: [String],
    metadata: {
        views: {
            type: Number,
            default: 0
        },
        favorites: {
            type: Number,
            default: 0
        },
        lastPurchased: Date
    }
}, {
    timestamps: true
});

// Indexes for common queries
productSchema.index({ 'category.main': 1, 'category.sub': 1 });
productSchema.index({ tags: 1 });
productSchema.index({ 'inventory.status': 1 });
productSchema.index({ 'ratings.average': -1 });

export const ProductModel = mongoose.model('Product', productSchema); 