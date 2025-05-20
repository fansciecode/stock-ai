import axios from 'axios';
import { createLogger } from '../../utils/logger.js';
import NodeCache from 'node-cache';

const logger = createLogger('externalEventService');
const cache = new NodeCache({ stdTTL: process.env.EXTERNAL_EVENTS_CACHE_TTL || 3600 });

class ExternalEventService {
    constructor() {
        this.googleApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.googlePlacesBaseUrl = process.env.GOOGLE_PLACES_API_BASE_URL;
        
        // Category to Google Places type and keyword mapping
        this.categoryMapping = {
            // Sports & Recreation
            sports: {
                types: ['stadium', 'gym', 'park'],
                subcategories: {
                    racing: { keywords: ['racing track', 'motorsport', 'race course'] },
                    badminton: { keywords: ['badminton court', 'sports center'] },
                    horseRiding: { keywords: ['horse riding', 'equestrian', 'stable'] },
                    cycling: { keywords: ['cycling track', 'bicycle rental', 'bike trail'] },
                    onlineGaming: { keywords: ['gaming cafe', 'esports center'] },
                    football: { keywords: ['football ground', 'soccer field'] },
                    basketball: { keywords: ['basketball court'] },
                    swimming: { keywords: ['swimming pool', 'aquatic center'] },
                    cricket: { keywords: ['cricket ground', 'cricket stadium'] },
                    tennis: { keywords: ['tennis court'] },
                    adventureSports: { keywords: ['paragliding', 'bungee jumping', 'skydiving', 'adventure sports'] }
                }
            },

            // Cultural & Arts
            culture: {
                types: ['art_gallery', 'museum', 'painter'],
                subcategories: {
                    visualArts: { keywords: ['art gallery', 'exhibition', 'painting', 'sculpture'] },
                    dance: { keywords: ['dance studio', 'ballet', 'dance class'] },
                    music: { keywords: ['concert hall', 'live music', 'band'] },
                    literature: { keywords: ['library', 'book reading', 'poetry'] },
                    traditional: { keywords: ['cultural center', 'folk art', 'traditional'] }
                }
            },

            // Entertainment & Nightlife
            entertainment: {
                types: ['night_club', 'movie_theater', 'casino'],
                subcategories: {
                    comedy: { keywords: ['comedy club', 'stand up comedy'] },
                    movies: { keywords: ['cinema', 'movie screening'] },
                    theatre: { keywords: ['theatre', 'drama', 'performing arts'] },
                    musicFestival: { keywords: ['music festival', 'concert'] },
                    nightlife: { keywords: ['club', 'bar', 'nightlife'] },
                    djNights: { keywords: ['dj', 'party', 'nightclub'] }
                }
            },

            // Health & Fitness
            health: {
                types: ['gym', 'health', 'spa'],
                subcategories: {
                    gym: { keywords: ['gym', 'fitness center', 'personal training'] },
                    yoga: { keywords: ['yoga studio', 'meditation center'] },
                    martialArts: { keywords: ['martial arts', 'dojo', 'self defense'] },
                    crossfit: { keywords: ['crossfit', 'hiit', 'boot camp'] },
                    nutrition: { keywords: ['nutritionist', 'dietitian', 'health coach'] },
                    alternativeHealing: { keywords: ['ayurveda', 'reiki', 'holistic health'] }
                }
            },

            // Fashion & Beauty
            fashion: {
                types: ['beauty_salon', 'spa', 'shopping_mall'],
                subcategories: {
                    salon: { keywords: ['salon', 'haircut', 'beauty parlor'] },
                    spa: { keywords: ['spa', 'wellness center', 'massage'] },
                    fashion: { keywords: ['fashion store', 'boutique', 'clothing'] },
                    beauty: { keywords: ['beauty salon', 'makeup artist', 'cosmetics'] },
                    jewelry: { keywords: ['jewelry store', 'accessories'] }
                }
            },

            // Hospitality & Tourism
            hospitality: {
                types: ['lodging', 'travel_agency'],
                subcategories: {
                    hotels: { keywords: ['hotel', 'resort', 'accommodation'] },
                    guestHouses: { keywords: ['guest house', 'hostel', 'bnb'] },
                    travel: { keywords: ['travel agency', 'tour operator', 'tourist information'] },
                    transport: { keywords: ['airport shuttle', 'taxi service', 'car rental'] }
                }
            },

            // Food & Beverages
            food: {
                types: ['restaurant', 'cafe', 'bar'],
                subcategories: {
                    restaurants: { keywords: ['restaurant', 'dining'] },
                    foodFestivals: { keywords: ['food festival', 'food fair', 'tasting'] },
                    cookingClasses: { keywords: ['cooking class', 'culinary school'] },
                    localFood: { keywords: ['street food', 'food stall', 'local cuisine'] },
                    wineTasting: { keywords: ['wine tasting', 'brewery', 'wine bar'] }
                }
            },

            // Education & Professional
            education: {
                types: ['school', 'university', 'library'],
                subcategories: {
                    schools: { keywords: ['school', 'college', 'university'] },
                    courses: { keywords: ['training center', 'coaching', 'institute'] },
                    workshops: { keywords: ['workshop', 'seminar', 'conference'] },
                    professional: { keywords: ['business center', 'coworking space'] }
                }
            },

            // Services
            services: {
                types: ['store', 'point_of_interest'],
                subcategories: {
                    homeServices: { keywords: ['cleaning service', 'repair', 'maintenance'] },
                    petServices: { keywords: ['pet store', 'veterinary', 'pet grooming'] },
                    transport: { keywords: ['moving service', 'courier', 'logistics'] },
                    financial: { keywords: ['bank', 'loan service', 'financial advisor'] }
                }
            }
        };

        // Default event types for general searches
        this.defaultEventTypes = [
            'amusement_park', 'aquarium', 'art_gallery', 'museum',
            'night_club', 'park', 'restaurant', 'shopping_mall',
            'stadium', 'movie_theater', 'theater', 'tourist_attraction'
        ];
    }

