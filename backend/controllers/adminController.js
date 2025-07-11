import { asyncHandler } from '../middleware/asyncHandler.js';
import { UserModel } from '../models/userModel.js';
import { EventModel } from '../models/eventModel.js';
import { OrderModel } from '../models/orderModel.js';
import { BusinessModel } from '../models/businessModel.js';
import { createLogger } from '../utils/logger.js';

const logger = createLogger('adminController');

// Get admin dashboard statistics
export const getDashboardStats = asyncHandler(async (req, res) => {
    const [userStats, eventStats, orderStats, businessStats] = await Promise.all([
        UserModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    newUsers: {
                        $sum: {
                            $cond: [
                                { $gt: ["$createdAt", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        EventModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    activeEvents: {
                        $sum: {
                            $cond: [
                                { $gt: ["$date", new Date()] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        OrderModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" }
                }
            }
        ]),
        BusinessModel.aggregate([
            {
                $group: {
                    _id: null,
                    totalBusinesses: { $sum: 1 },
                    pendingVerification: {
                        $sum: {
                            $cond: [
                                { $eq: ["$verificationStatus", "pending"] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ])
    ]);

    res.json({
        success: true,
        stats: {
            users: userStats[0] || { totalUsers: 0, newUsers: 0 },
            events: eventStats[0] || { totalEvents: 0, activeEvents: 0 },
            orders: orderStats[0] || { totalOrders: 0, totalRevenue: 0 },
            businesses: businessStats[0] || { totalBusinesses: 0, pendingVerification: 0 }
        }
    });
});

// Get pending business verifications
export const getPendingVerifications = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    
    const pendingBusinesses = await BusinessModel.find({ verificationStatus: 'pending' })
        .populate('owner', 'name email')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
    
    const count = await BusinessModel.countDocuments({ verificationStatus: 'pending' });
    
    res.json({
        success: true,
        businesses: pendingBusinesses,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    });
});

// Update business verification status
export const updateVerificationStatus = asyncHandler(async (req, res) => {
    const { businessId } = req.params;
    const { status, notes } = req.body;
    
    if (!['approved', 'rejected', 'pending'].includes(status)) {
        return res.status(400).json({
            success: false,
            message: 'Invalid status value'
        });
    }
    
    const business = await BusinessModel.findByIdAndUpdate(
        businessId,
        {
            verificationStatus: status,
            verificationNotes: notes,
            verifiedAt: status === 'approved' ? new Date() : null,
            verifiedBy: status === 'approved' ? req.user._id : null
        },
        { new: true }
    );
    
    if (!business) {
        return res.status(404).json({
            success: false,
            message: 'Business not found'
        });
    }
    
    res.json({
        success: true,
        business
    });
});

// Get system health status
export const getSystemHealth = asyncHandler(async (req, res) => {
    // This would typically integrate with monitoring services
    // For now, we'll return placeholder data
    
    res.json({
        success: true,
        status: 'healthy',
        metrics: {
            cpuUsage: Math.random() * 100,
            memoryUsage: Math.random() * 100,
            diskUsage: Math.random() * 100,
            responseTime: Math.random() * 500,
            activeConnections: Math.floor(Math.random() * 1000)
        },
        lastChecked: new Date()
    });
});

// Get user management data
export const getUserManagement = asyncHandler(async (req, res) => {
    const { page = 1, limit = 10, search = '' } = req.query;
    
    const query = search 
        ? { 
            $or: [
                { name: { $regex: search, $options: 'i' } },
                { email: { $regex: search, $options: 'i' } }
            ] 
        } 
        : {};
    
    const users = await UserModel.find(query)
        .select('-password')
        .limit(limit * 1)
        .skip((page - 1) * limit)
        .sort({ createdAt: -1 });
    
    const count = await UserModel.countDocuments(query);
    
    res.json({
        success: true,
        users,
        totalPages: Math.ceil(count / limit),
        currentPage: page
    });
});

export default {
    getDashboardStats,
    getPendingVerifications,
    updateVerificationStatus,
    getSystemHealth,
    getUserManagement
}; 