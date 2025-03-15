import axios from 'axios';
import { createLogger } from '../../utils/logger.js';
import NodeCache from 'node-cache';

const logger = createLogger('externalEventService');
const cache = new NodeCache({ stdTTL: process.env.EXTERNAL_EVENTS_CACHE_TTL || 3600 });

class ExternalEventService {
    constructor() {
        this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googlePlacesBaseUrl = process.env.GOOGLE_PLACES_API_BASE_URL;
        this.eventTypes = [
            'amusement_park', 'aquarium', 'art_gallery', 'museum',
            'night_club', 'park', 'restaurant', 'shopping_mall',
            'stadium', 'movie_theater', 'theater', 'tourist_attraction'
        ];
        this.offerKeywords = ['discount', 'sale', 'offer', 'deal', 'promotion'];
    }

    async searchNearbyEvents(params) {
        const {
            latitude,
            longitude,
            radius = 5000,
            type,
            keyword
        } = params;

        const cacheKey = `events_${latitude}_${longitude}_${radius}_${type}_${keyword}`;
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            logger.info('Returning cached events');
            return cachedResults;
        }

        try {
            const promises = [];
            
            // Search for specific type if provided, otherwise search all event types
            const typesToSearch = type ? [type] : this.eventTypes;
            
            for (const eventType of typesToSearch) {
                promises.push(
                    axios.get(`${this.googlePlacesBaseUrl}/nearbysearch/json`, {
                        params: {
                            location: `${latitude},${longitude}`,
                            radius,
                            type: eventType,
                            keyword,
                            key: this.googleApiKey
                        }
                    })
                );
            }

            const responses = await Promise.all(promises);
            const allResults = responses.flatMap(response => 
                response.data.results || []
            );

            // Remove duplicates based on place_id
            const uniqueResults = Array.from(
                new Map(allResults.map(item => [item.place_id, item])).values()
            );

            const formattedResults = this.formatGoogleResults(uniqueResults);
            cache.set(cacheKey, formattedResults);

            logger.info(`Found ${formattedResults.length} unique nearby events`);
            return formattedResults;
        } catch (error) {
            logger.error('Error fetching Google events:', error);
            throw error;
        }
    }

    async getEventDetails(placeId) {
        try {
            const url = `${this.googlePlacesBaseUrl}/details/json`;
            const response = await axios.get(url, {
                params: {
                    place_id: placeId,
                    fields: 'name,formatted_address,geometry,rating,user_ratings_total,photos,price_level,opening_hours,types',
                    key: this.googleApiKey
                }
            });

            return this.formatGoogleDetails(response.data.result);
        } catch (error) {
            logger.error('Error fetching place details:', error);
            throw error;
        }
    }

    async searchOffers(params) {
        const {
            latitude,
            longitude,
            radius = 5000,
            category
        } = params;

        const cacheKey = `offers_${latitude}_${longitude}_${radius}_${category}`;
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            logger.info('Returning cached offers');
            return cachedResults;
        }

        try {
            const [localOffers, onlineOffers, eventOffers] = await Promise.all([
                this.searchLocalOffers(params),
                this.searchOnlineOffers(category),
                this.searchEventOffers(params)
            ]);

            const results = {
                local: localOffers,
                online: onlineOffers,
                events: eventOffers
            };

            cache.set(cacheKey, results);
            return results;
        } catch (error) {
            logger.error('Error fetching offers:', error);
            throw error;
        }
    }

    async searchLocalOffers({ latitude, longitude, radius }) {
        const promises = this.offerKeywords.map(keyword =>
            axios.get(`${this.googlePlacesBaseUrl}/nearbysearch/json`, {
                params: {
                    location: `${latitude},${longitude}`,
                    radius,
                    keyword,
                    key: this.googleApiKey
                }
            })
        );

        try {
            const responses = await Promise.all(promises);
            const allResults = responses.flatMap(response => 
                response.data.results || []
            );

            // Remove duplicates and format
            const uniqueResults = Array.from(
                new Map(allResults.map(item => [item.place_id, item])).values()
            );

            return this.formatGoogleResults(uniqueResults);
        } catch (error) {
            logger.error('Error fetching local offers:', error);
            return [];
        }
    }

    async searchEventOffers(params) {
        const { latitude, longitude, radius } = params;
        const eventKeywords = ['festival', 'concert', 'exhibition', 'show'];

        try {
            const promises = eventKeywords.map(keyword =>
                axios.get(`${this.googlePlacesBaseUrl}/nearbysearch/json`, {
                    params: {
                        location: `${latitude},${longitude}`,
                        radius,
                        keyword,
                        key: this.googleApiKey
                    }
                })
            );

            const responses = await Promise.all(promises);
            const allResults = responses.flatMap(response => 
                response.data.results || []
            );

            // Remove duplicates and format
            const uniqueResults = Array.from(
                new Map(allResults.map(item => [item.place_id, item])).values()
            );

            return this.formatGoogleResults(uniqueResults);
        } catch (error) {
            logger.error('Error fetching event offers:', error);
            return [];
        }
    }

    async searchOnlineOffers(category) {
        // In a production environment, this would integrate with:
        // 1. E-commerce APIs (Amazon, Flipkart)
        // 2. Deal aggregator APIs
        // 3. Affiliate networks
        // For now, returning structured mock data
        const mockOffers = {
            shopping: [
                {
                    source: 'amazon',
                    title: 'Amazon Great Indian Sale',
                    category: 'shopping',
                    discountPercentage: 70,
                    validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000),
                    couponCode: 'SHOP70',
                    terms: ['Min purchase: ₹1000', 'Valid on select items']
                }
            ],
            food: [
                {
                    source: 'swiggy',
                    title: 'First Order Discount',
                    category: 'food',
                    discountPercentage: 50,
                    validUntil: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
                    couponCode: 'FIRST50',
                    terms: ['Max discount: ₹150', 'Valid for new users']
                }
            ],
            entertainment: [
                {
                    source: 'bookmyshow',
                    title: 'Weekend Movie Offer',
                    category: 'entertainment',
                    discountPercentage: 25,
                    validUntil: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000),
                    couponCode: 'WEEKEND25',
                    terms: ['Valid on movie tickets', 'Max 4 tickets per user']
                }
            ]
        };

        return category ? mockOffers[category] || [] : Object.values(mockOffers).flat();
    }

    formatGoogleResults(results) {
        return results.map(result => ({
            id: result.place_id,
            source: 'google',
            type: 'local_event',
            title: result.name,
            address: result.vicinity,
            location: {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng
            },
            rating: result.rating,
            totalRatings: result.user_ratings_total,
            photos: result.photos?.map(photo => photo.photo_reference),
            priceLevel: result.price_level,
            openNow: result.opening_hours?.open_now,
            types: result.types
        }));
    }

    formatGoogleDetails(result) {
        return {
            id: result.place_id,
            source: 'google',
            name: result.name,
            address: result.formatted_address,
            location: {
                latitude: result.geometry.location.lat,
                longitude: result.geometry.location.lng
            },
            rating: result.rating,
            totalRatings: result.user_ratings_total,
            photos: result.photos?.map(photo => photo.photo_reference),
            priceLevel: result.price_level,
            openingHours: result.opening_hours,
            types: result.types
        };
    }
}

export default new ExternalEventService(); 