    async searchByCategory(params) {
        const {
            latitude,
            longitude,
            radius = 5000,
            category,
            subcategory
        } = params;

        const cacheKey = `category_${latitude}_${longitude}_${radius}_${category}_${subcategory}`;
        const cachedResults = cache.get(cacheKey);
        if (cachedResults) {
            logger.info('Returning cached category results');
            return cachedResults;
        }

        try {
            let searchPromises = [];
            
            if (category && this.categoryMapping[category]) {
                const categoryConfig = this.categoryMapping[category];
                
                // If subcategory is specified
                if (subcategory && categoryConfig.subcategories[subcategory]) {
                    const keywords = categoryConfig.subcategories[subcategory].keywords;
                    searchPromises = keywords.map(keyword =>
                        this.searchPlaces({ latitude, longitude, radius, keyword })
                    );
                } else {
                    // Search all types and keywords for the category
                    searchPromises = [
                        ...categoryConfig.types.map(type =>
                            this.searchPlaces({ latitude, longitude, radius, type })
                        )
                    ];
                }
            }

            const responses = await Promise.all(searchPromises);
            const allResults = responses.flatMap(response => response || []);

            // Remove duplicates
            const uniqueResults = Array.from(
                new Map(allResults.map(item => [item.place_id, item])).values()
            );

            const formattedResults = this.formatGoogleResults(uniqueResults);
            cache.set(cacheKey, formattedResults);

            return formattedResults;
        } catch (error) {
            logger.error('Error in category search:', error);
            throw error;
        }
    }

    async searchPlaces(params) {
        const { latitude, longitude, radius, type, keyword } = params;
        try {
            const response = await axios.get(`${this.googlePlacesBaseUrl}/nearbysearch/json`, {
                params: {
                    location: `${latitude},${longitude}`,
                    radius,
                    type,
                    keyword,
                    key: this.googleApiKey
                }
            });
            return response.data.results;
        } catch (error) {
            logger.error('Error in places search:', error);
            return [];
        }
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
            const typesToSearch = type ? [type] : this.defaultEventTypes;
            
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
            responses.forEach((response, idx) => {
                logger.info(`Google API raw response [${idx}]:`, JSON.stringify(response.data));
            });
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
        const promises = this.defaultEventTypes.map(keyword =>
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
            type: result.types?.[0] || 'place',
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
            types: result.types,
            category: this.determineCategoryFromTypes(result.types)
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

    determineCategoryFromTypes(types) {
        if (!types) return 'other';
        
        const categoryMatches = Object.entries(this.categoryMapping)
            .find(([_, config]) => 
                config.types.some(type => types.includes(type))
            );

        return categoryMatches ? categoryMatches[0] : 'other';
    }
}

export default new ExternalEventService(); 