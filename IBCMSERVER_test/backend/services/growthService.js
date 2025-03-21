import { createLogger } from '../utils/logger.js';
import ExternalEventService from './external/eventService.js';

const logger = createLogger('growthService');

class GrowthService {
    constructor() {
        this.conversionTriggers = {
            viewThreshold: 3,
            searchThreshold: 2,
            offerClickThreshold: 1
        };
    }

    async generateLandingPageContent({ latitude, longitude, city }) {
        try {
            // Get events from external service
            const externalEvents = await ExternalEventService.searchNearbyEvents({
                latitude,
                longitude,
                radius: 5000
            });

            // Format the content
            return {
                highlights: {
                    trending: externalEvents.slice(0, 5),
                    featured: this.getFeaturedEvents(externalEvents),
                    thisWeekend: this.getWeekendEvents(externalEvents),
                    offers: await ExternalEventService.searchOffers({
                        latitude,
                        longitude,
                        radius: 5000
                    })
                },
                statistics: await this.getPlatformStats(),
                popularCategories: this.getPopularCategories(externalEvents)
            };
        } catch (error) {
            logger.error('Error generating landing page content:', error);
            throw error;
        }
    }

    async trackUserActivity(sessionId, activity) {
        try {
            // Log the activity
            logger.info('Tracking activity:', { sessionId, activity });

            // Check if we should show signup prompt
            const shouldPrompt = await this.checkConversionTriggers(sessionId);
            if (shouldPrompt) {
                return this.getPersonalizedPrompt(activity);
            }

            return null;
        } catch (error) {
            logger.error('Error tracking user activity:', error);
            throw error;
        }
    }

    generateShareContent(eventId) {
        try {
            // Get event details
            const event = {
                title: "Sample Event",
                category: "entertainment",
                location: "Mumbai"
            }; // This would actually come from your event service

            const shareLink = `${process.env.PLATFORM_URL || 'http://localhost:3000'}/e/${eventId}?ref=share`;
            
            return {
                whatsapp: {
                    text: `Check out ${event.title} and more events on ${process.env.PLATFORM_NAME || 'Our Platform'}! ${shareLink}`
                },
                twitter: {
                    text: `Discovered amazing ${event.category} events in ${event.location}! ${shareLink} #Events #${event.category}`,
                },
                facebook: {
                    quote: `Looking for ${event.category} events in ${event.location}? Check out ${event.title} and more!`,
                    hashtag: `#${event.category}Events`
                }
            };
        } catch (error) {
            logger.error('Error generating share content:', error);
            throw error;
        }
    }

    async trackShareActivity(shareData) {
        try {
            logger.info('Tracking share activity:', shareData);
            
            // This would actually track in your database
            return {
                shares: 1,
                views: 0,
                signups: 0
            };
        } catch (error) {
            logger.error('Error tracking share activity:', error);
            throw error;
        }
    }

    async generateSEOMetadata(page, data) {
        try {
            const baseMetadata = {
                title: `${process.env.PLATFORM_NAME || 'Our Platform'} - Discover Events`,
                description: "Find and explore local events, activities, and exclusive offers in your city.",
                keywords: ["events", "local events", "offers", "activities"]
            };

            switch (page) {
                case 'home':
                    return {
                        ...baseMetadata,
                        structuredData: {
                            "@context": "http://schema.org",
                            "@type": "WebSite",
                            "name": process.env.PLATFORM_NAME,
                            "url": process.env.PLATFORM_URL
                        }
                    };
                case 'event':
                    return {
                        title: `${data.title} in ${data.location} | ${process.env.PLATFORM_NAME}`,
                        description: `Get details about ${data.title} including date, venue, tickets, and similar events in ${data.location}.`,
                        keywords: [data.title, data.category, "events", data.location],
                        structuredData: {
                            "@context": "http://schema.org",
                            "@type": "Event",
                            "name": data.title,
                            "location": {
                                "@type": "Place",
                                "name": data.venue,
                                "address": data.location
                            }
                        }
                    };
                default:
                    return baseMetadata;
            }
        } catch (error) {
            logger.error('Error generating SEO metadata:', error);
            throw error;
        }
    }

    // Helper methods
    getFeaturedEvents(events) {
        return events
            .filter(event => event.rating >= 4.5)
            .slice(0, 3);
    }

    getWeekendEvents(events) {
        const now = new Date();
        const weekend = new Date(now);
        weekend.setDate(now.getDate() + (6 - now.getDay()));
        
        return events
            .filter(event => new Date(event.date) <= weekend)
            .slice(0, 5);
    }

    async getPlatformStats() {
        return {
            totalEvents: "1000+",
            activeOffers: "500+",
            cities: "50+",
            categories: "15+"
        };
    }

    getPopularCategories(events) {
        const categories = events.reduce((acc, event) => {
            if (!acc[event.category]) {
                acc[event.category] = 0;
            }
            acc[event.category]++;
            return acc;
        }, {});

        return Object.entries(categories)
            .map(([name, count]) => ({
                name,
                count,
                icon: `${name.toLowerCase()}_icon`
            }))
            .sort((a, b) => b.count - a.count)
            .slice(0, 5);
    }

    async checkConversionTriggers(sessionId) {
        // This would actually check against your database
        return true;
    }

    getPersonalizedPrompt(activity) {
        return {
            title: "Don't miss out!",
            message: activity.category 
                ? `Love ${activity.category}? Sign up to get notifications about upcoming ${activity.category} events!`
                : "Join our community to discover more events and offers!",
            benefits: [
                "Get personalized recommendations",
                "Save your favorite events",
                "Exclusive offers and early access",
                "Create and share your own events"
            ],
            cta: "Sign up now - it's free!"
        };
    }
}

export default new GrowthService(); 