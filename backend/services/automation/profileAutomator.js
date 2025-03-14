import OpenAI from 'openai';
import { UserModel } from '../../models/userModel.js';
import { BusinessModel } from '../../models/businessModel.js';
import axios from 'axios';

const openai = new OpenAI({
    apiKey: process.env.OPENAI_API_KEY
});

export class ProfileAutomator {
    constructor() {
        this.googlePlacesApiKey = process.env.GOOGLE_PLACES_API_KEY;
    }

    // Auto-generate user profile
    async generateUserProfile(basicInfo) {
        try {
            const { name, email, interests = [] } = basicInfo;

            // Generate personalized profile elements
            const profileSuggestions = await this.generateProfileSuggestions(basicInfo);

            // Generate interests and preferences
            const expandedInterests = await this.expandUserInterests(interests);

            // Generate social media handles
            const socialHandles = await this.generateSocialHandles(name);

            return {
                ...basicInfo,
                ...profileSuggestions,
                interests: expandedInterests,
                socialMedia: socialHandles,
                preferences: await this.generateUserPreferences(expandedInterests)
            };
        } catch (error) {
            console.error('Profile generation error:', error);
            throw error;
        }
    }

    // Auto-generate business profile
    async generateBusinessProfile(basicInfo) {
        try {
            const { name, location, type } = basicInfo;

            // Fetch business details from Google Places API
            const placeDetails = await this.fetchBusinessDetails(name, location);

            // Generate business description and tags
            const businessContent = await this.generateBusinessContent(placeDetails, type);

            // Generate social media strategy
            const socialStrategy = await this.generateSocialStrategy(businessContent);

            return {
                ...basicInfo,
                ...placeDetails,
                ...businessContent,
                socialStrategy,
                operatingHours: placeDetails.opening_hours || await this.suggestOperatingHours(type),
                policies: await this.generateBusinessPolicies(type),
                eventCapabilities: await this.assessEventCapabilities(placeDetails)
            };
        } catch (error) {
            console.error('Business profile generation error:', error);
            throw error;
        }
    }

    // Auto-fill event details from location
    async autoFillEventFromLocation(location) {
        try {
            // Fetch location details
            const locationDetails = await this.fetchLocationDetails(location);

            // Generate venue-specific event suggestions
            const venueSuggestions = await this.generateVenueSuggestions(locationDetails);

            return {
                venue: locationDetails,
                suggestedEvents: venueSuggestions.eventTypes,
                capacity: venueSuggestions.capacity,
                facilities: locationDetails.amenities || [],
                accessibility: locationDetails.accessibility || {},
                parkingInfo: locationDetails.parking || {},
                nearbyAttractions: await this.findNearbyAttractions(location),
                transportOptions: await this.getTransportOptions(location)
            };
        } catch (error) {
            console.error('Location auto-fill error:', error);
            throw error;
        }
    }

    // Helper methods
    async generateProfileSuggestions(basicInfo) {
        const prompt = `Generate profile suggestions for a user named ${basicInfo.name} 
                       with interests in ${basicInfo.interests.join(', ')}.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in user profiling and personalization."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async expandUserInterests(interests) {
        const prompt = `Expand and suggest related interests for: ${interests.join(', ')}`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in user interest analysis and recommendations."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async generateSocialHandles(name) {
        // Generate social media handle suggestions based on name
        const cleanName = name.toLowerCase().replace(/[^a-z0-9]/g, '');
        return {
            twitter: `@${cleanName}`,
            instagram: `${cleanName}`,
            linkedin: `in/${cleanName}`,
            suggested: [
                `${cleanName}_events`,
                `${cleanName}.official`,
                `${cleanName}_social`
            ]
        };
    }

    async generateBusinessContent(placeDetails, type) {
        const prompt = `Generate business profile content for ${placeDetails.name}, 
                       a ${type} business. Include description, tags, and unique features.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in business branding and content creation."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async fetchBusinessDetails(name, location) {
        try {
            const query = encodeURIComponent(`${name} ${location}`);
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/textsearch/json?query=${query}&key=${this.googlePlacesApiKey}`
            );

            if (response.data.results.length > 0) {
                const placeId = response.data.results[0].place_id;
                const detailsResponse = await axios.get(
                    `https://maps.googleapis.com/maps/api/place/details/json?place_id=${placeId}&key=${this.googlePlacesApiKey}`
                );

                return detailsResponse.data.result;
            }
            return null;
        } catch (error) {
            console.error('Error fetching business details:', error);
            return null;
        }
    }

    async generateVenueSuggestions(locationDetails) {
        const prompt = `Suggest event types and capacity for venue: ${locationDetails.name}. 
                       Consider size, facilities, and location type.`;

        const response = await openai.chat.completions.create({
            model: "gpt-4",
            messages: [{
                role: "system",
                content: "You are an expert in venue assessment and event planning."
            }, {
                role: "user",
                content: prompt
            }]
        });

        return this.parseAIResponse(response.choices[0].message.content);
    }

    async findNearbyAttractions(location) {
        try {
            const [lat, lng] = location.coordinates;
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1500&type=tourist_attraction&key=${this.googlePlacesApiKey}`
            );

            return response.data.results.map(place => ({
                name: place.name,
                rating: place.rating,
                distance: this.calculateDistance(location.coordinates, [place.geometry.location.lat, place.geometry.location.lng])
            }));
        } catch (error) {
            console.error('Error finding nearby attractions:', error);
            return [];
        }
    }

    async getTransportOptions(location) {
        try {
            const [lat, lng] = location.coordinates;
            const response = await axios.get(
                `https://maps.googleapis.com/maps/api/place/nearbysearch/json?location=${lat},${lng}&radius=1000&type=transit_station&key=${this.googlePlacesApiKey}`
            );

            return {
                publicTransit: response.data.results.map(station => ({
                    name: station.name,
                    type: station.types[0],
                    distance: this.calculateDistance(location.coordinates, [station.geometry.location.lat, station.geometry.location.lng])
                })),
                parking: await this.checkParkingAvailability(location),
                rideshare: true
            };
        } catch (error) {
            console.error('Error getting transport options:', error);
            return {};
        }
    }

    // Utility methods
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

    calculateDistance(coord1, coord2) {
        const [lat1, lon1] = coord1;
        const [lat2, lon2] = coord2;
        const R = 6371; // Earth's radius in km
        const dLat = (lat2 - lat1) * Math.PI / 180;
        const dLon = (lon2 - lon1) * Math.PI / 180;
        const a = 
            Math.sin(dLat/2) * Math.sin(dLat/2) +
            Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
            Math.sin(dLon/2) * Math.sin(dLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }
}

export default new ProfileAutomator(); 