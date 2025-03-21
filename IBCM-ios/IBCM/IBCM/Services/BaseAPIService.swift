import Foundation

protocol BaseAPIService {
    var apiService: APIService { get }
}

extension BaseAPIService {
    var apiService: APIService {
        return APIService.shared
    }
}

// HTTP Methods
enum HTTPMethod: String {
    case get = "GET"
    case post = "POST"
    case put = "PUT"
    case delete = "DELETE"
    case patch = "PATCH"
}

// Common Response Types
struct ListResponse<T: Codable>: Codable {
    let items: [T]
    let metadata: ListMetadata
}

struct ListMetadata: Codable {
    let total: Int
    let page: Int
    let limit: Int
    let hasMore: Bool
}

struct EmptyResponse: Codable {}

struct MessageResponse: Codable {
    let message: String
    let success: Bool
}

// Common Error Types
enum APIServiceError: LocalizedError {
    case invalidRequest
    case invalidResponse
    case decodingError(Error)
    case networkError(Error)
    case serverError(String)
    case unauthorized
    case notFound
    case validationError([String: String])
    case rateLimitExceeded
    case serviceUnavailable
    
    var errorDescription: String? {
        switch self {
        case .invalidRequest:
            return "Invalid request"
        case .invalidResponse:
            return "Invalid response from server"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let message):
            return "Server error: \(message)"
        case .unauthorized:
            return "Unauthorized access"
        case .notFound:
            return "Resource not found"
        case .validationError(let errors):
            return "Validation errors: \(errors)"
        case .rateLimitExceeded:
            return "Rate limit exceeded"
        case .serviceUnavailable:
            return "Service temporarily unavailable"
        }
    }
}

// Common Request Types
struct PaginationParams: Codable {
    let page: Int
    let limit: Int
}

struct DateRangeParams: Codable {
    let startDate: Date
    let endDate: Date
}

// Common Model Types
struct Location: Codable {
    let latitude: Double
    let longitude: Double
    let address: String?
    let city: String?
    let state: String?
    let country: String?
    let postalCode: String?
}

struct MediaContent: Codable {
    let id: String
    let url: String
    let type: MediaType
    let thumbnailUrl: String?
    let metadata: [String: String]?
    let createdAt: Date
}

enum MediaType: String, Codable {
    case image
    case video
    case audio
    case document
}

struct Price: Codable {
    let amount: Double
    let currency: String
}

struct TimeSlot: Codable {
    let id: String
    let startTime: Date
    let endTime: Date
    let capacity: Int
    let bookedCount: Int
    let isAvailable: Bool
}

// Helper Extensions
extension Encodable {
    func asDictionary() throws -> [String: Any] {
        let data = try JSONEncoder().encode(self)
        guard let dictionary = try JSONSerialization.jsonObject(with: data, options: .allowFragments) as? [String: Any] else {
            throw APIServiceError.invalidRequest
        }
        return dictionary
    }
} 