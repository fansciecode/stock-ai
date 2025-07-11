import api from './api';

class CategoryService {
  // Get all categories
  async getAllCategories() {
    try {
      const response = await api.get('/categories');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories:', error);
      throw error;
    }
  }

  // Get category by ID
  async getCategoryById(categoryId) {
    try {
      const response = await api.get(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category:', error);
      throw error;
    }
  }

  // Get events by category
  async getEventsByCategory(categoryId, page = 1, limit = 10) {
    try {
      const response = await api.get(`/categories/${categoryId}/events`, {
        params: { page, limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching events by category:', error);
      throw error;
    }
  }

  // Create new category (admin only)
  async createCategory(categoryData) {
    try {
      const response = await api.post('/categories', categoryData);
      return response.data;
    } catch (error) {
      console.error('Error creating category:', error);
      throw error;
    }
  }

  // Update category (admin only)
  async updateCategory(categoryId, categoryData) {
    try {
      const response = await api.put(`/categories/${categoryId}`, categoryData);
      return response.data;
    } catch (error) {
      console.error('Error updating category:', error);
      throw error;
    }
  }

  // Delete category (admin only)
  async deleteCategory(categoryId) {
    try {
      const response = await api.delete(`/categories/${categoryId}`);
      return response.data;
    } catch (error) {
      console.error('Error deleting category:', error);
      throw error;
    }
  }

  // Get featured categories
  async getFeaturedCategories() {
    try {
      const response = await api.get('/categories/featured');
      return response.data;
    } catch (error) {
      console.error('Error fetching featured categories:', error);
      throw error;
    }
  }

  // Get categories with event counts
  async getCategoriesWithCounts() {
    try {
      const response = await api.get('/categories/with-counts');
      return response.data;
    } catch (error) {
      console.error('Error fetching categories with counts:', error);
      throw error;
    }
  }

  // Search categories
  async searchCategories(query, filters = {}) {
    try {
      const response = await api.get('/categories/search', {
        params: { q: query, ...filters }
      });
      return response.data;
    } catch (error) {
      console.error('Error searching categories:', error);
      throw error;
    }
  }

  // Get category statistics
  async getCategoryStats(categoryId) {
    try {
      const response = await api.get(`/categories/${categoryId}/stats`);
      return response.data;
    } catch (error) {
      console.error('Error fetching category stats:', error);
      throw error;
    }
  }

  // Get popular categories
  async getPopularCategories(limit = 10) {
    try {
      const response = await api.get('/categories/popular', {
        params: { limit }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching popular categories:', error);
      throw error;
    }
  }

  // Get user's favorite categories
  async getUserFavoriteCategories() {
    try {
      const response = await api.get('/categories/user/favorites');
      return response.data;
    } catch (error) {
      console.error('Error fetching user favorite categories:', error);
      throw error;
    }
  }

  // Add category to user favorites
  async addToFavorites(categoryId) {
    try {
      const response = await api.post(`/categories/${categoryId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error adding category to favorites:', error);
      throw error;
    }
  }

  // Remove category from user favorites
  async removeFromFavorites(categoryId) {
    try {
      const response = await api.delete(`/categories/${categoryId}/favorite`);
      return response.data;
    } catch (error) {
      console.error('Error removing category from favorites:', error);
      throw error;
    }
  }

  // Get category hierarchy (parent-child relationships)
  async getCategoryHierarchy() {
    try {
      const response = await api.get('/categories/hierarchy');
      return response.data;
    } catch (error) {
      console.error('Error fetching category hierarchy:', error);
      throw error;
    }
  }

  // Get subcategories
  async getSubcategories(parentCategoryId) {
    try {
      const response = await api.get(`/categories/${parentCategoryId}/subcategories`);
      return response.data;
    } catch (error) {
      console.error('Error fetching subcategories:', error);
      throw error;
    }
  }

  // Upload category image
  async uploadCategoryImage(categoryId, imageFile) {
    try {
      const formData = new FormData();
      formData.append('image', imageFile);

      const response = await api.post(`/categories/${categoryId}/image`, formData, {
        headers: {
          'Content-Type': 'multipart/form-data',
        },
      });
      return response.data;
    } catch (error) {
      console.error('Error uploading category image:', error);
      throw error;
    }
  }

  // Get trending categories
  async getTrendingCategories(period = 'week') {
    try {
      const response = await api.get('/categories/trending', {
        params: { period }
      });
      return response.data;
    } catch (error) {
      console.error('Error fetching trending categories:', error);
      throw error;
    }
  }

  // Get category suggestions based on user activity
  async getCategorySuggestions() {
    try {
      const response = await api.get('/categories/suggestions');
      return response.data;
    } catch (error) {
      console.error('Error fetching category suggestions:', error);
      throw error;
    }
  }

  // Utility functions
  formatCategoryName(name) {
    return name.split('_').map(word =>
      word.charAt(0).toUpperCase() + word.slice(1)
    ).join(' ');
  }

  getCategoryIcon(categoryType) {
    const iconMap = {
      'entertainment': '🎭',
      'sports': '⚽',
      'music': '🎵',
      'food': '🍽️',
      'technology': '💻',
      'business': '💼',
      'health': '🏥',
      'education': '🎓',
      'art': '🎨',
      'travel': '✈️',
      'gaming': '🎮',
      'fashion': '👗',
      'fitness': '💪',
      'automotive': '🚗',
      'real_estate': '🏠',
      'photography': '📸',
      'literature': '📚',
      'cooking': '👨‍🍳',
      'diy': '🔨',
      'gardening': '🌱',
      'pets': '🐕',
      'parenting': '👶',
      'volunteering': '🤝',
      'networking': '🤝',
      'workshop': '⚒️',
      'conference': '🎤',
      'webinar': '💻',
      'meetup': '👥',
      'party': '🎉',
      'festival': '🎊',
      'exhibition': '🖼️',
      'competition': '🏆',
      'charity': '❤️',
      'outdoor': '🌳',
      'indoor': '🏠',
      'virtual': '💻',
      'hybrid': '🌐'
    };
    return iconMap[categoryType] || '📅';
  }

  getCategoryColor(categoryType) {
    const colorMap = {
      'entertainment': '#FF6B6B',
      'sports': '#4ECDC4',
      'music': '#45B7D1',
      'food': '#FFA07A',
      'technology': '#98D8C8',
      'business': '#F7DC6F',
      'health': '#BB8FCE',
      'education': '#85C1E9',
      'art': '#F8C471',
      'travel': '#82E0AA',
      'gaming': '#D7BDE2',
      'fashion': '#F1948A',
      'fitness': '#52BE80',
      'automotive': '#5DADE2',
      'real_estate': '#58D68D',
      'photography': '#EC7063',
      'literature': '#AF7AC5',
      'cooking': '#F4D03F',
      'diy': '#5FB3D3',
      'gardening': '#7DCEA0',
      'pets': '#F8D7DA',
      'parenting': '#D4EDDA',
      'volunteering': '#CCE5FF',
      'networking': '#E2E3E5',
      'workshop': '#FFF3CD',
      'conference': '#D1ECF1',
      'webinar': '#E7F3FF',
      'meetup': '#F8F9FA',
      'party': '#FCF8E3',
      'festival': '#FDEBD0',
      'exhibition': '#E8F5E8',
      'competition': '#FFF2E6',
      'charity': '#FFE6E6',
      'outdoor': '#E8F5E8',
      'indoor': '#F0F8FF',
      'virtual': '#F5F5F5',
      'hybrid': '#F0F0F0'
    };
    return colorMap[categoryType] || '#E9ECEF';
  }

  // Category type constants
  static CATEGORY_TYPES = {
    ENTERTAINMENT: 'entertainment',
    SPORTS: 'sports',
    MUSIC: 'music',
    FOOD: 'food',
    TECHNOLOGY: 'technology',
    BUSINESS: 'business',
    HEALTH: 'health',
    EDUCATION: 'education',
    ART: 'art',
    TRAVEL: 'travel',
    GAMING: 'gaming',
    FASHION: 'fashion',
    FITNESS: 'fitness',
    AUTOMOTIVE: 'automotive',
    REAL_ESTATE: 'real_estate',
    PHOTOGRAPHY: 'photography',
    LITERATURE: 'literature',
    COOKING: 'cooking',
    DIY: 'diy',
    GARDENING: 'gardening',
    PETS: 'pets',
    PARENTING: 'parenting',
    VOLUNTEERING: 'volunteering',
    NETWORKING: 'networking',
    WORKSHOP: 'workshop',
    CONFERENCE: 'conference',
    WEBINAR: 'webinar',
    MEETUP: 'meetup',
    PARTY: 'party',
    FESTIVAL: 'festival',
    EXHIBITION: 'exhibition',
    COMPETITION: 'competition',
    CHARITY: 'charity',
    OUTDOOR: 'outdoor',
    INDOOR: 'indoor',
    VIRTUAL: 'virtual',
    HYBRID: 'hybrid'
  };

  // Category status constants
  static CATEGORY_STATUS = {
    ACTIVE: 'active',
    INACTIVE: 'inactive',
    FEATURED: 'featured',
    ARCHIVED: 'archived'
  };
}

export default new CategoryService();
