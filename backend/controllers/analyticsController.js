import asyncHandler from "express-async-handler";
import { EventModel } from "../models/eventModel.js";
import { UserModel } from "../models/userModel.js";
import  UserActivityModel  from "../models/userActivityModel.js";
import { OrderModel } from '../models/orderModel.js';
import { BusinessModel } from '../models/businessModel.js';

// Get analytics for event ratings
export const getEventRatingAnalytics = asyncHandler(async (req, res) => {
    const eventAnalytics = await Event.aggregate([
        {
            $group: {
                _id: "$category",
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: "$numReviews" },
            },
        },
    ]);

    res.json(eventAnalytics);
});

// Get rating-based analytics
export const getRatingAnalytics = asyncHandler(async (req, res) => {
    const topRatedEvents = await Event.find().sort({ rating: -1 }).limit(10);
    const topUsers = await User.find().sort({ avgRating: -1 }).limit(10);
  
    res.json({ topRatedEvents, topUsers });
  });

// Get analytics for user behavior
export const getUserActivityAnalytics = asyncHandler(async (req, res) => {
    const users = await User.find({}).select("interests location joinedAt");

    const activityAnalytics = users.reduce((acc, user) => {
        user.interests.forEach(category => {
            if (!acc[category]) acc[category] = 0;
            acc[category]++;
        });
        return acc;
    }, {});

    res.json(activityAnalytics);
});

// @desc    Get analytics data based on user activity
// @route   GET /api/analytics
// @access  Private/Admin
export const getUserAnalytics = asyncHandler(async (req, res) => {
    const analytics = await UserActivity.aggregate([
        {
            $group: {
                _id: "$event",
                views: {
                    $sum: { $cond: [{ $eq: ["$action", "viewed"] }, 1, 0] },
                },
                clicks: {
                    $sum: { $cond: [{ $eq: ["$action", "clicked"] }, 1, 0] },
                },
                registrations: {
                    $sum: { $cond: [{ $eq: ["$action", "registered"] }, 1, 0] },
                },
                likes: {
                    $sum: { $cond: [{ $eq: ["$action", "liked"] }, 1, 0] },
                },
            },
        },
    ]);

    res.json(analytics);
});

const getOrderAnalytics = asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const { startDate, endDate } = req.query;

    const business = await Business.findById(businessId);
    if (!business) {
        res.status(404);
        throw new Error('Business not found');
    }

    const matchCriteria = {
        business: businessId,
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    const analytics = await Order.aggregate([
        { $match: matchCriteria },
        {
            $group: {
                _id: null,
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' },
                averageOrderValue: { $avg: '$pricing.total' },
                totalItemsSold: { $sum: { $sum: '$items.quantity' } }
            }
        }
    ]);

    const result = analytics[0] || {
        totalOrders: 0,
        totalRevenue: 0,
        averageOrderValue: 0,
        totalItemsSold: 0
    };

    res.json({
        success: true,
        analytics: result
    });
});

const getOrderTrends = asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const { startDate, endDate, interval = 'day' } = req.query;

    const business = await Business.findById(businessId);
    if (!business) {
        res.status(404);
        throw new Error('Business not found');
    }

    const matchCriteria = {
        business: businessId,
        createdAt: {
            $gte: new Date(startDate),
            $lte: new Date(endDate)
        }
    };

    const trends = await Order.aggregate([
        { $match: matchCriteria },
        {
            $group: {
                _id: {
                    $dateToString: { format: `%Y-%m-%d`, date: '$createdAt' }
                },
                totalOrders: { $sum: 1 },
                totalRevenue: { $sum: '$pricing.total' }
            }
        },
        { $sort: { _id: 1 } }
    ]);

    res.json({
        success: true,
        trends
    });
});

export {
    getOrderAnalytics,
    getOrderTrends
};

  