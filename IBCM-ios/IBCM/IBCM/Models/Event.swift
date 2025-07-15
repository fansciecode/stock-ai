import Foundation
import CoreLocation
import MapKit

// MARK: - Location
struct EventLocation: Codable {
    let type: String
    let city: String
    let address: String?
    let coordinates: [Double]?

    init(city: String, address: String? = nil, type: String = "Point") {
        self.type = type
        self.city = city
        self.address = address
        self.coordinates = nil
    }
}

// MARK: - Event Status
enum EventStatus: String, Codable, CaseIterable {
    case upcoming = "UPCOMING"
    case ongoing = "ONGOING"
    case completed = "COMPLETED"
    case cancelled = "CANCELLED"
    case draft = "DRAFT"
}

// MARK: - Event Type
enum EventType: String, Codable, CaseIterable {
    case informative = "INFORMATIVE"
    case networking = "NETWORKING"
    case workshop = "WORKSHOP"
    case conference = "CONFERENCE"
    case social = "SOCIAL"
    case business = "BUSINESS"
    case entertainment = "ENTERTAINMENT"
    case sports = "SPORTS"
    case education = "EDUCATION"
    case other = "OTHER"
}

// MARK: - Event Visibility
enum EventVisibility: String, Codable, CaseIterable {
    case `public` = "PUBLIC"
    case `private` = "PRIVATE"
    case restricted = "RESTRICTED"
}

// MARK: - Event Package
struct EventPackage: Codable {
    let id: String
    let name: String
    let description: String
    let price: Double
    let features: [String]
    let maxEvents: Int
    let duration: Int // in days
    let isActive: Bool
}

// MARK: - Event Model
struct Event: Codable, Identifiable, Hashable {
    let id: String
    let title: String
    let description: String
    let categoryId: String
    let category: Category?
    let location: Location?
    let startDate: String
    let endDate: String
    let price: Double?
    let capacity: Int?
    let isPublic: Bool
    let images: [String]?
    let tags: [String]?
    let organizer: User?
    let attendees: [User]?
    let attendeeCount: Int?
    let interestedCount: Int?
    let rating: Double?
    let reviewCount: Int?
    let createdAt: String?
    let updatedAt: String?
    let status: EventStatus
    let distance: Double?
    
