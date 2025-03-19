import asyncHandler from 'express-async-handler';
import ProfileAutomator from '../services/automation/profileAutomator.js';
import { UserModel } from '../models/userModel.js';
import { BusinessModel } from '../models/businessModel.js';

// @desc    Auto-generate user profile
// @route   POST /api/profile/generate-user
// @access  Private
export const generateUserProfile = asyncHandler(async (req, res) => {
    try {
        const { name, email, interests } = req.body;

        // Generate profile suggestions
        const profileData = await ProfileAutomator.generateUserProfile({
            name,
            email,
            interests
        });

        // Create or update user profile
        const user = await UserModel.findByIdAndUpdate(
            req.user._id,
            { ...profileData },
            { new: true, runValidators: true }
        );

        res.json({
            success: true,
            user,
            suggestions: profileData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Auto-generate business profile
// @route   POST /api/profile/generate-business
// @access  Private
export const generateBusinessProfile = asyncHandler(async (req, res) => {
    try {
        const { name, location, type } = req.body;

        // Generate business profile
        const profileData = await ProfileAutomator.generateBusinessProfile({
            name,
            location,
            type
        });

        // Create or update business profile
        const business = await BusinessModel.findOneAndUpdate(
            { owner: req.user._id },
            { ...profileData },
            { new: true, upsert: true, runValidators: true }
        );

        res.json({
            success: true,
            business,
            suggestions: profileData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Auto-fill event details from location
// @route   POST /api/profile/auto-fill-location
// @access  Private
export const autoFillFromLocation = asyncHandler(async (req, res) => {
    try {
        const { location } = req.body;

        // Get location-based suggestions
        const locationData = await ProfileAutomator.autoFillEventFromLocation(location);

        res.json({
            success: true,
            locationDetails: locationData
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Update user preferences
// @route   PUT /api/profile/preferences
// @access  Private
export const updateUserPreferences = asyncHandler(async (req, res) => {
    try {
        const { interests, eventTypes } = req.body;

        // Generate expanded preferences
        const expandedInterests = await ProfileAutomator.expandUserInterests(interests);

        // Update user preferences
        const user = await UserModel.findByIdAndUpdate(
            req.user._id,
            {
                interests: expandedInterests,
                eventPreferences: eventTypes
            },
            { new: true }
        );

        res.json({
            success: true,
            user,
            suggestions: {
                interests: expandedInterests,
                recommendedEventTypes: await ProfileAutomator.generateEventTypeRecommendations(expandedInterests)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
}); 