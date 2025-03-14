import asyncHandler from "express-async-handler";
import { EventModel } from "../models/eventModel.js";
import { UserModel } from "../models/userModel.js";
import Subscription from "../models/subscriptionModel.js"; 

// Get rating-based analytics for admin dashboard
export const getAdminRatingAnalytics = asyncHandler(async (req, res) => {
    const eventAnalytics = await Event.aggregate([
        {
            $group: {
                _id: "$category",
                avgRating: { $avg: "$rating" },
                totalReviews: { $sum: "$numReviews" },
            },
        },
    ]);

    const userCount = await User.countDocuments();

    res.json({ eventAnalytics, totalUsers: userCount });
});
export const getSubscriptionStats = async (req, res) => {
    try {
      const totalSubscriptions = await Subscription.countDocuments();
      const dailyPlans = await Subscription.countDocuments({ planType: "daily" });
      const monthlyPlans = await Subscription.countDocuments({ planType: "monthly" });
      const yearlyPlans = await Subscription.countDocuments({ planType: "yearly" });
  
      const totalRevenue = await Subscription.aggregate([
        { $group: { _id: null, total: { $sum: "$price" } } },
      ]);
  
      res.json({
        totalSubscriptions,
        dailyPlans,
        monthlyPlans,
        yearlyPlans,
        totalRevenue: totalRevenue[0]?.total || 0,
      });
    } catch (error) {
      res.status(500).json({ message: "Error fetching subscription stats" });
    }
  };