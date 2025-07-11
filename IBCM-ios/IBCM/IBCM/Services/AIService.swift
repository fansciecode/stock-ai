import Foundation
import Combine

/**
 * AI Service for IBCM AI-powered features and recommendations
 * Integrates with IBCM-ai microservice through the backend API
 */
class AIService: BaseAPIService {
    static let shared = AIService()
    
    private init() {}
    
    // MARK: - Search and Recommendations
    
    func enhancedSearch(query: String, userId: String, filters: [String: Any]? = nil, 
                        location: Location? = nil, preferences: [String: Any]? = nil) async throws -> SearchResponse {
        let request = EnhancedSearchRequest(
            query: query,
            userId: userId,
            filters: filters,
            location: location,
            preferences: preferences
        )
        
        return try await apiService.request(
            endpoint: "api/ai/search",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    func getPersonalizedRecommendations(userId: String, limit: Int = 10, 
                                        type: String? = nil, location: String? = nil) async throws -> [RecommendationItem] {
        var queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let type = type {
            queryItems.append(URLQueryItem(name: "type", value: type))
        }
        
        if let location = location {
            queryItems.append(URLQueryItem(name: "location", value: location))
        }
        
        return try await apiService.request(
            endpoint: "api/ai/recommendations",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func getOptimizedRecommendations(userId: String, context: String? = nil, 
                                     limit: Int = 10) async throws -> [RecommendationItem] {
        var queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let context = context {
            queryItems.append(URLQueryItem(name: "context", value: context))
        }
        
        return try await apiService.request(
            endpoint: "api/ai/recommendations/optimized",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func getLocationRecommendations(userId: String, latitude: Double, longitude: Double,
                                   radius: Double = 10.0, category: String? = nil, 
                                   limit: Int = 10) async throws -> [RecommendationItem] {
        let request = LocationRecommendationRequest(
            userId: userId,
            latitude: latitude,
            longitude: longitude,
            radius: radius,
            category: category,
            limit: limit
        )
        
        return try await apiService.request(
            endpoint: "api/ai/location-recommendations",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    // MARK: - User Insights and Analytics
    
    func getUserInsights(userId: String, period: String = "month") async throws -> UserInsights {
        let queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "period", value: period)
        ]
        
        return try await apiService.request(
            endpoint: "api/ai/user/insights",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func getUserPreferences(userId: String) async throws -> UserPreferences {
        let queryItems = [
            URLQueryItem(name: "userId", value: userId)
        ]
        
        return try await apiService.request(
            endpoint: "api/ai/user/preferences",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func updateUserPreferences(userId: String, preferences: [String: Any]) async throws -> UserPreferences {
        let request = UpdatePreferencesRequest(userId: userId, preferences: preferences)
        
        return try await apiService.request(
            endpoint: "api/ai/user/preferences",
            method: HTTPMethod.put.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    // MARK: - Content Generation
    
    func generateEventDescription(title: String, category: String, context: String = "") async throws -> GeneratedContent {
        let request = GenerateDescriptionRequest(title: title, category: category, context: context)
        
        return try await apiService.request(
            endpoint: "api/ai/generate-description",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    func generateTags(content: String, count: Int = 5) async throws -> [String] {
        let request = GenerateTagsRequest(content: content, count: count)
        
        return try await apiService.request(
            endpoint: "api/ai/generate-tags",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    // MARK: - Sentiment Analysis
    
    func analyzeSentiment(text: String) async throws -> SentimentAnalysis {
        let request = SentimentAnalysisRequest(text: text)
        
        return try await apiService.request(
            endpoint: "api/ai/sentiment-analysis",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
    
    // MARK: - Feedback and Learning
    
    func submitFeedback(userId: String, targetId: String, feedback: Int, 
                       comment: String? = nil, type: String) async throws -> String {
        let request = AIFeedbackRequest(
            userId: userId,
            targetId: targetId,
            feedback: feedback,
            comment: comment,
            type: type
        )
        
        return try await apiService.request(
            endpoint: "api/ai/feedback",
            method: HTTPMethod.post.rawValue,
            body: try? JSONEncoder().encode(request)
        )
    }
}

// MARK: - Request Models

struct EnhancedSearchRequest: Codable {
    let query: String
    let userId: String
    let filters: [String: Any]?
    let location: Location?
    let preferences: [String: Any]?
    let context: String?
    
    init(query: String, userId: String, filters: [String: Any]? = nil, 
         location: Location? = nil, preferences: [String: Any]? = nil, context: String? = nil) {
        self.query = query
        self.userId = userId
        self.filters = filters
        self.location = location
        self.preferences = preferences
        self.context = nil
    }
    
    enum CodingKeys: String, CodingKey {
        case query, userId, location, context
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(query, forKey: .query)
        try container.encode(userId, forKey: .userId)
        try container.encodeIfPresent(location, forKey: .location)
        try container.encodeIfPresent(context, forKey: .context)
        
        // Handle dictionary encoding manually
        if let filters = filters {
            let data = try JSONSerialization.data(withJSONObject: filters)
            let filterDict = try JSONSerialization.jsonObject(with: data)
            try container.encode(filterDict, forKey: .filters)
        }
        
        if let preferences = preferences {
            let data = try JSONSerialization.data(withJSONObject: preferences)
            let preferencesDict = try JSONSerialization.jsonObject(with: data)
            try container.encode(preferencesDict, forKey: .preferences)
        }
    }
}

struct LocationRecommendationRequest: Codable {
    let userId: String
    let latitude: Double
    let longitude: Double
    let radius: Double
    let category: String?
    let limit: Int
}

struct GenerateDescriptionRequest: Codable {
    let title: String
    let category: String
    let context: String
}

struct GenerateTagsRequest: Codable {
    let content: String
    let count: Int
}

struct SentimentAnalysisRequest: Codable {
    let text: String
}

struct AIFeedbackRequest: Codable {
    let userId: String
    let targetId: String
    let feedback: Int
    let comment: String?
    let type: String
}

struct UpdatePreferencesRequest: Codable {
    let userId: String
    let preferences: [String: Any]
    
    enum CodingKeys: String, CodingKey {
        case userId, preferences
    }
    
    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(userId, forKey: .userId)
        
        // Handle dictionary encoding manually
        let data = try JSONSerialization.data(withJSONObject: preferences)
        let preferencesDict = try JSONSerialization.jsonObject(with: data)
        try container.encode(preferencesDict, forKey: .preferences)
    }
}

// MARK: - Response Models

struct SearchResponse: Codable {
    let results: [SearchResult]
    let metadata: SearchMetadata?
}

struct SearchResult: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let type: String
    let score: Double
    let metadata: [String: String]?
}

struct SearchMetadata: Codable {
    let totalResults: Int
    let processingTime: Double
    let queryContext: String?
}

struct RecommendationItem: Codable, Identifiable {
    let id: String
    let title: String
    let description: String
    let type: String
    let score: Double
    let reasons: [String]?
    let imageUrl: String?
    let metadata: [String: String]?
}

struct UserInsights: Codable {
    let preferences: [String: Double]
    let interests: [String]
    let behavior: BehaviorMetrics
    let recommendations: [RecommendationInsight]
}

struct BehaviorMetrics: Codable {
    let engagementScore: Double
    let activityLevel: String
    let lastActive: Date
    let frequentTimes: [String]
}

struct RecommendationInsight: Codable {
    let category: String
    let confidence: Double
    let reason: String
}

struct UserPreferences: Codable {
    let categories: [String]
    let locations: [String]
    let priceRange: PriceRange
    let notificationSettings: NotificationPreferences
    let customPreferences: [String: String]
}

struct PriceRange: Codable {
    let min: Double
    let max: Double
}

struct NotificationPreferences: Codable {
    let enabled: Bool
    let types: [String]
    let frequency: String
}

struct GeneratedContent: Codable {
    let content: String
    let metadata: ContentMetadata
}

struct ContentMetadata: Codable {
    let wordCount: Int
    let readingTime: Int
    let keywords: [String]
    let sentiment: String
}

struct SentimentAnalysis: Codable {
    let sentiment: String
    let score: Double
    let confidence: Double
    let aspects: [AspectSentiment]?
}

struct AspectSentiment: Codable {
    let aspect: String
    let sentiment: String
    let score: Double
} 