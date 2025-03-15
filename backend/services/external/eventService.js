import axios from 'axios';
import { createLogger } from '../../utils/logger.js';

const logger = createLogger('externalEventService');

class ExternalEventService {
    constructor() {
        this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googlePlacesBaseUrl = 'https://maps.googleapis.com/maps/api/place';
    }

    async searchNearbyEvents(params) {
        const {
            latitude,
            longitude,
            radius = 5000,
            type = 'event',
            keyword
        } = params;

        try {
            const url = `${this.googlePlacesBaseUrl}/nearbysearch/json`;
            const response = await axios.get(url, {
                params: {
                    location: `${latitude},${longitude}`,
                    radius,
                    type,
                    keyword,
                    key: this.googleApiKey
                }
            });

            logger.info(`Found ${response.data.results.length} nearby events`);
            return this.formatGoogleResults(response.data.results);
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

        try {
            // Combine results from multiple sources
            const [localOffers, onlineOffers] = await Promise.all([
                this.searchLocalOffers(params),
                this.searchOnlineOffers(category)
            ]);

            return {
                local: localOffers,
                online: onlineOffers
            };
        } catch (error) {
            logger.error('Error fetching offers:', error);
            throw error;
        }
    }

    async searchLocalOffers({ latitude, longitude, radius }) {
        const keywords = ['offer', 'discount', 'sale', 'deal'];
        const types = ['store', 'shopping_mall', 'restaurant', 'clothing_store', 'electronics_store'];
        
        try {
            const url = `${this.googlePlacesBaseUrl}/nearbysearch/json`;
            const response = await axios.get(url, {
                params: {
                    location: `${latitude},${longitude}`,
                    radius,
                    type: types.join('|'),
                    keyword: keywords.join('|'),
                    key: this.googleApiKey
                }
            });

            return this.formatGoogleResults(response.data.results);
        } catch (error) {
            logger.error('Error fetching local offers:', error);
            return [];
        }
    }

    async searchOnlineOffers(category) {
        // This would integrate with various e-commerce APIs
        // For now, returning mock data
        return [
            {
                source: 'amazon',
                title: 'Amazon Great Indian Sale',
                category: category || 'all',
                discountPercentage: '70%',
                validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
            },
            {
                source: 'flipkart',
                title: 'Flipkart Big Billion Days',
                category: category || 'all',
                discountPercentage: '80%',
                validUntil: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000)
            }
        ];
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