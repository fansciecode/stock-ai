// NEW MODEL FOR PRODUCT ORDERS - Separate from event bookings
const productOrderSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    seller: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    sourceEvent: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Event'
        // Optional - only if order placed from event page
    },
    orderNumber: {
        type: String,
        unique: true,
        required: true
    },
    items: [{
        product: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'Product',
            required: true
        },
        variant: {
            type: mongoose.Schema.Types.ObjectId
        },
        quantity: {
            type: Number,
            required: true
        },
        price: {
            base: Number,
            discount: Number,
            final: Number
        },
        productSnapshot: {
            name: String,
            sku: String,
            attributes: Object
        }
    }],
    billing: {
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            phone: String
        },
        email: String
    },
    shipping: {
        sameAsBilling: {
            type: Boolean,
            default: true
        },
        address: {
            street: String,
            city: String,
            state: String,
            postalCode: String,
            country: String,
            phone: String
        },
        method: {
            carrier: String,
            service: String,
            cost: Number,
            estimatedDays: Number
        },
        tracking: [{
            number: String,
            carrier: String,
            status: String,
            lastUpdate: Date
        }]
    },
    amounts: {
        subtotal: Number,
        discount: Number,
        tax: Number,
        shipping: Number,
        total: Number
    },
    payment: {
        method: {
            type: String,
            enum: ['CARD', 'COD', 'WALLET', 'BANK_TRANSFER'],
            required: true
        },
        status: String,
        transactions: [{
            id: String,
            amount: Number,
            status: String,
            type: {
                type: String,
                enum: ['PAYMENT', 'REFUND']
            },
            date: Date
        }]
    },
    timeline: [{
        status: String,
        date: Date,
        note: String,
        updatedBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        }
    }],
    notes: [{
        type: String,
        date: Date,
        author: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'User'
        },
        isInternal: Boolean
    }],
    status: {
        type: String,
        default: 'pending'
    },
    shipping: {
        status: {
            type: String,
            default: 'pending'
        }
    }
}, {
    timestamps: true
});

const ProductOrder = mongoose.model('ProductOrder', productOrderSchema);
export default ProductOrder; 