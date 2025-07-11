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
struct Event: Identifiable, Codable, Hashable {
    let id: String
    let title: String
    let description: String
    let date: String? // ISO date string
    let time: String
    let location: EventLocation?
    let organizer: String
    let imageUrl: String?
    let price: Double
    let category: String
    let categoryId: String
    let maxAttendees: Int
    let currentAttendees: Int
    let status: EventStatus
    let tags: [String]
    let createdAt: Int64
    let updatedAt: Int64

    // Additional properties from Android
    let latitude: Double
    let longitude: Double
    let creatorId: String
    let isRegistrationRequired: Bool
    let isFeatured: Bool
    let attendees: [String]
    let interestedUsers: [String]
    let organizerId: String
    let visibility: EventVisibility
    let eventType: EventType

    // String versions for compatibility
    let startDate: String?
    let endDate: String?
    
    // Added property for distance (used in HomeView)
    var distance: Double?
    
    // Added computed property for MapKit coordinate
    var coordinate: CLLocationCoordinate2D {
        CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
    }

    // Computed properties
    var dateString: String {
        return startDate ?? date ?? ""
    }
    
    // Added computed property for formatted date display
    var formattedDate: String {
        guard let dateString = date else { return "Date TBD" }
        
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        guard let date = dateFormatter.date(from: dateString) else { return "Invalid date" }
        
        dateFormatter.dateFormat = "MMM d, yyyy • h:mm a"
        return dateFormatter.string(from: date)
    }

    var isUpcoming: Bool {
        return status == .upcoming
    }

    var isOngoing: Bool {
        return status == .ongoing
    }

    var isCompleted: Bool {
        return status == .completed
    }

    var isCancelled: Bool {
        return status == .cancelled
    }

    var spotsRemaining: Int {
        return max(0, maxAttendees - currentAttendees)
    }

    var isFullyBooked: Bool {
        return currentAttendees >= maxAttendees
    }

    // MARK: - Coding Keys
    enum CodingKeys: String, CodingKey {
        case id, title, description, date, time, location, organizer
        case imageUrl, price, category, categoryId, maxAttendees
        case currentAttendees, status, tags, createdAt, updatedAt
        case latitude, longitude, creatorId, isRegistrationRequired
        case isFeatured, attendees, interestedUsers, organizerId
        case visibility, eventType, startDate, endDate
    }

    // MARK: - Hashable
    func hash(into hasher: inout Hasher) {
        hasher.combine(id)
    }

    static func == (lhs: Event, rhs: Event) -> Bool {
        return lhs.id == rhs.id
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
