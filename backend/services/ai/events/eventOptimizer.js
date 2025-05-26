import OpenAI from 'openai';
import { EventModel } from '../../../models/eventModel.js';
import { UserModel } from '../../../models/userModel.js';
import { BusinessModel } from '../../../models/businessModel.js';
import { TrendAnalyzerService } from '../analytics/trendAnalyzer.js';
import { DemandPredictorService } from '../analytics/demandPredictor.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class EventOptimizer {
    // Optimize event details based on type and creator
    async optimizeEventCreation(eventData, creatorType) {
        try {
            const baseOptimization = await this.getBaseOptimization(eventData);
            const typeSpecificOptimization = await this.getTypeSpecificOptimization(eventData, creatorType);
            
            return {
                ...baseOptimization,
                ...typeSpecificOptimization,
                suggestedParameters: await this.getSuggestedParameters(eventData, creatorType)
            };
        } catch (error) {
            console.error('Event optimization error:', error);
            throw error;
        }
    }

    // Get base optimization suggestions
    async getBaseOptimization(eventData) {
        const trends = await TrendAnalyzerService.analyzeEventTrends();
        const demand = await DemandPredictorService.predictEventDemand(eventData);

        return {
            timing: await this.optimizeEventTiming(eventData, trends),
            pricing: await this.optimizeEventPricing(eventData, demand),
            capacity: await this.suggestOptimalCapacity(eventData, demand),
            marketing: await this.generateMarketingRecommendations(eventData, trends)
        };
    }

    // Get type-specific optimization
    async getTypeSpecificOptimization(eventData, creatorType) {
        switch (creatorType) {
            case 'BUSINESS':
                return this.getBusinessEventOptimization(eventData);
            case 'USER':
                return this.getUserEventOptimization(eventData);
            default:
                return {};
        }
    }

    // Business-specific optimizations
    async getBusinessEventOptimization(eventData) {
        return {
            bookingStrategy: await this.optimizeBookingStrategy(eventData),
            inventoryManagement: await this.suggestInventoryManagement(eventData),
            staffingNeeds: await this.calculateStaffingNeeds(eventData),
            revenueProjections: await this.generateRevenueProjections(eventData),
            upsellOpportunities: await this.identifyUpsellOpportunities(eventData)
        };
    }

    // User-specific optimizations
    async getUserEventOptimization(eventData) {
        return {
            guestListOptimization: await this.optimizeGuestList(eventData),
            venueRecommendations: await this.suggestVenues(eventData),
            budgetPlanning: await this.optimizeBudget(eventData),
            timelineRecommendations: await this.suggestTimeline(eventData)
        };
    }

    // AI-powered parameter suggestions
    async getSuggestedParameters(eventData, creatorType) {
        const prompt = this.buildParameterSuggestionPrompt(eventData, creatorType);
        
        const response = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "You are an expert event planner. Suggest optimal parameters for event organization."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAISuggestions(response.choices[0].message.content);
    }

    // Helper methods for specific optimizations
    async optimizeEventTiming(eventData, trends) {
        const analysis = await openai.chat.completions.create({
            model: "gpt-3.5-turbo",
            messages: [{
                role: "system",
                content: "Analyze optimal timing for an event based on historical data and trends."
            }, {
                role: "user",
                content: JSON.stringify({ event: eventData, trends })
            }]
        });

        return {
            suggestedDates: this.extractDateSuggestions(analysis.choices[0].message.content),
            peakAttendanceTimes: this.extractPeakTimes(analysis.choices[0].message.content),
            seasonalFactors: this.extractSeasonalFactors(analysis.choices[0].message.content)
        };
    }

    async optimizeEventPricing(eventData, demand) {
        return {
            basePrice: this.calculateBasePrice(eventData, demand),
            tieredPricing: this.generateTieredPricing(eventData),
            earlyBirdDiscount: this.calculateEarlyBirdDiscount(eventData),
            groupDiscounts: this.suggestGroupDiscounts(eventData)
        };
    }

    async suggestOptimalCapacity(eventData, demand) {
        return {
            recommendedCapacity: this.calculateRecommendedCapacity(demand),
            scalingOptions: this.generateScalingOptions(eventData),
            spaceUtilization: this.optimizeSpaceUtilization(eventData)
        };
    }

    async generateMarketingRecommendations(eventData, trends) {
        return {
            targetAudience: this.identifyTargetAudience(eventData, trends),
            marketingChannels: this.suggestMarketingChannels(eventData),
            promotionalStrategy: this.createPromotionalStrategy(eventData),
            contentSuggestions: this.generateContentSuggestions(eventData)
        };
    }

    // Business-specific helper methods
    async optimizeBookingStrategy(eventData) {
        return {
            bookingTimeframes: this.suggestBookingTimeframes(eventData),
            cancellationPolicy: this.recommendCancellationPolicy(eventData),
            overbookingBuffer: this.calculateOverbookingBuffer(eventData)
        };
    }

    async suggestInventoryManagement(eventData) {
        return {
            requiredInventory: this.calculateRequiredInventory(eventData),
            restockingPoints: this.determineRestockingPoints(eventData),
            supplierRecommendations: this.suggestSuppliers(eventData)
        };
    }

    // User-specific helper methods
    async optimizeGuestList(eventData) {
        return {
            recommendedSize: this.calculateRecommendedGuestCount(eventData),
            guestGrouping: this.suggestGuestGrouping(eventData),
            seatingArrangements: this.optimizeSeating(eventData)
        };
    }

    async suggestVenues(eventData) {
        return {
            venueType: this.recommendVenueType(eventData),
            spaceRequirements: this.calculateSpaceRequirements(eventData),
            amenities: this.suggestRequiredAmenities(eventData)
        };
    }

    // Utility methods
    buildParameterSuggestionPrompt(eventData, creatorType) {
        return `Analyze and suggest optimal parameters for a ${creatorType} event with the following details: ${JSON.stringify(eventData)}. 
                Consider factors like target audience, venue requirements, timing, pricing, and specific ${creatorType.toLowerCase()} needs.`;
    }

    parseAISuggestions(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            return this.structureTextSuggestions(content);
        }
    }

    structureTextSuggestions(text) {
        // Convert unstructured AI response to structured format
        const sections = text.split('\n\n');
        return sections.reduce((acc, section) => {
            const [key, ...values] = section.split('\n');
            acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = values.join('\n');
            return acc;
        }, {});
    }
}

export default new EventOptimizer(); 