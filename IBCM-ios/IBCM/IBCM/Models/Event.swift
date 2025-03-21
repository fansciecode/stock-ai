import Foundation

struct Event: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let category: String
    let date: Date
    let time: Date
    let location: String
    let latitude: Double
    let longitude: Double
    let creatorId: String
    let creatorName: String
    let visibility: String
    let maxAttendees: Int
    let attendees: [String]
    let interestedUsers: [String]
    let reviews: [Review]
    let comments: [Comment]
    let hasReminder: Bool
    let createdAt: TimeInterval
    let updatedAt: TimeInterval
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        return formatter.string(from: date)
    }
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: time)
    }
    
    struct Review: Codable {
        let userId: String
        let userName: String
        let rating: Int
        let comment: String
        let createdAt: TimeInterval
    }
    
    struct Comment: Codable {
        let id: String
        let userId: String
        let userName: String
        let text: String
        let createdAt: TimeInterval
    }
}

struct EventType {
    enum Category: String, CaseIterable {
        case technology = "Technology"
        case sports = "Sports"
        case music = "Music"
        case art = "Art"
        case food = "Food"
        case travel = "Travel"
        case education = "Education"
        case business = "Business"
        case health = "Health"
        case science = "Science"
        case entertainment = "Entertainment"
        case social = "Social"
    }
    
    enum Visibility: String {
        case `public` = "Public"
        case `private` = "Private"
        case inviteOnly = "Invite Only"
    }
}

struct EventAnalytics: Codable {
    let totalAttendees: Int
    let averageRating: Double
    let totalComments: Int
    let viewCount: Int
    let interestedCount: Int
    let registrationTrend: [String: Int]
    let categoryDistribution: [String: Int]
}

// Response types
struct EventResponse: Codable {
    let success: Bool
    let data: Event
    let message: String?
}

struct EventsResponse: Codable {
    let success: Bool
    let data: [Event]
    let message: String?
}

struct EventAnalyticsResponse: Codable {
    let success: Bool
    let data: EventAnalytics
    let message: String?
} 