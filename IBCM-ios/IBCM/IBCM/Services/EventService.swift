//
//  EventService.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine

class EventService: ObservableObject {
    static let shared = EventService()

    @Published var events: [Event] = []
    @Published var featuredEvents: [Event] = []
    @Published var trendingEvents: [Event] = []
    @Published var nearbyEvents: [Event] = []
    @Published var userEvents: [Event] = []
    @Published var userBookings: [EventBooking] = []
    @Published var isLoading = false
    @Published var lastError: Error?

    private let networkService = NetworkService.shared
    private var cancellables = Set<AnyCancellable>()

    private init() {}

    // MARK: - Event Management
    func getAllEvents(page: Int = 1, limit: Int = 20, filters: EventFilter? = nil) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.events)")!

        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        // Add filters if provided
        if let filters = filters {
            if let search = filters.search {
                queryItems.append(URLQueryItem(name: "search", value: search))
            }
            if let categoryId = filters.categoryId {
                queryItems.append(URLQueryItem(name: "categoryId", value: categoryId))
            }
            if let eventType = filters.eventType {
                queryItems.append(URLQueryItem(name: "eventType", value: eventType.rawValue))
            }
            if let startDate = filters.startDate {
                queryItems.append(URLQueryItem(name: "startDate", value: ISO8601DateFormatter().string(from: startDate)))
            }
            if let endDate = filters.endDate {
                queryItems.append(URLQueryItem(name: "endDate", value: ISO8601DateFormatter().string(from: endDate)))
            }
            if let minPrice = filters.minPrice {
                queryItems.append(URLQueryItem(name: "minPrice", value: "\(minPrice)"))
            }
            if let maxPrice = filters.maxPrice {
                queryItems.append(URLQueryItem(name: "maxPrice", value: "\(maxPrice)"))
            }
            if let location = filters.location {
                queryItems.append(URLQueryItem(name: "location", value: location))
            }
            if let latitude = filters.latitude {
                queryItems.append(URLQueryItem(name: "latitude", value: "\(latitude)"))
            }
            if let longitude = filters.longitude {
                queryItems.append(URLQueryItem(name: "longitude", value: "\(longitude)"))
            }
            if let radius = filters.radius {
                queryItems.append(URLQueryItem(name: "radius", value: "\(radius)"))
            }
            if let isOnline = filters.isOnline {
                queryItems.append(URLQueryItem(name: "isOnline", value: "\(isOnline)"))
            }
            if let isFeatured = filters.isFeatured {
                queryItems.append(URLQueryItem(name: "isFeatured", value: "\(isFeatured)"))
            }
            if let hasAvailableSpots = filters.hasAvailableSpots {
                queryItems.append(URLQueryItem(name: "hasAvailableSpots", value: "\(hasAvailableSpots)"))
            }
            if let sortBy = filters.sortBy {
                queryItems.append(URLQueryItem(name: "sortBy", value: sortBy.rawValue))
            }
            if let sortOrder = filters.sortOrder {
                queryItems.append(URLQueryItem(name: "sortOrder", value: sortOrder.rawValue))
            }
        }

        urlComponents.queryItems = queryItems

        return networkService.request(url: urlComponents.url!)
            .handleEvents(receiveOutput: { [weak self] (response: EventsResponse) in
                if response.success, let eventsData = response.data {
                    DispatchQueue.main.async {
                        if page == 1 {
                            self?.events = eventsData.events
                        } else {
                            self?.events.append(contentsOf: eventsData.events)
                        }
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    func getEventById(_ eventId: String) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventDetails.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url)
            .eraseToAnyPublisher()
    }

    func createEvent(_ eventRequest: EventRequest) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.createEvent)")!

        return networkService.request(url: url, method: .POST, body: eventRequest)
            .eraseToAnyPublisher()
    }

    func updateEvent(_ eventId: String, eventRequest: EventRequest) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.updateEvent.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .PUT, body: eventRequest)
            .eraseToAnyPublisher()
    }

    func deleteEvent(_ eventId: String) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.deleteEvent.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .DELETE)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Search
    func searchEvents(query: String, filters: EventFilter? = nil) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.searchEvents)")!

        var queryItems: [URLQueryItem] = [
            URLQueryItem(name: "q", value: query)
        ]

        // Add filters if provided
        if let filters = filters {
            if let categoryId = filters.categoryId {
                queryItems.append(URLQueryItem(name: "categoryId", value: categoryId))
            }
            if let eventType = filters.eventType {
                queryItems.append(URLQueryItem(name: "eventType", value: eventType.rawValue))
            }
            if let minPrice = filters.minPrice {
                queryItems.append(URLQueryItem(name: "minPrice", value: "\(minPrice)"))
            }
            if let maxPrice = filters.maxPrice {
                queryItems.append(URLQueryItem(name: "maxPrice", value: "\(maxPrice)"))
            }
            if let location = filters.location {
                queryItems.append(URLQueryItem(name: "location", value: location))
            }
            if let sortBy = filters.sortBy {
                queryItems.append(URLQueryItem(name: "sortBy", value: sortBy.rawValue))
            }
            if let sortOrder = filters.sortOrder {
                queryItems.append(URLQueryItem(name: "sortOrder", value: sortOrder.rawValue))
            }
        }

        urlComponents.queryItems = queryItems

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    // MARK: - Featured and Trending Events
    func getFeaturedEvents(limit: Int = 10) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.featuredEvents)")!
        urlComponents.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]

        return networkService.request(url: urlComponents.url!)
            .handleEvents(receiveOutput: { [weak self] (response: EventsResponse) in
                if response.success, let eventsData = response.data {
                    DispatchQueue.main.async {
                        self?.featuredEvents = eventsData.events
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    func getTrendingEvents(period: String = "week", limit: Int = 10) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.trendingEvents)")!
        urlComponents.queryItems = [
            URLQueryItem(name: "period", value: period),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .handleEvents(receiveOutput: { [weak self] (response: EventsResponse) in
                if response.success, let eventsData = response.data {
                    DispatchQueue.main.async {
                        self?.trendingEvents = eventsData.events
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    func getNearbyEvents(latitude: Double, longitude: Double, radius: Double = 10.0, limit: Int = 10) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.nearbyEvents)")!
        urlComponents.queryItems = [
            URLQueryItem(name: "latitude", value: "\(latitude)"),
            URLQueryItem(name: "longitude", value: "\(longitude)"),
            URLQueryItem(name: "radius", value: "\(radius)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .handleEvents(receiveOutput: { [weak self] (response: EventsResponse) in
                if response.success, let eventsData = response.data {
                    DispatchQueue.main.async {
                        self?.nearbyEvents = eventsData.events
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    // MARK: - Event Categories
    func getEventsByCategory(_ categoryId: String, page: Int = 1, limit: Int = 20) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventsByCategory.replacingOccurrences(of: "{categoryId}", with: categoryId))")!
        urlComponents.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    // MARK: - User Events
    func getUserAttendingEvents() -> AnyPublisher<EventsResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.getUserEvents)?type=attending")!

        return networkService.request(url: url)
            .eraseToAnyPublisher()
    }

    func getUserCreatedEvents() -> AnyPublisher<EventsResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.getUserEvents)?type=created")!

        return networkService.request(url: url)
            .handleEvents(receiveOutput: { [weak self] (response: EventsResponse) in
                if response.success, let eventsData = response.data {
                    DispatchQueue.main.async {
                        self?.userEvents = eventsData.events
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    func getUserBookings() -> AnyPublisher<EventBookingsResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.getUserBookings)")!

        return networkService.request(url: url)
            .handleEvents(receiveOutput: { [weak self] (response: EventBookingsResponse) in
                if response.success, let bookings = response.data {
                    DispatchQueue.main.async {
                        self?.userBookings = bookings
                    }
                }
            })
            .eraseToAnyPublisher()
    }

    // MARK: - Event Participation
    func joinEvent(_ eventId: String) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.joinEvent.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .POST)
            .eraseToAnyPublisher()
    }

    func leaveEvent(_ eventId: String) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.leaveEvent.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .POST)
            .eraseToAnyPublisher()
    }

    func bookEvent(_ eventId: String, bookingRequest: EventBookingRequest) -> AnyPublisher<EventBookingResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.bookEvent.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .POST, body: bookingRequest)
            .eraseToAnyPublisher()
    }

    func cancelBooking(_ eventId: String, bookingId: String) -> AnyPublisher<EventBookingResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.cancelBooking.replacingOccurrences(of: "{id}", with: eventId).replacingOccurrences(of: "{bookingId}", with: bookingId))")!

        return networkService.request(url: url, method: .DELETE)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Reviews
    func getEventReviews(_ eventId: String, page: Int = 1, limit: Int = 20) -> AnyPublisher<EventReviewsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))")!
        urlComponents.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    func addEventReview(_ eventId: String, reviewRequest: EventReviewRequest) -> AnyPublisher<EventReviewResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url, method: .POST, body: reviewRequest)
            .eraseToAnyPublisher()
    }

    func updateEventReview(_ eventId: String, reviewId: String, reviewRequest: EventReviewRequest) -> AnyPublisher<EventReviewResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))/\(reviewId)")!

        return networkService.request(url: url, method: .PUT, body: reviewRequest)
            .eraseToAnyPublisher()
    }

    func deleteEventReview(_ eventId: String, reviewId: String) -> AnyPublisher<EventReviewResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))/\(reviewId)")!

        return networkService.request(url: url, method: .DELETE)
            .eraseToAnyPublisher()
    }

    func markReviewHelpful(_ eventId: String, reviewId: String) -> AnyPublisher<EventReviewResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))/\(reviewId)/helpful")!

        return networkService.request(url: url, method: .POST)
            .eraseToAnyPublisher()
    }

    func reportEventReview(_ eventId: String, reviewId: String, reportRequest: ReportRequest) -> AnyPublisher<ReportResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventReviews.replacingOccurrences(of: "{id}", with: eventId))/\(reviewId)/report")!

        return networkService.request(url: url, method: .POST, body: reportRequest)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Attendees
    func getEventAttendees(_ eventId: String, page: Int = 1, limit: Int = 20) -> AnyPublisher<EventAttendeesResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventAttendees.replacingOccurrences(of: "{id}", with: eventId))")!
        urlComponents.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Media
    func uploadEventMedia(_ eventId: String, mediaData: Data, fileName: String, mimeType: String) -> AnyPublisher<EventMediaResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.uploadEventMedia.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.upload(url: url, data: mediaData, fileName: fileName, mimeType: mimeType)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Analytics
    func getEventAnalytics(_ eventId: String) -> AnyPublisher<EventAnalyticsResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)\(APIConfig.Endpoints.eventAnalytics.replacingOccurrences(of: "{id}", with: eventId))")!

        return networkService.request(url: url)
            .eraseToAnyPublisher()
    }

    // MARK: - AI-Enhanced Features
    func createOptimizedEvent(_ eventRequest: EventRequest) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/create-optimized")!

        return networkService.request(url: url, method: .POST, body: eventRequest)
            .eraseToAnyPublisher()
    }

    func getEventOptimizations(_ eventRequest: EventRequest) -> AnyPublisher<EventOptimizationsResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/optimize")!

        return networkService.request(url: url, method: .POST, body: eventRequest)
            .eraseToAnyPublisher()
    }

    func autoGenerateEvent(_ basicData: EventGenerationRequest) -> AnyPublisher<EventResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/auto-generate")!

        return networkService.request(url: url, method: .POST, body: basicData)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Suggestions
    func getEventSuggestions(limit: Int = 10) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)/events/suggestions")!
        urlComponents.queryItems = [URLQueryItem(name: "limit", value: "\(limit)")]

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    // MARK: - Event Sharing
    func shareEvent(_ eventId: String, shareRequest: EventShareRequest) -> AnyPublisher<EventShareResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/\(eventId)/share")!

        return networkService.request(url: url, method: .POST, body: shareRequest)
            .eraseToAnyPublisher()
    }

    func reportEvent(_ eventId: String, reportRequest: ReportRequest) -> AnyPublisher<ReportResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/\(eventId)/report")!

        return networkService.request(url: url, method: .POST, body: reportRequest)
            .eraseToAnyPublisher()
    }

    // MARK: - Organizer Management
    func followOrganizer(_ organizerId: String) -> AnyPublisher<FollowResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/organizer/\(organizerId)/follow")!

        return networkService.request(url: url, method: .POST)
            .eraseToAnyPublisher()
    }

    func unfollowOrganizer(_ organizerId: String) -> AnyPublisher<FollowResponse, Error> {
        let url = URL(string: "\(APIConfig.baseURL)/events/organizer/\(organizerId)/follow")!

        return networkService.request(url: url, method: .DELETE)
            .eraseToAnyPublisher()
    }

    func getOrganizerEvents(_ organizerId: String, page: Int = 1, limit: Int = 20) -> AnyPublisher<EventsResponse, Error> {
        var urlComponents = URLComponents(string: "\(APIConfig.baseURL)/events/organizer/\(organizerId)")!
        urlComponents.queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]

        return networkService.request(url: urlComponents.url!)
            .eraseToAnyPublisher()
    }

    // MARK: - Utility Methods
    func formatEventDate(_ date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }

    func formatEventDuration(_ startDate: Date, _ endDate: Date) -> String {
        let interval = endDate.timeIntervalSince(startDate)
        let hours = Int(interval) / 3600
        let minutes = Int(interval) % 3600 / 60

        if hours > 0 {
            return "\(hours)h \(minutes)m"
        } else {
            return "\(minutes)m"
        }
    }

    func formatEventPrice(_ price: Double, currency: String = "INR") -> String {
        if price == 0 {
            return "Free"
        }
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: price)) ?? "\(currency) \(price)"
    }

    func getEventStatus(_ event: Event) -> String {
        let now = Date()
        if now < event.startDate {
            return "Upcoming"
        } else if now >= event.startDate && now <= event.endDate {
            return "Ongoing"
        } else {
            return "Completed"
        }
    }

    func getEventTypeIcon(_ eventType: EventType) -> String {
        return eventType.rawValue
    }

    func calculateDistance(from userLocation: CLLocation, to eventLocation: CLLocation) -> Double {
        return userLocation.distance(from: eventLocation) / 1000.0 // Convert to kilometers
    }

    func isEventFavorited(_ eventId: String) -> Bool {
        // Check if event is in user's favorites
        // This would typically be stored in UserDefaults or Core Data
        return UserDefaults.standard.bool(forKey: "favorite_\(eventId)")
    }

    func toggleEventFavorite(_ eventId: String) {
        let currentState = isEventFavorited(eventId)
        UserDefaults.standard.set(!currentState, forKey: "favorite_\(eventId)")
    }

    func getEventAvailability(_ event: Event) -> String {
        guard let maxAttendees = event.maxAttendees else {
            return "Unlimited"
        }

        let available = maxAttendees - event.currentAttendees
        if available <= 0 {
            return "Full"
        } else if available <= 5 {
            return "Only \(available) spots left"
        } else {
            return "\(available) spots available"
        }
    }

    func canUserJoinEvent(_ event: Event) -> Bool {
        // Check if user can join the event
        let now = Date()
        let isNotFull = event.maxAttendees == nil || event.currentAttendees < event.maxAttendees!
        let isNotPast = event.startDate > now
        let isPublic = event.visibility == .public

        return isNotFull && isNotPast && isPublic
    }

    func getEventRegistrationDeadline(_ event: Event) -> Date? {
        // Return registration deadline (e.g., 1 hour before event start)
        return Calendar.current.date(byAdding: .hour, value: -1, to: event.startDate)
    }

    func isRegistrationOpen(_ event: Event) -> Bool {
        guard let deadline = getEventRegistrationDeadline(event) else {
            return event.startDate > Date()
        }
        return Date() < deadline
    }
}

