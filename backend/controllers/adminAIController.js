import { OpenAI } from 'openai';
import { createLogger } from '../utils/logger.js';
import { AppError } from '../middleware/errorMiddleware.js';
import { UserModel } from '../models/userModel.js';
import { OrderModel } from '../models/orderModel.js';
import { EventModel } from '../models/eventModel.js';
import { BusinessModel } from '../models/businessModel.js';
import  asyncHandler  from '../middleware/asyncHandler.js';

const logger = createLogger('adminAIController');
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// User Behavior Analysis
export const analyzeUserBehavior = asyncHandler(async (req, res) => {
    const userBehaviorData = await User.aggregate([
        {
            $lookup: {
                from: 'orders',
                localField: '_id',
                foreignField: 'user',
                as: 'orders'
            }
        },
        {
            $lookup: {
                from: 'events',
                localField: '_id',
                foreignField: 'attendees',
                as: 'attendedEvents'
            }
        },
        {
            $project: {
                _id: 1,
                email: 1,
                orderCount: { $size: '$orders' },
                eventCount: { $size: '$attendedEvents' },
                lastActive: 1,
                createdAt: 1
            }
        }
    ]);

    const analysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
            role: "system",
            content: "Analyze user behavior patterns and provide actionable insights"
        }, {
            role: "user",
            content: JSON.stringify(userBehaviorData)
        }]
    });

    res.json({
        success: true,
        analysis: analysis.choices[0].message.content,
        data: userBehaviorData
    });
});

// Fraud Detection
export const predictFraud = asyncHandler(async (req, res) => {
    const { transactionData } = req.body;
    
    if (!transactionData) {
        throw new AppError('Transaction data is required', 400);
    }

    // Implement fraud detection logic using historical patterns
    const fraudScore = await calculateFraudScore(transactionData);
    
    res.json({
        success: true,
        fraudScore,
        riskLevel: getFraudRiskLevel(fraudScore),
        recommendations: await generateFraudPreventionRecommendations(fraudScore)
    });
});

// Business Insights
export const generateInsights = asyncHandler(async (req, res) => {
    const [userStats, orderStats, eventStats] = await Promise.all([
        User.aggregate([
            {
                $group: {
                    _id: null,
                    totalUsers: { $sum: 1 },
                    activeUsers: {
                        $sum: {
                            $cond: [
                                { $gt: ["$lastActive", new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)] },
                                1,
                                0
                            ]
                        }
                    }
                }
            }
        ]),
        Order.aggregate([
            {
                $group: {
                    _id: null,
                    totalOrders: { $sum: 1 },
                    totalRevenue: { $sum: "$totalAmount" },
                    averageOrderValue: { $avg: "$totalAmount" }
                }
            }
        ]),
        Event.aggregate([
            {
                $group: {
                    _id: null,
                    totalEvents: { $sum: 1 },
                    averageAttendees: { $avg: { $size: "$attendees" } }
                }
            }
        ])
    ]);

    const insights = await generateAIInsights({
        userStats: userStats[0],
        orderStats: orderStats[0],
        eventStats: eventStats[0]
    });

    res.json({
        success: true,
        insights,
        stats: {
            users: userStats[0],
            orders: orderStats[0],
            events: eventStats[0]
        }
    });
});

// Price Optimization
export const optimizePricing = asyncHandler(async (req, res) => {
    const { eventId, marketData } = req.body;
    
    if (!eventId) {
        throw new AppError('Event ID is required', 400);
    }

    const event = await Event.findById(eventId);
    if (!event) {
        throw new AppError('Event not found', 404);
    }

    const optimizedPricing = await calculateOptimalPricing(event, marketData);
    
    res.json({
        success: true,
        currentPrice: event.price,
        recommendedPrice: optimizedPricing.recommendedPrice,
        priceRange: optimizedPricing.priceRange,
        confidence: optimizedPricing.confidence,
        factors: optimizedPricing.factors
    });
});

// Market Trend Analysis
export const analyzeMarketTrends = asyncHandler(async (req, res) => {
    const trends = await Event.aggregate([
        {
            $group: {
                _id: "$category",
                totalEvents: { $sum: 1 },
                averagePrice: { $avg: "$price" },
                totalRevenue: { $sum: { $multiply: ["$price", { $size: "$attendees" }] } }
            }
        },
        {
            $sort: { totalRevenue: -1 }
        }
    ]);

    const analysis = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
            role: "system",
            content: "Analyze market trends and provide strategic recommendations"
        }, {
            role: "user",
            content: JSON.stringify(trends)
        }]
    });

    res.json({
        success: true,
        trends,
        analysis: analysis.choices[0].message.content
    });
});

// Event Success Prediction
export const predictEventSuccess = asyncHandler(async (req, res) => {
    const { eventData } = req.body;
    
    if (!eventData) {
        throw new AppError('Event data is required', 400);
    }

    const prediction = await calculateEventSuccessProbability(eventData);
    
    res.json({
        success: true,
        prediction,
        recommendations: prediction.recommendations
    });
});

// Content Suggestions
export const generateContentSuggestions = asyncHandler(async (req, res) => {
    const { type, target, currentContent } = req.body;
    
    if (!type || !target) {
        throw new AppError('Content type and target are required', 400);
    }

    const suggestions = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [{
            role: "system",
            content: `Generate engaging content suggestions for ${type} targeting ${target}`
        }, {
            role: "user",
            content: currentContent || "Generate new content"
        }]
    });

    res.json({
        success: true,
        suggestions: suggestions.choices[0].message.content
    });
});

// Helper Functions
async function calculateFraudScore(transactionData) {
    // Implement fraud score calculation logic
    return 0.5; // Placeholder
}

function getFraudRiskLevel(score) {
    if (score < 0.2) return 'LOW';
    if (score < 0.6) return 'MEDIUM';
    return 'HIGH';
}

async function generateFraudPreventionRecommendations(score) {
    // Implement recommendation generation logic
    return ['Monitor closely', 'Verify user identity']; // Placeholder
}

async function calculateOptimalPricing(event, marketData) {
    // Implement pricing optimization logic
    return {
        recommendedPrice: event.price,
        priceRange: { min: event.price * 0.8, max: event.price * 1.2 },
        confidence: 0.8,
        factors: ['Market demand', 'Competition', 'Historical data']
    };
}

async function calculateEventSuccessProbability(eventData) {
    // Implement success probability calculation
    return {
        probability: 0.7,
        factors: ['Timing', 'Location', 'Price point'],
        recommendations: ['Optimize timing', 'Adjust marketing strategy']
    };
}

async function generateAIInsights(data) {
    // Implement insights generation logic
    return {
        trends: ['Growing user base', 'Increasing order value'],
        recommendations: ['Focus on user retention', 'Optimize pricing strategy']
    };
} 