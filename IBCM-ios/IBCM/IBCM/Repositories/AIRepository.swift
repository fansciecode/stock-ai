import Foundation
import Combine

protocol AIRepository {
    // Search and Recommendations
    func enhancedSearch(query: String, userId: String, filters: [String: Any]?, location: Location?, preferences: [String: Any]?) async throws -> SearchResponse
    func getPersonalizedRecommendations(userId: String, limit: Int, type: String?, location: String?) async throws -> [RecommendationItem]
    func getOptimizedRecommendations(userId: String, context: String?, limit: Int) async throws -> [RecommendationItem]
    func getLocationRecommendations(userId: String, latitude: Double, longitude: Double, radius: Double, category: String?, limit: Int) async throws -> [RecommendationItem]
    
    // User Insights and Analytics
    func getUserInsights(userId: String, period: String) async throws -> UserInsights
    func getUserPreferences(userId: String) async throws -> UserPreferences
    func updateUserPreferences(userId: String, preferences: [String: Any]) async throws -> UserPreferences
    
    // Content Generation
    func generateEventDescription(title: String, category: String, context: String) async throws -> GeneratedContent
    func generateTags(content: String, count: Int) async throws -> [String]
    
    // Sentiment Analysis
    func analyzeSentiment(text: String) async throws -> SentimentAnalysis
    
    // Feedback and Learning
    func submitFeedback(userId: String, targetId: String, feedback: Int, comment: String?, type: String) async throws -> String
}

class AIRepositoryImpl: AIRepository {
    private let aiService: AIService
    private var cancellables = Set<AnyCancellable>()
    
    init(aiService: AIService = AIService.shared) {
        self.aiService = aiService
    }
    
    // MARK: - Search and Recommendations
    
    func enhancedSearch(query: String, userId: String, filters: [String: Any]? = nil, 
                       location: Location? = nil, preferences: [String: Any]? = nil) async throws -> SearchResponse {
        do {
            return try await aiService.enhancedSearch(
                query: query,
                userId: userId,
                filters: filters,
                location: location,
                preferences: preferences
            )
        } catch {
            // Log error
            print("Enhanced search error: \(error.localizedDescription)")
            throw error
        }
    }
    
    func getPersonalizedRecommendations(userId: String, limit: Int = 10, 
                                       type: String? = nil, location: String? = nil) async throws -> [RecommendationItem] {
        do {
            return try await aiService.getPersonalizedRecommendations(
                userId: userId,
                limit: limit,
                type: type,
                location: location
            )
        } catch {
            // Log error
            print("Personalized recommendations error: \(error.localizedDescription)")
            
            // Return empty array as fallback
            if let _ = error as? URLError {
                return []
            }
            throw error
        }
    }
    
    func getOptimizedRecommendations(userId: String, context: String? = nil, 
                                    limit: Int = 10) async throws -> [RecommendationItem] {
        do {
            return try await aiService.getOptimizedRecommendations(
                userId: userId,
                context: context,
                limit: limit
            )
        } catch {
            // Log error
            print("Optimized recommendations error: \(error.localizedDescription)")
            
            // Return empty array as fallback
            if let _ = error as? URLError {
                return []
            }
            throw error
        }
    }
    
    func getLocationRecommendations(userId: String, latitude: Double, longitude: Double,
                                  radius: Double = 10.0, category: String? = nil, 
                                  limit: Int = 10) async throws -> [RecommendationItem] {
        do {
            return try await aiService.getLocationRecommendations(
                userId: userId,
                latitude: latitude,
                longitude: longitude,
                radius: radius,
                category: category,
                limit: limit
            )
        } catch {
            // Log error
            print("Location recommendations error: \(error.localizedDescription)")
            
            // Return empty array as fallback
            if let _ = error as? URLError {
                return []
            }
            throw error
        }
    }
    
    // MARK: - User Insights and Analytics
    
    func getUserInsights(userId: String, period: String = "month") async throws -> UserInsights {
        do {
            return try await aiService.getUserInsights(userId: userId, period: period)
        } catch {
            // Log error
            print("User insights error: \(error.localizedDescription)")
            throw error
        }
    }
    
    func getUserPreferences(userId: String) async throws -> UserPreferences {
        do {
            return try await aiService.getUserPreferences(userId: userId)
        } catch {
            // Log error
            print("User preferences error: \(error.localizedDescription)")
            throw error
        }
    }
    
    func updateUserPreferences(userId: String, preferences: [String: Any]) async throws -> UserPreferences {
        do {
            return try await aiService.updateUserPreferences(userId: userId, preferences: preferences)
        } catch {
            // Log error
            print("Update user preferences error: \(error.localizedDescription)")
            throw error
        }
    }
    
    // MARK: - Content Generation
    
    func generateEventDescription(title: String, category: String, context: String = "") async throws -> GeneratedContent {
        do {
            return try await aiService.generateEventDescription(
                title: title,
                category: category,
                context: context
            )
        } catch {
            // Log error
            print("Generate event description error: \(error.localizedDescription)")
            throw error
        }
    }
    
    func generateTags(content: String, count: Int = 5) async throws -> [String] {
        do {
            return try await aiService.generateTags(content: content, count: count)
        } catch {
            // Log error
            print("Generate tags error: \(error.localizedDescription)")
            
            // Return empty array as fallback
            if let _ = error as? URLError {
                return []
            }
            throw error
        }
    }
    
    // MARK: - Sentiment Analysis
    
    func analyzeSentiment(text: String) async throws -> SentimentAnalysis {
        do {
            return try await aiService.analyzeSentiment(text: text)
        } catch {
            // Log error
            print("Sentiment analysis error: \(error.localizedDescription)")
            throw error
        }
    }
    
    // MARK: - Feedback and Learning
    
    func submitFeedback(userId: String, targetId: String, feedback: Int, 
                      comment: String? = nil, type: String) async throws -> String {
        do {
            return try await aiService.submitFeedback(
                userId: userId,
                targetId: targetId,
                feedback: feedback,
                comment: comment,
                type: type
            )
        } catch {
            // Log error
            print("Submit feedback error: \(error.localizedDescription)")
            throw error
        }
    }
} 