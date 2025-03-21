import OpenAI from 'openai';
import { EventModel } from '../../../models/eventModel.js';
import { EventOptimizer } from './eventOptimizer.js';
import { TrendAnalyzerService } from '../analytics/trendAnalyzer.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class EventAutoGenerator {
    constructor() {
        this.eventOptimizer = new EventOptimizer();
    }

    // Generate complete event from minimal input
    async generateFromMinimalInput(basicInfo) {
        try {
            const { eventType, title, expectedAttendance } = basicInfo;
            
            // Generate complete event details using AI
            const eventDetails = await this.generateEventDetails(basicInfo);
            
            // Get optimizations
            const optimizations = await this.eventOptimizer.optimizeEventCreation(
                eventDetails,
                basicInfo.creatorType || 'USER'
            );

            // Generate ticketing structure
            const ticketing = await this.generateTicketingStructure(eventDetails, optimizations);

            // Generate inventory requirements
            const inventory = await this.generateInventoryRequirements(eventDetails, optimizations);

            return {
                eventDetails: {
                    ...eventDetails,
                    ...optimizations.suggestedParameters
                },
                ticketing,
                inventory,
                marketingMaterials: await this.generateMarketingMaterials(eventDetails)
            };
        } catch (error) {
            console.error('Event auto-generation error:', error);
            throw error;
        }
    }

    // Generate complete event details from basic info
    async generateEventDetails(basicInfo) {
        const prompt = `Generate comprehensive event details for a ${basicInfo.eventType} event titled "${basicInfo.title}" 
                       with expected attendance of ${basicInfo.expectedAttendance}. Include venue suggestions, 
                       timing, pricing strategy, and required resources.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert event planner. Generate detailed event specifications."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseEventDetails(response.choices[0].message.content);
    }

    // Generate ticketing structure
    async generateTicketingStructure(eventDetails, optimizations) {
        const basePrice = optimizations.pricing?.basePrice || 0;
        
        return {
            ticketTypes: [
                {
                    name: 'Early Bird',
                    price: basePrice * 0.8,
                    quantity: Math.floor(eventDetails.expectedAttendance * 0.3),
                    validUntil: this.calculateEarlyBirdDeadline(eventDetails.date)
                },
                {
                    name: 'Regular',
                    price: basePrice,
                    quantity: Math.floor(eventDetails.expectedAttendance * 0.5)
                },
                {
                    name: 'VIP',
                    price: basePrice * 1.5,
                    quantity: Math.floor(eventDetails.expectedAttendance * 0.2),
                    benefits: ['Priority seating', 'Exclusive access', 'Complimentary refreshments']
                }
            ],
            groupDiscounts: {
                enabled: true,
                minGroupSize: 5,
                discountPercentage: 10
            },
            autoScaling: {
                enabled: true,
                thresholds: {
                    increasePrice: 0.75, // 75% sold
                    decreasePrice: 0.25  // 25% sold
                }
            }
        };
    }

    // Generate inventory requirements
    async generateInventoryRequirements(eventDetails, optimizations) {
        const inventoryPrompt = `Generate inventory requirements for a ${eventDetails.eventType} event 
                               with ${eventDetails.expectedAttendance} attendees. Consider essentials, 
                               merchandise, and consumables.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an inventory management expert. Generate detailed inventory requirements."
            }, {
                role: "user",
                content: inventoryPrompt
            }]
        });

        return {
            essentials: this.parseInventoryList(response.choices[0].message.content),
            autoReorderThresholds: this.calculateReorderThresholds(eventDetails),
            suppliers: await this.suggestSuppliers(eventDetails),
            qrCodeEnabled: true,
            batchTracking: true
        };
    }

    // Generate marketing materials
    async generateMarketingMaterials(eventDetails) {
        const marketingPrompt = `Create marketing content for ${eventDetails.title}. 
                               Include social media posts, email templates, and promotional offers.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are a marketing expert. Generate engaging marketing content."
            }, {
                role: "user",
                content: marketingPrompt
            }]
        });

        return {
            socialMedia: this.parseSocialMediaContent(response.choices[0].message.content),
            emailTemplates: this.parseEmailTemplates(response.choices[0].message.content),
            promotionalOffers: this.parsePromotionalOffers(response.choices[0].message.content)
        };
    }

    // Helper methods
    parseEventDetails(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            // If not valid JSON, structure the text response
            const sections = content.split('\n\n');
            return sections.reduce((acc, section) => {
                const [key, ...values] = section.split('\n');
                acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = values.join('\n');
                return acc;
            }, {});
        }
    }

    calculateEarlyBirdDeadline(eventDate) {
        const date = new Date(eventDate);
        date.setDate(date.getDate() - 30); // 30 days before event
        return date;
    }

    parseInventoryList(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            return this.structureInventoryText(content);
        }
    }

    calculateReorderThresholds(eventDetails) {
        return {
            critical: Math.ceil(eventDetails.expectedAttendance * 0.1),
            warning: Math.ceil(eventDetails.expectedAttendance * 0.25),
            optimal: Math.ceil(eventDetails.expectedAttendance * 0.5)
        };
    }

    async suggestSuppliers(eventDetails) {
        // This would typically integrate with a supplier database
        return [
            { type: 'Merchandise', suggestions: ['Supplier A', 'Supplier B'] },
            { type: 'Refreshments', suggestions: ['Supplier C', 'Supplier D'] },
            { type: 'Equipment', suggestions: ['Supplier E', 'Supplier F'] }
        ];
    }

    parseSocialMediaContent(content) {
        const lines = content.split('\n');
        return {
            twitter: lines.filter(l => l.includes('#') || l.length <= 280),
            facebook: lines.filter(l => l.length > 50),
            instagram: lines.filter(l => l.includes('#') && l.length <= 2200)
        };
    }

    parseEmailTemplates(content) {
        return {
            announcement: this.extractSection(content, 'Announcement'),
            reminder: this.extractSection(content, 'Reminder'),
            followUp: this.extractSection(content, 'Follow-up')
        };
    }

    parsePromotionalOffers(content) {
        return content.match(/\b\d+%\s+off\b/g) || [];
    }

    extractSection(content, sectionName) {
        const regex = new RegExp(`${sectionName}:([\\s\\S]*?)(?=\\n\\n|$)`);
        const match = content.match(regex);
        return match ? match[1].trim() : '';
    }

    structureInventoryText(text) {
        const categories = ['Essentials', 'Merchandise', 'Consumables'];
        return categories.reduce((acc, category) => {
            const regex = new RegExp(`${category}:([\\s\\S]*?)(?=\\n\\n|$)`);
            const match = text.match(regex);
            acc[category.toLowerCase()] = match ? 
                match[1].trim().split('\n').map(item => item.trim()) : 
                [];
            return acc;
        }, {});
    }
}

export default new EventAutoGenerator(); 