// MARK: - Response Models
struct EventBookingsResponse: Codable {
    let success: Bool
    let data: [EventBooking]?
    let message: String?
    let error: String?
}

struct EventReviewsResponse: Codable {
    let success: Bool
    let data: EventReviewsData?
    let message: String?
    let error: String?
}

struct EventReviewsData: Codable {
    let reviews: [Review]
    let total: Int
    let page: Int
    let limit: Int
    let averageRating: Double
}

struct EventReviewResponse: Codable {
    let success: Bool
    let data: Review?
    let message: String?
    let error: String?
}

struct EventAttendeesResponse: Codable {
    let success: Bool
    let data: EventAttendeesData?
    let message: String?
    let error: String?
}

struct EventAttendeesData: Codable {
    let attendees: [EventAttendee]
    let total: Int
    let page: Int
    let limit: Int
}

struct EventAttendee: Identifiable, Codable {
    let id: String
    let name: String
    let avatar: String?
    let joinedAt: Date
    let isOrganizer: Bool
    let role: String?
}

struct EventMediaResponse: Codable {
    let success: Bool
    let data: EventMediaData?
    let message: String?
    let error: String?
}

struct EventMediaData: Codable {
    let mediaUrls: [String]
    let thumbnails: [String]
}

struct EventOptimizationsResponse: Codable {
    let success: Bool
    let data: EventOptimizations?
    let message: String?
    let error: String?
}

