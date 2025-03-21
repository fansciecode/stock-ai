import Foundation

struct SearchFilters: Codable {
    var query: String = ""
    var location: LocationFilter?
    var category: String?
    var sortByTime: Bool = false
    var page: Int = 1
    var limit: Int = 20
    
    struct LocationFilter: Codable {
        var latitude: Double?
        var longitude: Double?
        var radius: Double?
        var city: String?
    }
}

struct SearchResult: Codable, Identifiable {
    let id: String
    let type: SearchResultType
    let title: String
    let subtitle: String?
    let imageUrl: String?
    let category: String?
    let date: Date?
    let distance: Double?
    let relevanceScore: Double?
}

enum SearchResultType: String, Codable {
    case event
    case user
    case business
}

struct SearchSuggestion: Codable, Identifiable {
    let id: String
    let text: String
    let type: SearchSuggestionType
    let category: String?
    let confidence: Double
}

enum SearchSuggestionType: String, Codable {
    case recent
    case trending
    case personalized
}

// Response types
struct SearchResponse: Codable {
    let success: Bool
    let data: [SearchResult]
    let message: String?
    let metadata: SearchMetadata?
}

struct SearchMetadata: Codable {
    let total: Int
    let page: Int
    let limit: Int
    let hasMore: Bool
}

struct SearchSuggestionsResponse: Codable {
    let success: Bool
    let data: [SearchSuggestion]
    let message: String?
}

struct SearchHistoryResponse: Codable {
    let success: Bool
    let data: [SearchHistoryItem]
    let message: String?
}

struct SearchHistoryItem: Codable, Identifiable {
    let id: String
    let query: String
    let timestamp: Date
    let filters: SearchFilters?
    let resultCount: Int
} 