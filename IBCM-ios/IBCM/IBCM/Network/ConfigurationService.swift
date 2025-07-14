import Foundation

enum Environment: String {
    case development = "dev"
    case staging = "staging"
    case production = "prod"
}

class ConfigurationService {
    static let shared = ConfigurationService()
    
    private let environment: Environment
    
    private init() {
        #if DEBUG
        self.environment = .development
        #else
        self.environment = .production
        #endif
    }
    
    var baseURL: String {
        switch environment {
        case .development:
            return "http://localhost:5000/api"
        case .staging:
            return "https://staging-api.ibcm.app/api"
        case .production:
            return "https://api.ibcm.app/api"
        }
    }
    
    var webSocketURL: String {
        switch environment {
        case .development:
            return "ws://localhost:5000"
        case .staging:
            return "wss://staging-api.ibcm.app"
        case .production:
            return "wss://api.ibcm.app"
        }
    }
    
    var apiVersion: String {
        return "" // Remove version prefix since backend uses /api/ directly
    }
    
    var timeoutInterval: TimeInterval {
        switch environment {
        case .development:
            return 60
        case .staging:
            return 45
        case .production:
            return 30
        }
    }
    
    var maxRetryAttempts: Int {
        switch environment {
        case .development:
            return 5
        case .staging:
            return 3
        case .production:
            return 2
        }
    }
    
    var cacheExpirationInterval: TimeInterval {
        switch environment {
        case .development:
            return 600 // 10 minutes
        case .staging:
            return 300 // 5 minutes
        case .production:
            return 300 // 5 minutes
        }
    }
    
    var loggingEnabled: Bool {
        switch environment {
        case .development, .staging:
            return true
        case .production:
            return false
        }
    }
    
    func endpoint(for path: String) -> String {
        // Remove version prefix since backend uses /api/ directly
        return path.hasPrefix("/") ? path : "/\(path)"
    }
    
    func isDebugEnvironment() -> Bool {
        return environment != .production
    }
    
    func getEnvironment() -> Environment {
        return environment
    }
    
    // Add API configuration constants to match backend
    struct APIEndpoints {
        // Auth endpoints
        static let login = "/auth/login"
        static let register = "/auth/register"
        static let logout = "/auth/logout"
        static let refreshToken = "/auth/refresh"
        static let forgotPassword = "/auth/forgot-password"
        static let resetPassword = "/auth/reset-password"
        static let verifyEmail = "/auth/verify-email"
        
        // User endpoints
        static let users = "/users"
        static let userProfile = "/users/profile"
        static let userSettings = "/users/settings"
        
        // Event endpoints
        static let events = "/events"
        static let eventDetails = "/events/{id}"
        static let createEvent = "/events"
        static let updateEvent = "/events/{id}"
        static let deleteEvent = "/events/{id}"
        static let searchEvents = "/events/search"
        static let featuredEvents = "/events/featured"
        static let trendingEvents = "/events/trending"
        static let nearbyEvents = "/events/nearby"
        static let eventsByCategory = "/events/category/{categoryId}"
        static let joinEvent = "/events/{id}/join"
        static let leaveEvent = "/events/{id}/leave"
        static let bookEvent = "/events/{id}/book"
        static let cancelBooking = "/events/{id}/cancel/{bookingId}"
        static let eventReviews = "/events/{id}/reviews"
        static let eventAttendees = "/events/{id}/attendees"
        static let uploadEventMedia = "/events/{id}/media"
        static let eventAnalytics = "/events/{id}/analytics"
        
        // Booking endpoints
        static let bookings = "/bookings"
        static let userBookings = "/bookings/user"
        static let eventBookings = "/bookings/event"
        
        // Category endpoints
        static let categories = "/categories"
        
        // Chat endpoints
        static let chats = "/chats"
        static let chatMessages = "/chats/{chatId}/messages"
        static let sendMessage = "/chats/{chatId}/message"
        
        // Payment endpoints
        static let payments = "/payment"
        static let subscriptions = "/subscriptions"
        
        // Media endpoints
        static let mediaUpload = "/media/upload"
        
        // External events
        static let externalEvents = "/external/events"
        
        // AI features
        static let aiFeatures = "/ai/features"
        static let aiChat = "/ai/features/chat"
        
        // Search
        static let search = "/search"
        
        // Notifications
        static let notifications = "/notifications"
        
        // Analytics
        static let analytics = "/analytics"
        static let userActivity = "/user-activity"
        
        // Business
        static let business = "/business"
        
        // Orders
        static let orders = "/orders"
        
        // Reports
        static let reports = "/reports"
        
        // Follow
        static let follow = "/follow"
    }
} 