struct EventOptimizations: Codable {
    let titleSuggestions: [String]
    let descriptionSuggestions: [String]
    let pricingRecommendations: [PricingRecommendation]
    let timingRecommendations: [TimingRecommendation]
    let categoryRecommendations: [String]
    let tagSuggestions: [String]
}

struct PricingRecommendation: Codable {
    let price: Double
    let reasoning: String
    let expectedAttendees: Int
}

struct TimingRecommendation: Codable {
    let startTime: Date
    let endTime: Date
    let reasoning: String
    let expectedAttendance: Double
}

struct EventShareResponse: Codable {
    let success: Bool
    let data: EventShareData?
    let message: String?
    let error: String?
}

struct EventShareData: Codable {
    let shareUrl: String
    let shareCount: Int
}

struct FollowResponse: Codable {
    let success: Bool
    let data: FollowData?
    let message: String?
    let error: String?
}

struct FollowData: Codable {
    let isFollowing: Bool
    let followersCount: Int
}

// MARK: - Request Models
struct EventBookingRequest: Codable {
    let ticketTypeId: String?
    let quantity: Int
    let attendeeDetails: [AttendeeDetail]
    let notes: String?
    let paymentMethodId: String?
}

struct EventBookingResponse: Codable {
    let success: Bool
    let data: EventBooking?
    let message: String?
    let error: String?
}

struct EventReviewRequest: Codable {
    let rating: Int
    let comment: String
    let images: [String]?
}

struct EventGenerationRequest: Codable {
    let title: String
    let description: String
    let category: String
    let eventType: EventType
    let targetAudience: String?
    let budget: Double?
    let duration: Int? // in minutes
    let preferences: [String: String]?
}

struct EventShareRequest: Codable {
    let platform: String
    let customMessage: String?
}

struct ReportRequest: Codable {
    let reason: String
    let description: String
    let evidence: [String]?
}

struct ReportResponse: Codable {
    let success: Bool
    let data: ReportData?
    let message: String?
    let error: String?
}

struct ReportData: Codable {
    let reportId: String
    let status: String
}

import CoreLocation
