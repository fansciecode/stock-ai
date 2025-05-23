import asyncHandler from "express-async-handler";
import{ UserModel } from "../models/userModel.js";
import Verification from "../models/verificationModel.js";
import generateToken from "../utils/generateToken.js";
import Category from "../models/categoryModel.js";
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
export const authUser = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Find user
        const user = await UserModel.findOne({ email });
        if (!user) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(401).json({ error: 'Invalid credentials' });
        }

        // Generate token
        const token = jwt.sign(
            { userId: user._id },
            process.env.JWT_SECRET,
            { expiresIn: '24h' }
        );

        // Update last login
        user.activity.lastLogin = new Date();
        user.activity.loginHistory.push({
            timestamp: new Date(),
            ip: req.ip,
            device: req.headers['user-agent']
        });
        await user.save();

        return res.status(200).json({
            success: true,
            token,
            user: {
                id: user._id,
                email: user.email,
                profile: user.profile,
                roles: user.roles
            }
        });
    } catch (error) {
        console.error('Authentication error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// @desc    Register a new user
// @route   POST /api/users/register
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
    const { name, email, password } = req.body;

    const userExists = await UserModel.findOne({ email });

    if (userExists) {
        res.status(400);
        throw new Error('User already exists');
    }

    const user = await UserModel.create({
        name,
        email,
        password
    });

    if (user) {
        res.status(201).json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            token: generateToken(user._id),
            isVerified: user.isVerified,
            verificationBadge: user.verificationBadge
        });
    } else {
        res.status(400);
        throw new Error('Invalid user data');
    }
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user._id)
        .select('-password')
        .populate('interests');

    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            email: user.email,
            isAdmin: user.isAdmin,
            isVerified: user.isVerified,
            verificationBadge: user.verificationBadge,
            interests: user.interests,
            businessInfo: user.businessInfo,
            location: user.location,
            fcmTokens: user.fcmTokens,
            profile: user.profile
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update user profile
// @route   PUT /api/users/profile
// @access  Private
const updateUserProfile = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.user._id);

    if (user) {
        user.name = req.body.name || user.name;
        user.email = req.body.email || user.email;
        
        if (req.body.password) {
            user.password = req.body.password;
        }

        if (req.body.location) {
            user.location = req.body.location;
        }

        if (req.body.interests) {
            user.interests = req.body.interests;
        }

        if (req.body.businessInfo && user.verificationBadge === 'BUSINESS') {
            user.businessInfo = {
                ...user.businessInfo,
                ...req.body.businessInfo
            };
        }

        if (req.body.profile) {
            user.profile = {
                ...user.profile,
                ...req.body.profile
            };
        }

        const updatedUser = await user.save();

        res.json({
            _id: updatedUser._id,
            name: updatedUser.name,
            email: updatedUser.email,
            isAdmin: updatedUser.isAdmin,
            token: generateToken(updatedUser._id),
            isVerified: updatedUser.isVerified,
            verificationBadge: updatedUser.verificationBadge,
            interests: updatedUser.interests,
            businessInfo: updatedUser.businessInfo,
            location: updatedUser.location,
            profile: updatedUser.profile
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get all users
// @route   GET /api/users
// @access  Private/Admin
const getUsers = asyncHandler(async (req, res) => {
    const users = await UserModel.find({}).select('-password');
    res.json(users);
});

// @desc    Delete user
// @route   DELETE /api/users/:id
// @access  Private/Admin
const deleteUser = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id);

    if (user) {
        if (user.isAdmin) {
            res.status(400);
            throw new Error('Cannot delete admin user');
        }
        await user.remove();
        res.json({ message: 'User removed' });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Update FCM token for notifications
// @route   POST /api/users/fcm-token
// @access  Private
const updateFCMToken = asyncHandler(async (req, res) => {
    const { token, device } = req.body;
      const user = await UserModel.findById(req.user._id);
      
    if (user) {
        // Remove old token for this device
        user.fcmTokens = user.fcmTokens.filter(t => t.device !== device);

        // Add new token
        user.fcmTokens.push({
            token,
            device,
            lastUsed: new Date()
        });

        await user.save();
        res.json({ success: true });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// @desc    Get user by ID
// @route   GET /api/users/:id
// @access  Private/Admin
const getUserById = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.id)
        .select('-password')
        .populate('interests')
        .populate('businessInfo.categories');

    if (user) {
        res.json(user);
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Submit verification request
const submitVerification = asyncHandler(async (req, res) => {
    const { documentType, documentNumber } = req.body;
    const documentFile = req.file; // Assuming file upload middleware is used

    if (!documentFile) {
        res.status(400);
        throw new Error('Document file is required');
    }

    const verification = await Verification.create({
        user: req.user._id,
        documentType,
        documentNumber,
        documentFile: documentFile.path,
        status: 'PENDING'
    });

    res.status(201).json({
        message: 'Verification request submitted successfully',
        verificationId: verification._id
    });
});

// Admin: Get pending verifications
const getPendingVerifications = asyncHandler(async (req, res) => {
    if (!req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const verifications = await Verification.find({ status: 'PENDING' })
        .populate('user', 'name email');

    res.json(verifications);
});

// Admin: Process verification
const processVerification = asyncHandler(async (req, res) => {
    const { verificationId } = req.params;
    const { status, remarks } = req.body;

    if (!req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const verification = await Verification.findById(verificationId)
        .populate('user');

    if (!verification) {
        res.status(404);
        throw new Error('Verification request not found');
    }

    verification.status = status;
    verification.remarks = remarks;
    verification.processedBy = req.user._id;
    verification.processedAt = Date.now();
    await verification.save();

    // Update user verification status if approved
    if (status === 'APPROVED') {
        const user = await UserModel.findById(verification.user._id);
        user.isVerified = true;
        user.verificationBadge = verification.documentType === 'BUSINESS' ? 'BUSINESS' : 'VERIFIED';
      await user.save();
    }

    res.json({
        message: `Verification ${status.toLowerCase()}`,
        verification
    });
});

// Get verification status
const getVerificationStatus = asyncHandler(async (req, res) => {
    const verification = await Verification.findOne({ 
        user: req.user._id 
    }).sort({ createdAt: -1 });

    if (!verification) {
        res.status(404);
        throw new Error('No verification requests found');
    }

    res.json({
        status: verification.status,
        documentType: verification.documentType,
        submittedAt: verification.createdAt,
        remarks: verification.remarks
    });
});

// Submit business verification
const submitBusinessVerification = asyncHandler(async (req, res) => {
    const {
        businessName,
        registrationNumber,
        taxId,
        businessAddress,
        businessType
    } = req.body;

    const files = req.files; // Using multer array upload

    if (!files || files.length === 0) {
        res.status(400);
        throw new Error('Required business documents not provided');
    }

    // Check if user already has a pending business verification
    const existingVerification = await Verification.findOne({
        user: req.user._id,
        documentType: 'BUSINESS',
        status: 'PENDING'
    });

    if (existingVerification) {
        res.status(400);
        throw new Error('You already have a pending business verification request');
    }

    // Create documents array from uploaded files
    const documents = files.map(file => ({
        type: file.fieldname,
        fileUrl: file.path,
        verified: false
    }));

    const verification = await Verification.create({
        user: req.user._id,
        documentType: 'BUSINESS',
        businessDetails: {
            businessName,
            registrationNumber,
            taxId,
            businessAddress,
            businessType
        },
        documents,
        status: 'PENDING'
    });

    res.status(201).json({
        message: 'Business verification request submitted successfully',
        verificationId: verification._id
    });
});

// Admin: Process business verification
const processBusinessVerification = asyncHandler(async (req, res) => {
    const { verificationId } = req.params;
    const { status, remarks, verifiedDocuments } = req.body;

    if (!req.user.isAdmin) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const verification = await Verification.findById(verificationId)
        .populate('user');

    if (!verification) {
        res.status(404);
        throw new Error('Verification request not found');
    }

    // Update document verification status
    if (verifiedDocuments) {
        verification.documents.forEach(doc => {
            if (verifiedDocuments[doc.type]) {
                doc.verified = true;
            }
        });
    }

    verification.status = status;
    verification.remarks = remarks;
    verification.processedBy = req.user._id;
    verification.processedAt = Date.now();
    await verification.save();

    // Update user status if approved
    if (status === 'APPROVED') {
        const user = await UserModel.findById(verification.user._id);
        user.isVerified = true;
        user.verificationBadge = 'BUSINESS';
        user.businessInfo = {
            ...verification.businessDetails,
            verifiedAt: Date.now()
        };
        await user.save();
    }

    res.json({
        message: `Business verification ${status.toLowerCase()}`,
        verification
    });
});

// Get business verification status
const getBusinessVerificationStatus = asyncHandler(async (req, res) => {
    const verification = await Verification.findOne({ 
        user: req.user._id,
        documentType: 'BUSINESS'
    }).sort({ createdAt: -1 });

    if (!verification) {
        res.status(404);
        throw new Error('No business verification requests found');
    }

    res.json({
        status: verification.status,
        businessDetails: verification.businessDetails,
        documents: verification.documents.map(doc => ({
            type: doc.type,
            verified: doc.verified
        })),
        submittedAt: verification.createdAt,
        remarks: verification.remarks
    });
});

// User Interactions
export const handleUserInteraction = async (req, res) => {
    try {
        const { userId, interactionType, targetId, data } = req.body;
        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        user.activity.interactions.push({
            type: interactionType,
            targetId,
            data,
            timestamp: new Date()
        });

        await user.save();
        return res.status(200).json({ success: true });
    } catch (error) {
        console.error('Interaction error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Business Verification
export const checkBusinessVerification = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            verificationStatus: user.profile.business?.verificationStatus || 'unverified',
            verificationDetails: user.profile.business?.verificationDetails || {}
        });
    } catch (error) {
        console.error('Verification status error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Security Settings
export const updateUserSecurity = async (req, res) => {
    try {
        const { userId } = req.params;
        const { securitySettings } = req.body;
        
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { 'security': securitySettings } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            security: user.security
        });
    } catch (error) {
        console.error('Security settings update error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// User Preferences
export const updateUserPreferences = async (req, res) => {
    try {
        const { userId } = req.params;
        const { preferences } = req.body;
        
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { 'preferences': preferences } },
            { new: true, runValidators: true }
        );
      
      if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            preferences: user.preferences
        });
    } catch (error) {
        console.error('Preferences update error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Activity History
export const fetchUserActivity = async (req, res) => {
    try {
        const { userId } = req.params;
        const user = await UserModel.findById(userId);
        
        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            activity: user.activity
        });
    } catch (error) {
        console.error('Activity fetch error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Role Management
export const manageUserRoles = async (req, res) => {
    try {
        const { userId } = req.params;
        const { roles } = req.body;
        
        const user = await UserModel.findByIdAndUpdate(
            userId,
            { $set: { 'roles': roles } },
            { new: true, runValidators: true }
        );

        if (!user) {
            return res.status(404).json({ error: 'User not found' });
        }

        return res.status(200).json({
            success: true,
            roles: user.roles
      });
    } catch (error) {
        console.error('Roles update error:', error);
        return res.status(500).json({ error: 'Internal server error' });
    }
};

// Add public profile endpoint:
export const getPublicProfile = asyncHandler(async (req, res) => {
    const user = await UserModel.findById(req.params.userId)
        .select('name profile followers following businessInfo location');
    if (user) {
        res.json({
            _id: user._id,
            name: user.name,
            profile: user.profile,
            followers: user.followers,
            following: user.following,
            businessInfo: user.businessInfo,
            location: user.location
        });
    } else {
        res.status(404);
        throw new Error('User not found');
    }
});

// Export all functions
export const userController = {
    authUser,
    registerUser,
    getUserProfile,
    updateUserProfile,
    getUsers,
    deleteUser,
    updateFCMToken,
    getUserById,
    submitVerification,
    getPendingVerifications,
    processVerification,
    getVerificationStatus,
    submitBusinessVerification,
    processBusinessVerification,
    getBusinessVerificationStatus,
    handleUserInteraction,
    checkBusinessVerification,
    updateUserSecurity,
    updateUserPreferences,
    fetchUserActivity,
    manageUserRoles,
    getPublicProfile
};
  