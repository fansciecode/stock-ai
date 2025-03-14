import api from './api';
import { fetchData } from './api';

const authService = {
  login: (credentials) => fetchData("/users/login", { method: "POST", body: JSON.stringify(credentials) }),
  register: (userData) => fetchData("/users/register", { method: "POST", body: JSON.stringify(userData) }),
  getCurrentUser: () => fetchData("/users/me"),
};

class AuthService {
  static async resetPassword(token, newPassword) {
    try {
      const response = await api.post('/auth/reset-password', {
        token,
        newPassword
      });
      return response.data;
    } catch (error) {
      throw error;
    }
  }

  static async forgotPassword(email) {
    try {
      const response = await api.post('/auth/forgot-password', { email });
      return response.data;
    } catch (error) {
      throw error;
    }
  }
}

export const { resetPassword, forgotPassword } = AuthService;

export default authService;
