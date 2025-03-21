import asyncHandler from 'express-async-handler';
import { BusinessModel as Business } from '../models/businessModel.js';
import Verification from '../models/verificationModel.js';

// Submit business verification - integrated with existing business
const submitBusinessVerification = asyncHandler(async (req, res) => {
    const {
        businessName,
        registrationNumber,
        registrationType,
        contactInfo
    } = req.body;

    const files = req.files;

    // Check existing business
    let business = await Business.findOne({ user: req.user._id });
    
    if (!business) {
        // Create new business if doesn't exist
        business = await Business.create({
            user: req.user._id,
            businessName,
            registrationDetails: {
                registrationNumber,
                registrationType,
                registrationDate: new Date()
            },
            contactInfo,
            status: 'PENDING_VERIFICATION'
        });
    }

    // Create verification request
    const documents = Object.entries(files).map(([type, fileArray]) => ({
        type,
        fileUrl: fileArray[0].path,
        verified: false,
        uploadedAt: new Date()
    }));

    const verification = await Verification.create({
        user: req.user._id,
        business: business._id,
        documentType: 'BUSINESS',
        businessDetails: {
            businessName,
            registrationNumber,
            businessType: registrationType
        },
        documents,
        status: 'PENDING'
    });

    // Update business documents
    business.verificationStatus.documents = documents;
    await business.save();

    res.status(201).json({
        message: 'Business verification request submitted successfully',
        verificationId: verification._id,
        businessId: business._id
    });
});

// Process business verification - integrated with business model
const processBusinessVerification = asyncHandler(async (req, res) => {
    const { verificationId } = req.params;
    const { status, remarks, verifiedDocuments } = req.body;

    const verification = await Verification.findById(verificationId)
        .populate('user')
        .populate('business');

    if (!verification) {
        res.status(404);
        throw new Error('Verification request not found');
    }

    // Update verification status
    verification.status = status;
    verification.remarks = remarks;
    verification.processedBy = req.user._id;
    verification.processedAt = Date.now();

    // Update document verification status
    if (verifiedDocuments) {
        verification.documents.forEach(doc => {
            if (verifiedDocuments[doc.type]) {
                doc.verified = true;
            }
        });
    }

    await verification.save();

    // If approved, update business verification status
    if (status === 'APPROVED') {
        const business = await Business.findById(verification.business);
        if (business) {
            await business.updateVerificationStatus({
                documents: verification.documents
            }, req.user);
        }
    }

    res.json({
        message: `Business verification ${status.toLowerCase()}`,
        verification
    });
});

export {
    submitBusinessVerification,
    processBusinessVerification
}; 