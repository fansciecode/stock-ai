const cartSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
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
            required: true,
            min: 1
        },
        price: Number,
        selectedAttributes: {
            size: String,
            color: String,
            // other attributes
        }
    }],
    appliedCoupons: [{
        code: String,
        discount: Number,
        type: {
            type: String,
            enum: ['PERCENTAGE', 'FIXED']
        }
    }],
    summary: {
        subtotal: Number,
        discount: Number,
        tax: Number,
        shipping: Number,
        total: Number
    }
}, {
    timestamps: true
}); 