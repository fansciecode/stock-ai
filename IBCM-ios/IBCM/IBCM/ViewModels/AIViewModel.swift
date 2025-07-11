import Foundation
import Combine

@MainActor
class AIViewModel: ObservableObject {
    // MARK: - Published Properties
    
    // Search and Recommendations
    @Published var searchResults: [SearchResult] = []
    @Published var recommendations: [RecommendationItem] = []
    @Published var locationRecommendations: [RecommendationItem] = []
    
    // User Insights
    @Published var userInsights: UserInsights?
    @Published var userPreferences: UserPreferences?
    
    // Content Generation
    @Published var generatedDescription: String = ""
    @Published var generatedTags: [String] = []
    
    // Sentiment Analysis
    @Published var sentimentResult: SentimentAnalysis?
    
    // State Management
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    
    // MARK: - Private Properties
    private let aiRepository: AIRepository
    private var cancellables = Set<AnyCancellable>()
    
    // MARK: - Initialization
    init(aiRepository: AIRepository = AIRepositoryImpl()) {
        self.aiRepository = aiRepository
    }
    
    // MARK: - Search and Recommendations
    
    func performSearch(query: String, userId: String, filters: [String: Any]? = nil, 
                      location: Location? = nil, preferences: [String: Any]? = nil) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let response = try await aiRepository.enhancedSearch(
                    query: query,
                    userId: userId,
                    filters: filters,
                    location: location,
                    preferences: preferences
                )
                
                searchResults = response.results
                isLoading = false
            } catch {
                handleError(error, message: "Search failed")
            }
        }
    }
    
    func loadPersonalizedRecommendations(userId: String, limit: Int = 10, 
                                        type: String? = nil, location: String? = nil) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                recommendations = try await aiRepository.getPersonalizedRecommendations(
                    userId: userId,
                    limit: limit,
                    type: type,
                    location: location
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to load recommendations")
            }
        }
    }
    
    func loadLocationRecommendations(userId: String, latitude: Double, longitude: Double, 
                                    radius: Double = 10.0, category: String? = nil, limit: Int = 10) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                locationRecommendations = try await aiRepository.getLocationRecommendations(
                    userId: userId,
                    latitude: latitude,
                    longitude: longitude,
                    radius: radius,
                    category: category,
                    limit: limit
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to load location recommendations")
            }
        }
    }
    
    // MARK: - User Insights and Analytics
    
    func loadUserInsights(userId: String, period: String = "month") {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                userInsights = try await aiRepository.getUserInsights(
                    userId: userId,
                    period: period
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to load user insights")
            }
        }
    }
    
    func loadUserPreferences(userId: String) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                userPreferences = try await aiRepository.getUserPreferences(userId: userId)
                isLoading = false
            } catch {
                handleError(error, message: "Failed to load user preferences")
            }
        }
    }
    
    func saveUserPreferences(userId: String, preferences: [String: Any]) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                userPreferences = try await aiRepository.updateUserPreferences(
                    userId: userId,
                    preferences: preferences
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to update user preferences")
            }
        }
    }
    
    // MARK: - Content Generation
    
    func generateDescription(title: String, category: String, context: String = "") {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                let content = try await aiRepository.generateEventDescription(
                    title: title,
                    category: category,
                    context: context
                )
                
                generatedDescription = content.content
                isLoading = false
            } catch {
                handleError(error, message: "Failed to generate description")
            }
        }
    }
    
    func generateTags(content: String, count: Int = 5) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                generatedTags = try await aiRepository.generateTags(
                    content: content,
                    count: count
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to generate tags")
            }
        }
    }
    
    // MARK: - Sentiment Analysis
    
    func analyzeSentiment(text: String) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                sentimentResult = try await aiRepository.analyzeSentiment(text: text)
                isLoading = false
            } catch {
                handleError(error, message: "Failed to analyze sentiment")
            }
        }
    }
    
    // MARK: - Feedback and Learning
    
    func submitFeedback(userId: String, targetId: String, feedback: Int, 
                       comment: String? = nil, type: String) {
        isLoading = true
        errorMessage = nil
        
        Task {
            do {
                _ = try await aiRepository.submitFeedback(
                    userId: userId,
                    targetId: targetId,
                    feedback: feedback,
                    comment: comment,
                    type: type
                )
                isLoading = false
            } catch {
                handleError(error, message: "Failed to submit feedback")
            }
        }
    }
    
    // MARK: - Helper Methods
    
    private func handleError(_ error: Error, message: String) {
        isLoading = false
        errorMessage = "\(message): \(error.localizedDescription)"
        showError = true
        print("AI Error: \(errorMessage ?? "Unknown error")")
    }
} 