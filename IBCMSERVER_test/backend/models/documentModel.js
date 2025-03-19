import mongoose from 'mongoose';

const documentSchema = new mongoose.Schema({
    userId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    type: {
        type: String,
        enum: ['id_card', 'passport', 'driver_license', 'business_license', 'utility_bill', 'bank_statement'],
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'verified', 'rejected', 'expired'],
        default: 'pending'
    },
    files: [{
        url: String,
        type: {
            type: String,
            enum: ['front', 'back', 'selfie', 'additional']
        },
        metadata: {
            size: Number,
            format: String,
            dimensions: {
                width: Number,
                height: Number
            }
        }
    }],
    verification: {
        verifiedAt: Date,
        verifiedBy: {
            type: String,
            enum: ['auto', 'manual'],
            default: 'auto'
        },
        score: {
            type: Number,
            min: 0,
            max: 1
        },
        details: {
            authenticity: {
                score: Number,
                flags: [String]
            },
            dataMatch: {
                score: Number,
                mismatches: [String]
            },
            quality: {
                score: Number,
                issues: [String]
            }
        }
    },
    extracted: {
        documentNumber: String,
        fullName: String,
        dateOfBirth: Date,
        dateOfIssue: Date,
        dateOfExpiry: Date,
        issuingCountry: String,
        additionalFields: Map
    },
    history: [{
        status: String,
        reason: String,
        timestamp: {
            type: Date,
            default: Date.now
        },
        notes: String
    }],
    metadata: {
        ipAddress: String,
        userAgent: String,
        location: {
            type: {
                type: String,
                enum: ['Point'],
                default: 'Point'
            },
            coordinates: {
                type: [Number],
                default: [0, 0]
            }
        },
        deviceInfo: Map
    }
}, {
    timestamps: true
});

// Indexes for common queries
documentSchema.index({ userId: 1, type: 1 });
documentSchema.index({ status: 1 });
documentSchema.index({ 'verification.verifiedAt': 1 });
documentSchema.index({ 'extracted.documentNumber': 1 });
documentSchema.index({ 'metadata.location': '2dsphere' });

// Virtual for document validity
documentSchema.virtual('isValid').get(function() {
    return this.status === 'verified' && 
           (!this.extracted.dateOfExpiry || new Date(this.extracted.dateOfExpiry) > new Date());
});

// Methods
documentSchema.methods.updateVerificationStatus = async function(status, reason) {
    this.status = status;
    this.history.push({
        status,
        reason,
        timestamp: new Date()
    });
    return this.save();
};

export const DocumentModel = mongoose.model('Document', documentSchema); 