    enum CodingKeys: String, CodingKey {
        case id
        case title
        case description
        case categoryId
        case category
        case location
        case startDate
        case endDate
        case price
        case capacity
        case isPublic
        case images
        case tags
        case organizer
        case attendees
        case attendeeCount
        case interestedCount
        case rating
        case reviewCount
        case createdAt
        case updatedAt
        case status
        case distance
    }
    
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }
    
    static func == (lhs: Event, rhs: Event) -> Bool {
        lhs.id == rhs.id
    }
    
    // MARK: - Mock Data
    static func mockEvent(id: String = UUID().uuidString) -> Event {
        return Event(
            id: id,
            title: "Tech Conference 2023",
            description: "Join us for the biggest tech conference of the year featuring keynotes from industry leaders and hands-on workshops.",
            categoryId: UUID().uuidString,
            category: Category.mock(name: "Technology"),
            location: Location(
                type: "Point",
                city: "San Francisco",
                address: "123 Tech Blvd",
                coordinates: [37.7749, -122.4194]
            ),
            startDate: "2023-09-15T09:00:00.000Z",
            endDate: "2023-09-17T18:00:00.000Z",
            price: 199.99,
            capacity: 500,
            isPublic: true,
            images: ["https://picsum.photos/800/500?random=1"],
            tags: ["tech", "conference", "networking"],
            organizer: User.mockUser(),
            attendees: nil,
            attendeeCount: 325,
            interestedCount: 450,
            rating: 4.8,
            reviewCount: 42,
            createdAt: "2023-05-01T10:00:00.000Z",
            updatedAt: "2023-06-15T14:30:00.000Z",
            status: .upcoming,
            distance: 2.5
        )
    }
    
    static func mockEvents(count: Int) -> [Event] {
        var events: [Event] = []
        
        let titles = [
            "Tech Conference 2023",
            "Music Festival Weekend",
            "Startup Networking Mixer",
            "Art Exhibition Opening",
            "Fitness Bootcamp",
            "Food & Wine Tasting"
        ]
        
        let descriptions = [
            "Join us for the biggest tech conference of the year featuring keynotes from industry leaders and hands-on workshops.",
            "A weekend of amazing music performances across multiple stages featuring top artists and emerging talent.",
            "Connect with fellow entrepreneurs and investors in a relaxed setting perfect for building valuable relationships.",
            "Featuring works from contemporary artists exploring themes of identity and transformation.",
            "Intensive workout sessions led by professional trainers to help you reach your fitness goals.",
            "Sample exquisite wines paired with gourmet dishes prepared by award-winning chefs."
        ]
        
        let categories = [
            "Technology",
            "Music",
            "Business",
            "Art",
            "Health",
            "Food"
        ]
        
        let cities = [
            "San Francisco",
            "New York",
            "Los Angeles",
            "Chicago",
            "Austin",
            "Seattle"
        ]
        
        for i in 0..<count {
            let titleIndex = i % titles.count
            let descIndex = i % descriptions.count
            let catIndex = i % categories.count
            let cityIndex = i % cities.count
            
            let monthOffset = i % 6 // Next 6 months
            let dayOffset = i % 28 + 1 // Days 1-28
            
            // Calculate date components for a future date
            var dateComponents = DateComponents()
            dateComponents.month = Calendar.current.component(.month, from: Date()) + monthOffset
            dateComponents.day = dayOffset
            dateComponents.year = Calendar.current.component(.year, from: Date())
            
            let startDate = Calendar.current.date(from: dateComponents) ?? Date()
            let endDate = Calendar.current.date(byAdding: .day, value: 1 + (i % 3), to: startDate) ?? Date()
            
            let dateFormatter = DateFormatter()
            dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSS'Z'"
            
            events.append(Event(
                id: UUID().uuidString,
                title: titles[titleIndex],
                description: descriptions[descIndex],
                categoryId: UUID().uuidString,
                category: Category.mock(name: categories[catIndex]),
                location: Location(
                    type: "Point",
                    city: cities[cityIndex],
                    address: "\(100 + i) Main St",
                    coordinates: [37.7749 + Double(i) * 0.01, -122.4194 - Double(i) * 0.01]
                ),
                startDate: dateFormatter.string(from: startDate),
                endDate: dateFormatter.string(from: endDate),
                price: Double(50 + (i * 25) % 200),
                capacity: 100 + (i * 50) % 500,
                isPublic: true,
                images: ["https://picsum.photos/800/500?random=\(i+1)"],
                tags: ["event", categories[catIndex].lowercased(), "featured"],
                organizer: nil,
                attendees: nil,
                attendeeCount: 50 + (i * 10) % 400,
                interestedCount: 100 + (i * 15) % 600,
                rating: 3.5 + Double(i % 3) * 0.5,
                reviewCount: 10 + (i * 5) % 50,
                createdAt: "2023-01-01T10:00:00.000Z",
                updatedAt: "2023-01-15T14:30:00.000Z",
                status: .upcoming,
                distance: Double(1 + i % 10)
            ))
        }
        
        return events
    }
}

// MARK: - Event Response
struct EventResponse: Codable {
    let success: Bool
    let data: Event
    let message: String?
}

struct EventListResponse: Codable {
    let success: Bool
    let data: EventListData
    let message: String?
}

struct EventListData: Codable {
    let events: [Event]
    let total: Int
    let page: Int
    let totalPages: Int
}

// MARK: - Event Creation Request
struct EventCreateRequest: Codable {
    let title: String
    let description: String
    let date: String
    let time: String
    let location: EventLocation
    let category: String
    let categoryId: String
    let maxAttendees: Int
    let price: Double
    let tags: [String]
    let imageUrl: String?
    let eventType: EventType
    let visibility: EventVisibility
    let isRegistrationRequired: Bool
}

// MARK: - Event Update Request
struct EventUpdateRequest: Codable {
    let title: String?
    let description: String?
    let date: String?
    let time: String?
    let location: EventLocation?
    let category: String?
    let categoryId: String?
    let maxAttendees: Int?
    let price: Double?
    let tags: [String]?
    let imageUrl: String?
    let eventType: EventType?
    let visibility: EventVisibility?
    let isRegistrationRequired: Bool?
    let status: EventStatus?
}

