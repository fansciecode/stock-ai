import OpenAI from 'openai';
import { EventModel } from '../../models/eventModel.js';
import { UserModel } from '../../models/userModel.js';
import { sendEmail } from '../emailService.js';
import { TrendAnalyzerService } from '../ai/analytics/trendAnalyzer.js';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class WorkflowAutomator {
    constructor() {
        this.reminderIntervals = {
            eventStart: [7, 3, 1], // days before event
            ticketingSales: [14, 7, 3], // days before early bird deadline
            inventoryCheck: [14, 7, 3], // days before event
        };
    }

    // Automated Attendee Management
    async autoManageAttendees(eventId) {
        try {
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                seatingArrangement: await this.generateSeatingPlan(event),
                checkInSystem: await this.setupCheckInSystem(event),
                waitlistManagement: await this.manageWaitlist(event),
                guestCommunications: await this.setupAutomatedCommunications(event)
            };
        } catch (error) {
            console.error('Attendee management automation error:', error);
            throw error;
        }
    }

    // Automated Venue Management
    async autoManageVenue(eventId) {
        try {
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                layoutOptimization: await this.optimizeVenueLayout(event),
                equipmentScheduling: await this.scheduleEquipment(event),
                staffingPlan: await this.generateStaffingPlan(event),
                setupChecklist: await this.createSetupChecklist(event)
            };
        } catch (error) {
            console.error('Venue management automation error:', error);
            throw error;
        }
    }

    // Automated Schedule Management
    async autoManageSchedule(eventId) {
        try {
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                timeline: await this.generateEventTimeline(event),
                speakerScheduling: await this.scheduleSpeakers(event),
                activityCoordination: await this.coordinateActivities(event),
                breakScheduling: await this.optimizeBreaks(event)
            };
        } catch (error) {
            console.error('Schedule automation error:', error);
            throw error;
        }
    }

    // Automated Communication System
    async setupAutomatedCommunications(event) {
        return {
            attendeeUpdates: await this.generateAttendeeUpdates(event),
            reminderSystem: await this.setupReminderSystem(event),
            feedbackCollection: await this.setupFeedbackSystem(event),
            emergencyAlerts: await this.configureEmergencyAlerts(event)
        };
    }

    // Automated Budget Management
    async autoManageBudget(eventId) {
        try {
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                expenseTracking: await this.setupExpenseTracking(event),
                revenueProjections: await this.generateRevenueProjections(event),
                budgetAlerts: await this.configureBudgetAlerts(event),
                costOptimization: await this.optimizeCosts(event)
            };
        } catch (error) {
            console.error('Budget automation error:', error);
            throw error;
        }
    }

    // Automated Risk Management
    async autoManageRisks(eventId) {
        try {
            const event = await EventModel.findById(eventId);
            if (!event) throw new Error('Event not found');

            return {
                riskAssessment: await this.assessEventRisks(event),
                contingencyPlans: await this.generateContingencyPlans(event),
                insuranceRecommendations: await this.recommendInsurance(event),
                safetyProtocols: await this.establishSafetyProtocols(event)
            };
        } catch (error) {
            console.error('Risk management automation error:', error);
            throw error;
        }
    }

    // Helper Methods
    async generateSeatingPlan(event) {
        const prompt = `Generate an optimal seating arrangement for ${event.expectedAttendance} attendees 
                       at a ${event.eventType} event, considering social distancing and group preferences.`;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in event planning and space optimization."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async setupCheckInSystem(event) {
        return {
            qrCodeGeneration: true,
            contactlessCheckIn: true,
            healthScreening: event.requiresHealthCheck,
            attendeeTracking: {
                enabled: true,
                metrics: ['arrival_time', 'session_attendance', 'engagement_level']
            }
        };
    }

    async manageWaitlist(event) {
        return {
            autoNotification: true,
            prioritySystem: this.generatePrioritySystem(event),
            capacityAdjustment: true,
            upgradeOffers: this.generateUpgradeOffers(event)
        };
    }

    async optimizeVenueLayout(event) {
        const prompt = `Optimize venue layout for ${event.eventType} with ${event.expectedAttendance} attendees. 
                       Consider traffic flow, social distancing, and activity zones.`;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in venue optimization and space planning."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async generateEventTimeline(event) {
        const prompt = `Create a detailed timeline for ${event.eventType} including setup, 
                       main activities, breaks, and cleanup. Consider ${event.expectedAttendance} attendees.`;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert event scheduler and timeline planner."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async setupExpenseTracking(event) {
        return {
            categories: this.generateExpenseCategories(event),
            budgetLimits: this.calculateBudgetLimits(event),
            alertThresholds: {
                warning: 0.8, // 80% of budget
                critical: 0.95 // 95% of budget
            },
            autoApprovalLimits: this.calculateApprovalLimits(event)
        };
    }

    async assessEventRisks(event) {
        const prompt = `Assess potential risks for ${event.eventType} with ${event.expectedAttendance} attendees. 
                       Consider health, safety, financial, and operational risks.`;
        
        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in event risk assessment and management."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    // Utility Methods
    parseAIResponse(content) {
        try {
            return JSON.parse(content);
        } catch (error) {
            return this.structureTextResponse(content);
        }
    }

    structureTextResponse(text) {
        const sections = text.split('\n\n');
        return sections.reduce((acc, section) => {
            const [key, ...values] = section.split('\n');
            acc[key.toLowerCase().replace(/[^a-z0-9]/g, '')] = values.join('\n');
            return acc;
        }, {});
    }

    generatePrioritySystem(event) {
        return {
            criteria: ['registration_time', 'user_history', 'group_size'],
            weights: {
                registration_time: 0.4,
                user_history: 0.3,
                group_size: 0.3
            }
        };
    }

    calculateBudgetLimits(event) {
        const baseAmount = event.expectedAttendance * event.ticketing.basePrice;
        return {
            total: baseAmount,
            categories: {
                venue: baseAmount * 0.3,
                catering: baseAmount * 0.2,
                marketing: baseAmount * 0.15,
                staff: baseAmount * 0.15,
                miscellaneous: baseAmount * 0.2
            }
        };
    }
}

export default new WorkflowAutomator(); 