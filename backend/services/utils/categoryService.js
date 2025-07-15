import axios from 'axios';

export class CategoryService {
    constructor() {
        // Predefined category hierarchies
        this.categories = {
            events: {
                main: ['concert', 'conference', 'sports', 'exhibition', 'workshop', 'social'],
                attributes: ['indoor', 'outdoor', 'virtual', 'hybrid'],
                size: ['small', 'medium', 'large', 'mega']
            },
            products: {
                main: ['electronics', 'fashion', 'home', 'sports', 'art', 'food'],
                condition: ['new', 'used', 'refurbished'],
                pricing: ['budget', 'mid-range', 'premium', 'luxury']
            },
            content: {
                type: ['article', 'video', 'image', 'audio', 'document'],
                format: ['tutorial', 'review', 'news', 'entertainment', 'educational'],
                audience: ['beginner', 'intermediate', 'advanced', 'all']
            }
        };
        this.AI_SERVICE_URL = process.env.AI_SERVICE_URL || 'http://localhost:8001';
        this.AI_SERVICE_API_KEY = process.env.AI_SERVICE_API_KEY || 'development_key';
    }

    async categorizeContent(content, type = 'content') {
        try {
            // Use IBCM-ai microservice to analyze and categorize content
            const response = await axios.post(`${this.AI_SERVICE_URL}/categorize-content`, {
                content,
                type
            }, {
                headers: { 'X-API-KEY': this.AI_SERVICE_API_KEY }
            });
            return response.data;
        } catch (error) {
            console.error('Content categorization error:', error);
            // Fallback: use local keyword matching
            return this.suggestCategories(Object.values(content).join(' '), type);
        }
    }

    async suggestCategories(keywords, type = 'content') {
        try {
            const availableCategories = this.categories[type] || {};
            const matches = this.findMatchingCategories(keywords, availableCategories);

            return {
                suggested: matches,
                related: this.findRelatedCategories(matches, type),
                hierarchy: this.buildCategoryHierarchy(matches, type)
            };
        } catch (error) {
            console.error('Category suggestion error:', error);
            throw error;
        }
    }

    findMatchingCategories(keywords, categories) {
        const matches = new Set();
        const keywordArray = Array.isArray(keywords) ? keywords : [keywords];

        Object.values(categories).forEach(categoryList => {
            categoryList.forEach(category => {
                keywordArray.forEach(keyword => {
                    if (this.isMatch(category, keyword)) {
                        matches.add(category);
                    }
                });
            });
        });

        return Array.from(matches);
    }

    findRelatedCategories(categories, type) {
        const related = new Set();
        const typeCategories = this.categories[type] || {};

        categories.forEach(category => {
            Object.values(typeCategories).forEach(categoryList => {
                categoryList.forEach(item => {
                    if (this.areRelated(category, item)) {
                        related.add(item);
                    }
                });
            });
        });

        return Array.from(related).filter(item => !categories.includes(item));
    }

    buildCategoryHierarchy(categories, type) {
        const hierarchy = {};
        const typeCategories = this.categories[type] || {};

        Object.entries(typeCategories).forEach(([level, categoryList]) => {
            hierarchy[level] = categoryList.filter(category => 
                categories.includes(category)
            );
        });

        return hierarchy;
    }

    isMatch(category, keyword) {
        const categoryLower = category.toLowerCase();
        const keywordLower = keyword.toLowerCase();
        
        return categoryLower.includes(keywordLower) || 
               keywordLower.includes(categoryLower) ||
               this.calculateSimilarity(categoryLower, keywordLower) > 0.8;
    }

    areRelated(category1, category2) {
        return this.calculateSimilarity(category1.toLowerCase(), category2.toLowerCase()) > 0.5;
    }

    calculateSimilarity(str1, str2) {
        // Simple Levenshtein distance-based similarity
        const distance = this.levenshteinDistance(str1, str2);
        const maxLength = Math.max(str1.length, str2.length);
        return 1 - (distance / maxLength);
    }

    levenshteinDistance(str1, str2) {
        const matrix = Array(str2.length + 1).fill(null)
            .map(() => Array(str1.length + 1).fill(null));

        for (let i = 0; i <= str1.length; i++) {
            matrix[0][i] = i;
        }
        for (let j = 0; j <= str2.length; j++) {
            matrix[j][0] = j;
        }

        for (let j = 1; j <= str2.length; j++) {
            for (let i = 1; i <= str1.length; i++) {
                const substitutionCost = str1[i - 1] === str2[j - 1] ? 0 : 1;
                matrix[j][i] = Math.min(
                    matrix[j][i - 1] + 1,
                    matrix[j - 1][i] + 1,
                    matrix[j - 1][i - 1] + substitutionCost
                );
            }
        }

        return matrix[str2.length][str1.length];
    }

    parseCategories(analysis, type) {
        try {
            const parsed = JSON.parse(analysis);
            return {
                main: parsed.main || [],
                attributes: parsed.attributes || [],
                specific: parsed.specific || [],
                confidence: parsed.confidence || 1.0
            };
        } catch (error) {
            console.error('Category parsing error:', error);
            return {
                main: [],
                attributes: [],
                specific: [],
                confidence: 0.5
            };
        }
    }
}

export default new CategoryService(); 