// MARK: - Event Search Request
struct EventSearchRequest: Codable {
    let query: String?
    let category: String?
    let location: String?
    let startDate: String?
    let endDate: String?
    let priceMin: Double?
    let priceMax: Double?
    let eventType: EventType?
    let visibility: EventVisibility?
    let page: Int?
    let limit: Int?
    let sortBy: String?
    let sortOrder: String?
}

// MARK: - Event Registration
struct EventRegistration: Codable {
    let id: String
    let eventId: String
    let userId: String
    let userName: String
    let userEmail: String
    let registeredAt: String
    let status: RegistrationStatus
    let ticketType: String?
    let paymentStatus: PaymentStatus?
    let paymentId: String?
}

enum RegistrationStatus: String, Codable {
    case pending = "PENDING"
    case confirmed = "CONFIRMED"
    case cancelled = "CANCELLED"
    case waitlisted = "WAITLISTED"
}

enum PaymentStatus: String, Codable {
    case pending = "PENDING"
    case completed = "COMPLETED"
    case failed = "FAILED"
    case refunded = "REFUNDED"
}

// MARK: - Event Analytics
struct EventAnalytics: Codable {
    let eventId: String
    let views: Int
    let registrations: Int
    let cancellations: Int
    let noShows: Int
    let revenue: Double
    let averageRating: Double
    let totalReviews: Int
    let shareCount: Int
    let likeCount: Int
    let commentCount: Int
    let conversionRate: Double
    let topReferrers: [String]
    let demographicData: DemographicData?
}

struct DemographicData: Codable {
    let ageGroups: [String: Int]
    let genders: [String: Int]
    let locations: [String: Int]
    let interests: [String: Int]
}

// MARK: - Event Review
struct EventReview: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let userName: String
    let userAvatar: String?
    let rating: Int
    let title: String?
    let comment: String
    let createdAt: String
    let updatedAt: String
    let isVerified: Bool
    let helpfulCount: Int
    let reportCount: Int
}

// MARK: - Event Comment
struct EventComment: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let userName: String
    let userAvatar: String?
    let comment: String
    let createdAt: String
    let updatedAt: String
    let parentId: String?
    let replies: [EventComment]?
    let likeCount: Int
    let isLiked: Bool
}

// MARK: - Event Category
struct EventCategory: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let icon: String
    let color: String
    let isActive: Bool
    let eventCount: Int
    let order: Int
}

// MARK: - Event Filter
struct EventFilter: Codable {
    let categories: [String]
    let locations: [String]
    let dateRange: DateRange?
    let priceRange: PriceRange?
    let eventTypes: [EventType]
    let features: [String]
    let rating: Double?
    let sortBy: SortOption
    let sortOrder: SortOrder
}

struct DateRange: Codable {
    let startDate: String
    let endDate: String
}

struct PriceRange: Codable {
    let min: Double
    let max: Double
}

enum SortOption: String, Codable {
    case date = "date"
    case price = "price"
    case popularity = "popularity"
    case rating = "rating"
    case distance = "distance"
    case relevance = "relevance"
}

enum SortOrder: String, Codable {
    case ascending = "asc"
    case descending = "desc"
}

// MARK: - Event Ticket
struct EventTicket: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let ticketType: String
    let price: Double
    let quantity: Int
    let totalAmount: Double
    let purchaseDate: String
    let status: TicketStatus
    let qrCode: String
    let validUntil: String
    let isTransferable: Bool
    let isRefundable: Bool
    let paymentMethod: String
    let paymentId: String
}

enum TicketStatus: String, Codable {
    case active = "ACTIVE"
    case used = "USED"
    case expired = "EXPIRED"
    case cancelled = "CANCELLED"
    case refunded = "REFUNDED"
}

// MARK: - Event Notification
struct EventNotification: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let type: NotificationType
    let title: String
    let message: String
    let scheduledAt: String
    let sentAt: String?
    let status: NotificationStatus
    let channels: [NotificationChannel]
}

enum NotificationType: String, Codable {
    case reminder = "REMINDER"
    case update = "UPDATE"
    case cancellation = "CANCELLATION"
    case registration = "REGISTRATION"
    case payment = "PAYMENT"
}

enum NotificationStatus: String, Codable {
    case pending = "PENDING"
    case sent = "SENT"
    case failed = "FAILED"
    case cancelled = "CANCELLED"
}

enum NotificationChannel: String, Codable {
    case push = "PUSH"
    case email = "EMAIL"
    case sms = "SMS"
}
