import api from "./api";

class EventService {
  // Get all events with pagination and filters
  async getEvents(page = 1, limit = 10, filters = {}) {
    try {
      const response = await api.get("/events", {
        params: { page, limit, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching events:", error);
      throw error;
    }
  }

  // Get single event by ID
  async getEventById(eventId) {
    try {
      const response = await api.get(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error fetching event:", error);
      throw error;
    }
  }

  // Create new event
  async createEvent(eventData) {
    try {
      const response = await api.post("/events", eventData);
      return response.data;
    } catch (error) {
      console.error("Error creating event:", error);
      throw error;
    }
  }

  // Update existing event
  async updateEvent(eventId, eventData) {
    try {
      const response = await api.put(`/events/${eventId}`, eventData);
      return response.data;
    } catch (error) {
      console.error("Error updating event:", error);
      throw error;
    }
  }

  // Delete event
  async deleteEvent(eventId) {
    try {
      const response = await api.delete(`/events/${eventId}`);
      return response.data;
    } catch (error) {
      console.error("Error deleting event:", error);
      throw error;
    }
  }

  // Search events
  async searchEvents(query, filters = {}) {
    try {
      const response = await api.get("/events/search", {
        params: { q: query, ...filters },
      });
      return response.data;
    } catch (error) {
      console.error("Error searching events:", error);
      throw error;
    }
  }

  // Get events by category
  async getEventsByCategory(categoryId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/events/category/${categoryId}`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching events by category:", error);
      throw error;
    }
  }

  // Get user's attending events
  async getAttendingEvents() {
    try {
      const response = await api.get("/events/user/attending");
      return response.data;
    } catch (error) {
      console.error("Error fetching attending events:", error);
      throw error;
    }
  }

  // Get user's created events
  async getCreatedEvents() {
    try {
      const response = await api.get("/events/user/created");
      return response.data;
    } catch (error) {
      console.error("Error fetching created events:", error);
      throw error;
    }
  }

  // Book event ticket
  async bookEvent(eventId, bookingData) {
    try {
      const response = await api.post(
        `/events/${eventId}/book`,
        bookingData,
      );
      return response.data;
    } catch (error) {
      console.error("Error booking event:", error);
      throw error;
    }
  }

  // Cancel event booking
  async cancelBooking(eventId, bookingId) {
    try {
      const response = await api.delete(
        `/events/${eventId}/booking/${bookingId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error canceling booking:", error);
      throw error;
    }
  }

  // Join event (for free events)
  async joinEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/join`);
      return response.data;
    } catch (error) {
      console.error("Error joining event:", error);
      throw error;
    }
  }

  // Leave event
  async leaveEvent(eventId) {
    try {
      const response = await api.post(`/events/${eventId}/leave`);
      return response.data;
    } catch (error) {
      console.error("Error leaving event:", error);
      throw error;
    }
  }

  // Get event reviews
  async getEventReviews(eventId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/events/${eventId}/reviews`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching event reviews:", error);
      throw error;
    }
  }

  // Add event review
  async addEventReview(eventId, reviewData) {
    try {
      const response = await api.post(
        `/events/${eventId}/reviews`,
        reviewData,
      );
      return response.data;
    } catch (error) {
      console.error("Error adding event review:", error);
      throw error;
    }
  }

  // Update event review
  async updateEventReview(eventId, reviewId, reviewData) {
    try {
      const response = await api.put(
        `/events/${eventId}/reviews/${reviewId}`,
        reviewData,
      );
      return response.data;
    } catch (error) {
      console.error("Error updating event review:", error);
      throw error;
    }
  }

  // Delete event review
  async deleteEventReview(eventId, reviewId) {
    try {
      const response = await api.delete(
        `/events/${eventId}/reviews/${reviewId}`,
      );
      return response.data;
    } catch (error) {
      console.error("Error deleting event review:", error);
      throw error;
    }
  }

  // Mark review as helpful
  async markReviewHelpful(eventId, reviewId) {
    try {
      const response = await api.post(
        `/events/${eventId}/reviews/${reviewId}/helpful`,
      );
      return response.data;
    } catch (error) {
      console.error("Error marking review as helpful:", error);
      throw error;
    }
  }

  // Report event review
  async reportEventReview(eventId, reviewId, reportData) {
    try {
      const response = await api.post(
        `/events/${eventId}/reviews/${reviewId}/report`,
        reportData,
      );
      return response.data;
    } catch (error) {
      console.error("Error reporting event review:", error);
      throw error;
    }
  }

  // Get event analytics
  async getEventAnalytics(eventId) {
    try {
      const response = await api.get(`/events/${eventId}/analytics`);
      return response.data;
    } catch (error) {
      console.error("Error fetching event analytics:", error);
      throw error;
    }
  }

  // Upload event media
  async uploadEventMedia(eventId, mediaFiles) {
    try {
      const formData = new FormData();

      if (Array.isArray(mediaFiles)) {
        mediaFiles.forEach((file) => {
          formData.append("media", file);
        });
      } else {
        formData.append("media", mediaFiles);
      }

      const response = await api.put(
        `/events/${eventId}/media`,
        formData,
        {
          headers: {
            "Content-Type": "multipart/form-data",
          },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error uploading event media:", error);
      throw error;
    }
  }

  // Add event products
  async addEventProducts(eventId, products) {
    try {
      const response = await api.put(`/events/${eventId}/products`, {
        products,
      });
      return response.data;
    } catch (error) {
      console.error("Error adding event products:", error);
      throw error;
    }
  }

  // Get event attendees
  async getEventAttendees(eventId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/events/${eventId}/attendees`, {
        params: { page, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching event attendees:", error);
      throw error;
    }
  }

  // Create optimized event with AI
  async createOptimizedEvent(eventData) {
    try {
      const response = await api.post(
        "/events/create-optimized",
        eventData,
      );
      return response.data;
    } catch (error) {
      console.error("Error creating optimized event:", error);
      throw error;
    }
  }

  // Get event optimizations
  async getEventOptimizations(eventData) {
    try {
      const response = await api.post("/events/optimize", eventData);
      return response.data;
    } catch (error) {
      console.error("Error getting event optimizations:", error);
      throw error;
    }
  }

  // Auto-generate event
  async autoGenerateEvent(basicData) {
    try {
      const response = await api.post(
        "/events/auto-generate",
        basicData,
      );
      return response.data;
    } catch (error) {
      console.error("Error auto-generating event:", error);
      throw error;
    }
  }

  // Get featured events
  async getFeaturedEvents(limit = 10) {
    try {
      const response = await api.get("/events/featured", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching featured events:", error);
      throw error;
    }
  }

  // Get trending events
  async getTrendingEvents(period = "week", limit = 10) {
    try {
      const response = await api.get("/events/trending", {
        params: { period, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching trending events:", error);
      throw error;
    }
  }

  // Get nearby events
  async getNearbyEvents(latitude, longitude, radius = 10, limit = 10) {
    try {
      const response = await api.get("/events/nearby", {
        params: { lat: latitude, lng: longitude, radius, limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching nearby events:", error);
      throw error;
    }
  }

  // Get event suggestions
  async getEventSuggestions(limit = 10) {
    try {
      const response = await api.get("/events/suggestions", {
        params: { limit },
      });
      return response.data;
    } catch (error) {
      console.error("Error fetching event suggestions:", error);
      throw error;
    }
  }

  // Share event
  async shareEvent(eventId, shareData) {
    try {
      const response = await api.post(
        `/events/${eventId}/share`,
        shareData,
      );
      return response.data;
    } catch (error) {
      console.error("Error sharing event:", error);
      throw error;
    }
  }

  // Report event
  async reportEvent(eventId, reportData) {
    try {
      const response = await api.post(
        `/events/${eventId}/report`,
        reportData,
      );
      return response.data;
    } catch (error) {
      console.error("Error reporting event:", error);
      throw error;
    }
  }

  // Follow event organizer
  async followOrganizer(organizerId) {
    try {
      const response = await api.post(
        `/events/organizer/${organizerId}/follow`,
      );
      return response.data;
    } catch (error) {
      console.error("Error following organizer:", error);
      throw error;
    }
  }

  // Unfollow event organizer
  async unfollowOrganizer(organizerId) {
    try {
      const response = await api.delete(
        `/events/organizer/${organizerId}/follow`,
      );
      return response.data;
    } catch (error) {
      console.error("Error unfollowing organizer:", error);
      throw error;
    }
  }

  // Get organizer's events
  async getOrganizerEvents(organizerId, page = 1, limit = 10) {
    try {
      const response = await api.get(
        `/events/organizer/${organizerId}`,
        {
          params: { page, limit },
        },
      );
      return response.data;
    } catch (error) {
      console.error("Error fetching organizer events:", error);
      throw error;
    }
  }

  // Utility functions
  formatEventDate(dateString) {
    const date = new Date(dateString);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  }

  formatEventDuration(startDate, endDate) {
    const start = new Date(startDate);
    const end = new Date(endDate);
    const duration = end - start;

    const hours = Math.floor(duration / (1000 * 60 * 60));
    const minutes = Math.floor((duration % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    }
    return `${minutes}m`;
  }

  formatEventPrice(price, currency = "INR") {
    if (price === 0) return "Free";
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: currency,
    }).format(price);
  }

  getEventStatus(event) {
    const now = new Date();
    const startDate = new Date(event.startDate);
    const endDate = new Date(event.endDate);

    if (now < startDate) return "upcoming";
    if (now >= startDate && now <= endDate) return "ongoing";
    if (now > endDate) return "completed";
    return "unknown";
  }

  getEventTypeIcon(eventType) {
    const iconMap = {
      informative: "📖",
      booking: "🎫",
      product: "🛍️",
      service: "⚙️",
      workshop: "🛠️",
      conference: "🎤",
      webinar: "💻",
      meetup: "👥",
      party: "🎉",
      festival: "🎊",
      exhibition: "🖼️",
      competition: "🏆",
      charity: "❤️",
      sports: "⚽",
      music: "🎵",
      art: "🎨",
      food: "🍽️",
      technology: "💻",
      business: "💼",
      health: "🏥",
      education: "🎓",
    };
    return iconMap[eventType] || "📅";
  }

  // Event type constants
  static EVENT_TYPES = {
    INFORMATIVE: "informative",
    BOOKING: "booking",
    PRODUCT: "product",
    SERVICE: "service",
    WORKSHOP: "workshop",
    CONFERENCE: "conference",
    WEBINAR: "webinar",
    MEETUP: "meetup",
    PARTY: "party",
    FESTIVAL: "festival",
    EXHIBITION: "exhibition",
    COMPETITION: "competition",
    CHARITY: "charity",
  };

  // Event status constants
  static EVENT_STATUS = {
    DRAFT: "draft",
    PUBLISHED: "published",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    ARCHIVED: "archived",
  };

  // Event visibility constants
  static EVENT_VISIBILITY = {
    PUBLIC: "public",
    PRIVATE: "private",
    MEMBERS_ONLY: "members_only",
  };

  // Booking status constants
  static BOOKING_STATUS = {
    PENDING: "pending",
    CONFIRMED: "confirmed",
    CANCELLED: "cancelled",
    COMPLETED: "completed",
    REFUNDED: "refunded",
  };
}

const eventService = new EventService();

export { eventService };
export default eventService;
