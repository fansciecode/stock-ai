/**
 * Event Service
 * 
 * This service handles all event-related API calls and data management.
 * It's designed to match the functionality of the Android and iOS event services.
 */

class EventService {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || '/api';
    this.eventsEndpoint = `${this.apiBaseUrl}/events`;
  }

  /**
   * Get all events
   * @returns {Promise<Array>} - Array of events
   */
  async getEvents() {
    try {
      // In a real app, this would be an API call
      // For now, we'll return mock data
      return this.generateMockEvents();
    } catch (error) {
      console.error('Error fetching events:', error);
      throw error;
    }
  }

  /**
   * Get event details by ID
   * @param {string} eventId - Event ID
   * @returns {Promise<Object>} - Event details
   */
  async getEventDetails(eventId) {
    try {
      // In a real app, this would be an API call
      // For now, we'll return mock data
      const events = this.generateMockEvents();
      const event = events.find(event => event.id === eventId);
      
      if (!event) {
        throw new Error('Event not found');
      }
      
      return event;
    } catch (error) {
      console.error(`Error fetching event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Create a new event
   * @param {Object} eventData - Event data
   * @returns {Promise<Object>} - Created event
   */
  async createEvent(eventData) {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate creating an event
      const newEvent = {
        id: Math.random().toString(36).substring(2, 15),
        title: eventData.title,
        description: eventData.description,
        imageUrl: eventData.imageUrl || 'https://picsum.photos/800/400?random=new',
        startDate: eventData.startDate || new Date(),
        endDate: eventData.endDate || new Date(Date.now() + 86400000), // Tomorrow
        location: {
          address: eventData.address,
          coordinates: [eventData.longitude, eventData.latitude]
        },
        category: {
          id: eventData.categoryId,
          name: "Category",
          icon: "star"
        },
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      return newEvent;
    } catch (error) {
      console.error('Error creating event:', error);
      throw error;
    }
  }

  /**
   * Update an existing event
   * @param {string} eventId - Event ID
   * @param {Object} eventData - Updated event data
   * @returns {Promise<Object>} - Updated event
   */
  async updateEvent(eventId, eventData) {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate updating an event
      const events = this.generateMockEvents();
      const eventIndex = events.findIndex(event => event.id === eventId);
      
      if (eventIndex === -1) {
        throw new Error('Event not found');
      }
      
      const updatedEvent = {
        ...events[eventIndex],
        ...eventData,
        location: {
          address: eventData.address || events[eventIndex].location.address,
          coordinates: [
            eventData.longitude || events[eventIndex].location.coordinates[0],
            eventData.latitude || events[eventIndex].location.coordinates[1]
          ]
        },
        updatedAt: new Date()
      };
      
      return updatedEvent;
    } catch (error) {
      console.error(`Error updating event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Delete an event
   * @param {string} eventId - Event ID
   * @returns {Promise<boolean>} - Success status
   */
  async deleteEvent(eventId) {
    try {
      // In a real app, this would be an API call
      // For now, we'll simulate deleting an event
      return true;
    } catch (error) {
      console.error(`Error deleting event ${eventId}:`, error);
      throw error;
    }
  }

  /**
   * Search events by query
   * @param {string} query - Search query
   * @returns {Promise<Array>} - Filtered events
   */
  async searchEvents(query) {
    try {
      // In a real app, this would be an API call
      // For now, we'll filter mock data
      const events = this.generateMockEvents();
      const searchQuery = query.toLowerCase();
      
      return events.filter(event => 
        event.title.toLowerCase().includes(searchQuery) ||
        event.description.toLowerCase().includes(searchQuery) ||
        (event.location.address && event.location.address.toLowerCase().includes(searchQuery))
      );
    } catch (error) {
      console.error('Error searching events:', error);
      throw error;
    }
  }

  /**
   * Get events by category
   * @param {string} categoryId - Category ID
   * @returns {Promise<Array>} - Filtered events
   */
  async getEventsByCategory(categoryId) {
    try {
      // In a real app, this would be an API call
      // For now, we'll filter mock data
      const events = this.generateMockEvents();
      
      return events.filter(event => 
        event.category && event.category.id === categoryId
      );
    } catch (error) {
      console.error(`Error fetching events for category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock events for development
   * @returns {Array} - Array of mock events
   */
  generateMockEvents() {
    const categories = [
      { id: "1", name: "Music", icon: "music" },
      { id: "2", name: "Sports", icon: "football-ball" },
      { id: "3", name: "Food", icon: "utensils" },
      { id: "4", name: "Art", icon: "palette" },
      { id: "5", name: "Technology", icon: "laptop-code" },
      { id: "6", name: "Business", icon: "briefcase" }
    ];
    
    return [
      {
        id: "1",
        title: "Summer Music Festival",
        description: "Join us for an amazing experience with great music and food!",
        imageUrl: "https://picsum.photos/800/400?random=1",
        startDate: new Date(Date.now() + 86400000), // Tomorrow
        endDate: new Date(Date.now() + 172800000), // Day after tomorrow
        location: {
          address: "Central Park, New York",
          coordinates: [-73.965355, 40.782865]
        },
        category: categories[0],
        createdAt: new Date(Date.now() - 604800000), // 7 days ago
        updatedAt: new Date(Date.now() - 86400000) // 1 day ago
      },
      {
        id: "2",
        title: "Tech Conference 2023",
        description: "Learn about the latest technologies and network with professionals.",
        imageUrl: "https://picsum.photos/800/400?random=2",
        startDate: new Date(Date.now() + 259200000), // 3 days from now
        endDate: new Date(Date.now() + 345600000), // 4 days from now
        location: {
          address: "Moscone Center, San Francisco",
          coordinates: [-122.401557, 37.783909]
        },
        category: categories[4],
        createdAt: new Date(Date.now() - 1209600000), // 14 days ago
        updatedAt: new Date(Date.now() - 604800000) // 7 days ago
      },
      {
        id: "3",
        title: "Food Truck Festival",
        description: "Taste delicious food from the best food trucks in the city.",
        imageUrl: "https://picsum.photos/800/400?random=3",
        startDate: new Date(Date.now() + 432000000), // 5 days from now
        endDate: new Date(Date.now() + 518400000), // 6 days from now
        location: {
          address: "Riverside Park, Chicago",
          coordinates: [-87.637596, 41.878876]
        },
        category: categories[2],
        createdAt: new Date(Date.now() - 2592000000), // 30 days ago
        updatedAt: new Date(Date.now() - 1209600000) // 14 days ago
      },
      {
        id: "4",
        title: "Art Gallery Opening",
        description: "Discover amazing artworks from local and international artists.",
        imageUrl: "https://picsum.photos/800/400?random=4",
        startDate: new Date(Date.now() + 604800000), // 7 days from now
        endDate: new Date(Date.now() + 691200000), // 8 days from now
        location: {
          address: "Downtown Gallery, Los Angeles",
          coordinates: [-118.243683, 34.052235]
        },
        category: categories[3],
        createdAt: new Date(Date.now() - 3456000000), // 40 days ago
        updatedAt: new Date(Date.now() - 2592000000) // 30 days ago
      },
      {
        id: "5",
        title: "Business Networking",
        description: "Connect with business professionals and expand your network.",
        imageUrl: "https://picsum.photos/800/400?random=5",
        startDate: new Date(Date.now() + 777600000), // 9 days from now
        endDate: new Date(Date.now() + 864000000), // 10 days from now
        location: {
          address: "Business District, Boston",
          coordinates: [-71.060511, 42.358162]
        },
        category: categories[5],
        createdAt: new Date(Date.now() - 5184000000), // 60 days ago
        updatedAt: new Date(Date.now() - 3456000000) // 40 days ago
      },
      {
        id: "6",
        title: "Marathon Training",
        description: "Get ready for the marathon with professional training sessions.",
        imageUrl: "https://picsum.photos/800/400?random=6",
        startDate: new Date(Date.now() + 950400000), // 11 days from now
        endDate: new Date(Date.now() + 1036800000), // 12 days from now
        location: {
          address: "City Stadium, Miami",
          coordinates: [-80.219742, 25.958045]
        },
        category: categories[1],
        createdAt: new Date(Date.now() - 7776000000), // 90 days ago
        updatedAt: new Date(Date.now() - 5184000000) // 60 days ago
      }
    ];
  }
}

export default EventService;
