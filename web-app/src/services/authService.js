import api from "./api";

const authService = {
  login: async (email, password) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      return {
        success: true,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
        user: response.data.user,
      };
    } catch (error) {
      console.error("Login error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Login failed",
      };
    }
  },

  signup: async (userData) => {
    try {
      const response = await api.post("/auth/register", userData);
      return {
        success: true,
        message: "Account created successfully",
        user: response.data.user,
      };
    } catch (error) {
      console.error("Signup error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Signup failed",
      };
    }
  },

  logout: async () => {
    try {
      await api.post("/auth/logout");
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return { success: true };
    } catch (error) {
      console.error("Logout error:", error);
      // Clear tokens even if logout fails
      localStorage.removeItem("token");
      localStorage.removeItem("refreshToken");
      return { success: true };
    }
  },

  verifyToken: async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        return { success: false, message: "No token found" };
      }

      const response = await api.get("/auth/verify", {
        headers: { Authorization: `Bearer ${token}` },
      });

      return {
        success: true,
        user: response.data.user,
      };
    } catch (error) {
      console.error("Token verification error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Token verification failed",
      };
    }
  },

  refreshToken: async (refreshToken) => {
    try {
      const response = await api.post("/auth/refresh-token", { refreshToken });
      return {
        success: true,
        token: response.data.token,
        refreshToken: response.data.refreshToken,
      };
    } catch (error) {
      console.error("Token refresh error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Token refresh failed",
      };
    }
  },

  forgotPassword: async (email) => {
    try {
      const response = await api.post("/auth/forgot-password", { email });
      return {
        success: true,
        message: "Password reset email sent",
      };
    } catch (error) {
      console.error("Forgot password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to send reset email",
      };
    }
  },

  resetPassword: async (token, newPassword) => {
    try {
      const response = await api.post("/auth/reset-password", {
        token,
        newPassword,
      });
      return {
        success: true,
        message: "Password reset successfully",
      };
    } catch (error) {
      console.error("Reset password error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to reset password",
      };
    }
  },

  updateProfile: async (userData) => {
    try {
      const response = await api.put("/auth/profile", userData);
      return {
        success: true,
        user: response.data.user,
        message: "Profile updated successfully",
      };
    } catch (error) {
      console.error("Update profile error:", error);
      return {
        success: false,
        message: error.response?.data?.message || "Failed to update profile",
      };
    }
  },
};

export { authService };
