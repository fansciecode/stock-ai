import axios from 'axios';

export class GeoService {
    constructor() {
        this.geocodingApiKey = process.env.GOOGLE_MAPS_API_KEY;
        this.baseUrl = 'https://maps.googleapis.com/maps/api';
    }

    async geocode(address) {
        try {
            const response = await axios.get(`${this.baseUrl}/geocode/json`, {
                params: {
                    address,
                    key: this.geocodingApiKey
                }
            });

            if (response.data.results.length > 0) {
                const location = response.data.results[0].geometry.location;
                return {
                    latitude: location.lat,
                    longitude: location.lng,
                    formattedAddress: response.data.results[0].formatted_address
                };
            }
            return null;
        } catch (error) {
            console.error('Geocoding error:', error);
            throw error;
        }
    }

    calculateDistance(point1, point2) {
        const R = 6371; // Earth's radius in kilometers
        const lat1 = this.toRadians(point1.latitude);
        const lat2 = this.toRadians(point2.latitude);
        const deltaLat = this.toRadians(point2.latitude - point1.latitude);
        const deltaLon = this.toRadians(point2.longitude - point1.longitude);

        const a = Math.sin(deltaLat/2) * Math.sin(deltaLat/2) +
                Math.cos(lat1) * Math.cos(lat2) *
                Math.sin(deltaLon/2) * Math.sin(deltaLon/2);
        const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
        return R * c;
    }

    async getNearbyPlaces(location, radius, type) {
        try {
            const response = await axios.get(`${this.baseUrl}/place/nearbysearch/json`, {
                params: {
                    location: `${location.latitude},${location.longitude}`,
                    radius,
                    type,
                    key: this.geocodingApiKey
                }
            });

            return response.data.results.map(place => ({
                id: place.place_id,
                name: place.name,
                location: place.geometry.location,
                address: place.vicinity,
                rating: place.rating,
                types: place.types
            }));
        } catch (error) {
            console.error('Nearby places error:', error);
            throw error;
        }
    }

    isPointInRadius(center, point, radiusKm) {
        const distance = this.calculateDistance(center, point);
        return distance <= radiusKm;
    }

    toRadians(degrees) {
        return degrees * (Math.PI/180);
    }

    createBoundingBox(center, radiusKm) {
        const R = 6371; // Earth's radius in kilometers
        const lat = this.toRadians(center.latitude);
        const lon = this.toRadians(center.longitude);
        const d = radiusKm/R;

        return {
            north: this.toDegrees(Math.asin(Math.sin(lat) * Math.cos(d) + Math.cos(lat) * Math.sin(d))),
            south: this.toDegrees(Math.asin(Math.sin(lat) * Math.cos(d) - Math.cos(lat) * Math.sin(d))),
            east: this.toDegrees(lon + Math.atan2(Math.sin(d) * Math.cos(lat), Math.cos(d))),
            west: this.toDegrees(lon - Math.atan2(Math.sin(d) * Math.cos(lat), Math.cos(d)))
        };
    }

    toDegrees(radians) {
        return radians * (180/Math.PI);
    }
}

export default new GeoService(); 