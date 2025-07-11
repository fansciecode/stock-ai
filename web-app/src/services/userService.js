import api from "./api";

const userService = {
  getCurrentUser: async () => {
    try {
      const response = await api.get("/users/me");
      return response.data;
    } catch (error) {
      console.error("Get current user error:", error);
      throw error;
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put("/users/profile", userData);
      return response.data;
    } catch (error) {
      console.error("Update profile error:", error);
      throw error;
    }
  },

  updatePassword: async (passwords) => {
    try {
      const response = await api.put("/users/password", passwords);
      return response.data;
    } catch (error) {
      console.error("Update password error:", error);
      throw error;
    }
  },

  uploadAvatar: async (formData) => {
    try {
      const response = await api.post("/users/avatar", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });
      return response.data;
    } catch (error) {
      console.error("Upload avatar error:", error);
      throw error;
    }
  },

  getNotifications: async () => {
    try {
      const response = await api.get("/users/notifications");
      return response.data;
    } catch (error) {
      console.error("Get notifications error:", error);
      throw error;
    }
  },

  markNotificationRead: async (notificationId) => {
    try {
      const response = await api.put(
        `/users/notifications/${notificationId}/read`,
      );
      return response.data;
    } catch (error) {
      console.error("Mark notification read error:", error);
      throw error;
    }
  },

  getPreferences: async () => {
    try {
      const response = await api.get("/users/preferences");
      return response.data;
    } catch (error) {
      console.error("Get preferences error:", error);
      throw error;
    }
  },

  updatePreferences: async (preferences) => {
    try {
      const response = await api.put("/users/preferences", preferences);
      return response.data;
    } catch (error) {
      console.error("Update preferences error:", error);
      throw error;
    }
  },

  getUserEventLimit: async () => {
    try {
      const response = await api.get("/users/event-limit");
      return response.data;
    } catch (error) {
      console.error("Get user event limit error:", error);
      // Return mock data as fallback
      return {
        totalEvents: 5,
        usedEvents: 2,
        remainingEvents: 3,
        currentPlan: "Basic",
        planExpiry: new Date(
          Date.now() + 30 * 24 * 60 * 60 * 1000,
        ).toISOString(),
      };
    }
  },

  getEventUsageStats: async () => {
    try {
      const response = await api.get("/users/event-usage");
      return response.data;
    } catch (error) {
      console.error("Get event usage stats error:", error);
      // Return mock data as fallback
      return {
        monthlyUsage: [
          { month: "Jan", events: 1 },
          { month: "Feb", events: 0 },
          { month: "Mar", events: 1 },
          { month: "Apr", events: 0 },
        ],
        totalEvents: 5,
        usedEvents: 2,
        averageMonthlyUsage: 0.5,
      };
    }
  },

  checkEventCreationLimit: async () => {
    try {
      const response = await api.get("/users/can-create-event");
      return response.data;
    } catch (error) {
      console.error("Check event creation limit error:", error);
      // Return mock response as fallback
      return {
        canCreate: true,
        remainingEvents: 3,
        upgradeRequired: false,
      };
    }
  },
};

export { userService };
export default userService;
