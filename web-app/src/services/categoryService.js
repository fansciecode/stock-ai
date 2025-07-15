/**
 * Category Service
 * 
 * This service handles all category-related API calls and data management.
 * It's designed to match the functionality of the Android and iOS category services.
 */

class CategoryService {
  constructor() {
    this.apiBaseUrl = process.env.REACT_APP_API_URL || '/api';
    this.categoriesEndpoint = `${this.apiBaseUrl}/categories`;
  }

  /**
   * Get all categories
   * @returns {Promise<Array>} - Array of categories
   */
  async getCategories() {
    try {
      // In a real app, this would be an API call
      // For now, we'll return mock data
      return this.generateMockCategories();
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  /**
   * Get category by ID
   * @param {string} categoryId - Category ID
   * @returns {Promise<Object>} - Category details
   */
  async getCategoryById(categoryId) {
    try {
      // In a real app, this would be an API call
      // For now, we'll return mock data
      const categories = this.generateMockCategories();
      const category = categories.find(cat => cat.id === categoryId);
      
      if (!category) {
        throw new Error('Category not found');
      }
      
      return category;
    } catch (error) {
      console.error(`Error fetching category ${categoryId}:`, error);
      throw error;
    }
  }

  /**
   * Generate mock categories for development
   * @returns {Array} - Array of mock categories
   */
  generateMockCategories() {
    return [
      { id: "1", name: "Music", icon: "music" },
      { id: "2", name: "Sports", icon: "football-ball" },
      { id: "3", name: "Food", icon: "utensils" },
      { id: "4", name: "Art", icon: "palette" },
      { id: "5", name: "Technology", icon: "laptop-code" },
      { id: "6", name: "Business", icon: "briefcase" },
      { id: "7", name: "Education", icon: "graduation-cap" },
      { id: "8", name: "Health", icon: "heartbeat" },
      { id: "9", name: "Travel", icon: "plane" },
      { id: "10", name: "Entertainment", icon: "film" }
    ];
  }
}

export default CategoryService;
