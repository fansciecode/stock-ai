import mongoose from 'mongoose';

const deliverySchema = new mongoose.Schema({
    order: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    business: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Business',
        required: true
    },
    deliveryPartner: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'DeliveryPartner'
    },
    status: {
        type: String,
        enum: ['PENDING', 'ASSIGNED', 'PICKED_UP', 'IN_TRANSIT', 'DELIVERED', 'FAILED'],
        default: 'PENDING'
    },
    tracking: [{
        status: String,
        location: {
            lat: Number,
            lng: Number
        },
        timestamp: Date,
        note: String
    }],
    estimatedDeliveryTime: Date,
    actualDeliveryTime: Date,
    deliveryFee: Number
}, {
    timestamps: true
});

// Method to update delivery status
deliverySchema.methods.updateStatus = async function(newStatus, location, note) {
    this.status = newStatus;
    this.tracking.push({
        status: newStatus,
        location,
        timestamp: new Date(),
        note
    });

    if (newStatus === 'DELIVERED') {
        this.actualDeliveryTime = new Date();
    }

    await this.save();
};

const Delivery = mongoose.model('Delivery', deliverySchema);
export default Delivery; 