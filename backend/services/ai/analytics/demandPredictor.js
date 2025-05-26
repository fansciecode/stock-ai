import OpenAI from 'openai';
import { OrderModel } from '../../../models/orderModel.js';
import { EventModel } from '../../../models/eventModel.js';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY is not set in environment variables');
}

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class DemandPredictor {
    // ... class implementation
}

export const DemandPredictorService = {
    predictEventDemand: async (eventId) => {
        try {
            // Fetch the event by ID
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');
            // Gather historical data
            const historicalData = await EventModel.find({
                category: event.category,
                date: { $lt: new Date() }
            }).select('attendance price location date');

            // Analyze patterns using OpenAI
            const analysis = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Analyze event attendance patterns and predict demand"
                }, {
                    role: "user",
                    content: JSON.stringify(historicalData)
                }]
            });

            return {
                predictedAttendance: analysis.choices[0].message.content,
                confidence: analysis.choices[0].finish_reason === 'stop' ? 1 : 0.5,
                historicalTrends: await analyzeTrends(historicalData)
            };
        } catch (error) {
            console.error('Demand prediction error:', error);
            return null;
        }
    },

    predictProductDemand: async (productId) => {
        try {
            const orderHistory = await OrderModel.find({
                'orderItems.product': productId
            }).select('createdAt quantity totalAmount');

            // Generate demand forecast
            return {
                dailyDemand: await calculateDailyDemand(orderHistory),
                weeklyTrend: await calculateWeeklyTrend(orderHistory),
                seasonalFactors: await analyzeSeasonality(orderHistory)
            };
        } catch (error) {
            console.error('Product demand prediction error:', error);
            return null;
        }
    }
};

// backend/services/ai/analytics/sentimentAnalyzer.js
export const SentimentAnalyzerService = {
    analyzeReview: async (reviewText) => {
        try {
            const analysis = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "Analyze review sentiment and provide detailed feedback"
                }, {
                    role: "user",
                    content: reviewText
                }]
            });

            return {
                sentiment: extractSentiment(analysis.choices[0].message.content),
                score: calculateSentimentScore(analysis.choices[0].message.content),
                keywords: extractKeywords(reviewText),
                isSpam: await checkForSpam(reviewText)
            };
        } catch (error) {
            console.error('Sentiment analysis error:', error);
            return null;
        }
    },

    analyzeBulkReviews: async (reviews) => {
        try {
            const results = await Promise.all(
                reviews.map(review => SentimentAnalyzerService.analyzeReview(review))
            );

            return {
                overallSentiment: calculateAverageSentiment(results),
                detailedAnalysis: results,
                commonThemes: extractCommonThemes(results)
            };
        } catch (error) {
            console.error('Bulk review analysis error:', error);
            return null;
        }
    }
};

// backend/services/ai/analytics/trendAnalyzer.js
export const TrendAnalyzerService = {
    analyzeEventTrends: async () => {
        try {
            const events = await EventModel.find({})
                .select('category attendance price location date reviews')
                .populate('reviews');

            return {
                popularCategories: await identifyPopularCategories(events),
                priceRanges: await analyzePriceRanges(events),
                locationHotspots: await identifyPopularLocations(events),
                timePatterns: await analyzeTimePatterns(events)
            };
        } catch (error) {
            console.error('Event trend analysis error:', error);
            return null;
        }
    },

    analyzeSearchTrends: async () => {
        try {
            const searchLogs = await SearchLog.find({})
                .sort('-createdAt')
                .limit(1000);

            return {
                popularSearches: extractPopularSearches(searchLogs),
                risingTerms: identifyRisingTerms(searchLogs),
                categoryTrends: analyzeCategoryTrends(searchLogs)
            };
        } catch (error) {
            console.error('Search trend analysis error:', error);
            return null;
        }
    }
};
