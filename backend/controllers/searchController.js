import { EventModel } from "../models/eventModel.js";
import { UserModel } from "../models/userModel.js";
import { BusinessModel } from "../models/businessModel.js";
import SearchAnalytics from "../services/analyticsService.js";
import RecommendationEngine from "../services/aiService.js";
import { OpenAIService } from "../services/openAiService.js";
import { PredictiveService } from "../services/predictiveService.js";
import { SearchLearningService } from '../services/ai/learningServices/searchLearningService.js';
import { UserLearningService } from '../services/ai/learningServices/userLearningService.js';
import asyncHandler from 'express-async-handler';

export const searchHandler = async (req, res) => {
  try {
    const {
      query,
      location,
      sortByTime,
      category,
      page = 1,
      limit = 20
    } = req.query;

    // Get user interests if user is logged in
    let userInterests = [];
    if (req.user) {
      const user = await User.findById(req.user._id).populate("interests");
      userInterests = user.interests.map((c) => c._id);
    }

    // Build event filter
    const eventFilter = {};

    // Text search
    if (query) {
      eventFilter.$or = [
        { title: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } }
      ];
    }

    // Location handling
    if (location) {
      // Check if location is coordinates or city name
      if (typeof location === 'object' && location.latitude && location.longitude) {
        eventFilter.location = {
          $geoWithin: {
            $centerSphere: [
              [parseFloat(location.longitude), parseFloat(location.latitude)],
              location.radius / 6371 || 20 / 6371
            ]
          }
        };
      } else if (typeof location === 'string') {
        eventFilter['location.city'] = { $regex: location, $options: "i" };
      } else {
        eventFilter.location = location;
      }
    }

    // Category filtering
    if (category) {
      eventFilter.category = category;
    } else if (userInterests.length > 0) {
      eventFilter.category = { $in: userInterests };
    }

    // Only show future events
    eventFilter.date = { $gte: new Date() };

    // Get events with pagination
    let events = await EventModel.find(eventFilter)
      .skip((page - 1) * limit)
      .limit(limit);

    // Get businesses
    let businesses = query ? 
      await BusinessModel.find({ 
        name: { $regex: query, $options: "i" }
      }).limit(limit) : [];

    // Sort events if needed
    if (sortByTime === "upcoming") {
      events.sort((a, b) => new Date(a.date) - new Date(b.date));
    } else if (sortByTime === "recent") {
      events.sort((a, b) => new Date(b.date) - new Date(a.date));
    }

    // Get total counts
    const totalEvents = await EventModel.countDocuments(eventFilter);
    const totalBusinesses = query ? 
      await BusinessModel.countDocuments({ 
        name: { $regex: query, $options: "i" }
      }) : 0;

    res.json({
      success: true,
      data: {
        events,
        businesses,
        pagination: {
          page: parseInt(page),
          limit: parseInt(limit),
          totalEvents,
          totalBusinesses,
          hasMore: (page * limit) < totalEvents
        },
        filters: {
          applied: {
            query,
            location,
            sortByTime,
            category
          }
        }
      }
    });

  } catch (error) {
    res.status(500).json({ 
      success: false, 
      message: "Server error", 
      error: error.message 
    });
  }
};

// @desc    Enhanced Search with AI Learning
// @route   POST /api/search
// @access  Private
const enhancedSearch = asyncHandler(async (req, res) => {
    try {
        const { query, filters } = req.body;
        const userId = req.user._id;

        // 1. Track user search behavior
        await UserLearningService.trackBehavior(userId, {
            type: 'search',
            query,
            filters,
            timestamp: new Date()
        });

        // 2. Get user preferences
        const userPreferences = await UserLearningService.getUserPreferences(userId);

        // 3. Get optimized search results
        const optimizedResults = await SearchLearningService.getOptimizedResults(
            userId,
            query,
            filters,
            userPreferences
        );

        // 4. Track search success
        if (optimizedResults && optimizedResults.length > 0) {
            await SearchLearningService.improveResults(userId, query, optimizedResults[0]);
        }

        res.json({
            success: true,
            data: {
                results: optimizedResults,
                userContext: userPreferences
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get User Search Insights
// @route   GET /api/search/insights
// @access  Private
const getSearchInsights = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const insights = await SearchLearningService.getSearchInsights(userId);
        
        res.json({
            success: true,
            data: insights
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get Search History with Analysis
// @route   GET /api/search/history
// @access  Private
const getSearchHistory = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const history = await SearchLearningService.getSearchHistory(userId);
        
        res.json({
            success: true,
            data: history
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

// @desc    Get Personalized Search Suggestions
// @route   GET /api/search/suggestions
// @access  Private
const getSearchSuggestions = asyncHandler(async (req, res) => {
    try {
        const userId = req.user._id;
        const suggestions = await SearchLearningService.getPersonalizedSuggestions(userId);
        
        res.json({
            success: true,
            data: suggestions
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: error.message
        });
    }
});

export {
    enhancedSearch,
    getSearchInsights,
    getSearchHistory,
    getSearchSuggestions
};

const searchController = {
    search: async (req, res) => {
        try {
            const { query, filters } = req.body;
            const userId = req.user._id;

            // Use SearchAnalytics
            await SearchAnalytics.trackSearchQuery(userId, query, filters);
            
            // Rest of your search logic
        } catch (error) {
            // Error handling
        }
    }
};

export default searchController;
