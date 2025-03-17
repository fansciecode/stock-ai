import mongoose from 'mongoose';

const verificationSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    documentType: {
        type: String,
        enum: ['PERSONAL', 'BUSINESS'],
        required: true
    },
    // Business specific fields
    businessDetails: {
        businessName: String,
        registrationNumber: String,
        taxId: String,
        businessAddress: {
            street: String,
            city: String,
            state: String,
            zipCode: String,
            country: String
        },
        businessType: {
            type: String,
            enum: ['SOLE_PROPRIETORSHIP', 'PARTNERSHIP', 'LLC', 'CORPORATION', 'OTHER']
        }
    },
    documents: [{
        type: {
            type: String,
            enum: [
                'BUSINESS_REGISTRATION',
                'TAX_CERTIFICATE',
                'ID_PROOF',
                'ADDRESS_PROOF',
                'TRADE_LICENSE',
                'OTHER'
            ]
        },
        fileUrl: String,
        verified: {
            type: Boolean,
            default: false
        }
    }],
    status: {
        type: String,
        enum: ['PENDING', 'APPROVED', 'REJECTED', 'MORE_INFO_NEEDED'],
        default: 'PENDING'
    },
    remarks: String,
    processedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    processedAt: Date
}, {
    timestamps: true
});

const Verification = mongoose.model('Verification', verificationSchema);
export default Verification; 