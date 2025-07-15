import axios from 'axios';
import { EventModel } from '../../../models/eventModel.js';
import { EventOptimizer } from './eventOptimizer.js';
import { TrendAnalyzerService } from '../analytics/trendAnalyzer.js';

const AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
const AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';

export class EventAutoGenerator {
    constructor() {
        this.eventOptimizer = new EventOptimizer();
    }

    // Generate complete event from minimal input
    async generateFromMinimalInput(basicInfo) {
        try {
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
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/generate-event-details`, basicInfo, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Event details generation error:', error);
            return basicInfo; // fallback
        }
    }

    // Generate ticketing structure (unchanged)
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
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/generate-inventory`, eventDetails, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Inventory requirements generation error:', error);
            return { essentials: [], autoReorderThresholds: {}, suppliers: [], qrCodeEnabled: true, batchTracking: true };
        }
    }

    // Generate marketing materials
    async generateMarketingMaterials(eventDetails) {
        try {
            const response = await axios.post(`${AI_SERVICE_URL}/generate-marketing`, eventDetails, {
                headers: { 'X-API-KEY': AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Marketing materials generation error:', error);
            return { socialMedia: [], emailTemplates: [], promotionalOffers: [] };
        }
    }

    // Helper methods (unchanged)
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