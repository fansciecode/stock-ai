import Foundation

protocol EventAPIService: BaseAPIService {
    func getEvents() async throws -> [Event]
    func getEventById(eventId: String) async throws -> Event
    func createEvent(event: EventRequest) async throws -> Event
    func updateEvent(eventId: String, event: EventUpdateRequest) async throws -> Event
    func deleteEvent(eventId: String) async throws
    func registerForEvent(eventId: String) async throws -> Event
    func unregisterFromEvent(eventId: String) async throws -> Event
    func getNearbyEvents(latitude: Double, longitude: Double, radius: Double) async throws -> [Event]
    func searchEvents(query: String) async throws -> [Event]
    func getUpcomingEvents() async throws -> [Event]
    func getPopularEvents() async throws -> [Event]
    func getTrendingEvents() async throws -> [Event]
    func getEventsByCategory(category: String) async throws -> [Event]
    func getUserEvents(userId: String) async throws -> [Event]
    func getEventRequests(eventId: String) async throws -> [EventRequest]
    func createEventRequest(eventId: String, request: EventRequest) async throws -> EventRequest
    func updateEventRequest(eventId: String, requestId: String, request: EventRequest) async throws -> EventRequest
    func addEventReview(eventId: String, review: Review) async throws -> Review
    func getEventReviews(eventId: String) async throws -> [Review]
    func upgradeEventVisibility(eventId: String, visibility: String) async throws -> Event
    func joinEvent(eventId: String) async throws
    func leaveEvent(eventId: String) async throws
    func addComment(eventId: String, comment: String) async throws -> Event
    func deleteComment(eventId: String, commentId: String) async throws -> Event
    func setReminder(eventId: String, enabled: Bool) async throws -> Event
    func getEventRating(eventId: String) async throws -> Float
    func rateEvent(eventId: String, rating: Float, review: String?) async throws -> Event
    func getEventUpdates(eventId: String) async throws -> AsyncStream<Event>
}

struct EventRequest: Codable {
    let title: String
    let description: String
    let category: String
    let date: String
    let time: String
    let location: String
    let maxAttendees: Int
    let latitude: Double?
    let longitude: Double?
    let imageUrl: String?
}

struct EventUpdateRequest: Codable {
    let title: String?
    let description: String?
    let category: String?
    let date: String?
    let time: String?
    let location: String?
    let maxAttendees: Int?
    let status: String?
}

struct Review: Codable {
    let id: String
    let userId: String
    let eventId: String
    let rating: Float
    let comment: String?
    let createdAt: Date
}

class EventAPIServiceImpl: EventAPIService {
    private let webSocketService: WebSocketService
    
    init(webSocketService: WebSocketService = WebSocketService.shared) {
        self.webSocketService = webSocketService
    }
    
    func getEvents() async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getEventById(eventId: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func createEvent(event: EventRequest) async throws -> Event {
        return try await apiService.request(
            endpoint: "events",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(event)
        )
    }
    
    func updateEvent(eventId: String, event: EventUpdateRequest) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(event)
        )
    }
    
    func deleteEvent(eventId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "events/\(eventId)",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func registerForEvent(eventId: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/register",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func unregisterFromEvent(eventId: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/unregister",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func getNearbyEvents(latitude: Double, longitude: Double, radius: Double) async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/nearby",
            method: HTTPMethod.get.rawValue,
            queryItems: [
                URLQueryItem(name: "lat", value: String(latitude)),
                URLQueryItem(name: "lng", value: String(longitude)),
                URLQueryItem(name: "radius", value: String(radius))
            ]
        )
    }
    
    func searchEvents(query: String) async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/search",
            method: HTTPMethod.get.rawValue,
            queryItems: [URLQueryItem(name: "query", value: query)]
        )
    }
    
    func getUpcomingEvents() async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/upcoming",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getPopularEvents() async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/popular",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getTrendingEvents() async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/trending",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getEventsByCategory(category: String) async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/category/\(category)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getUserEvents(userId: String) async throws -> [Event] {
        return try await apiService.request(
            endpoint: "events/user/\(userId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getEventRequests(eventId: String) async throws -> [EventRequest] {
        return try await apiService.request(
            endpoint: "events/\(eventId)/requests",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func createEventRequest(eventId: String, request: EventRequest) async throws -> EventRequest {
        return try await apiService.request(
            endpoint: "events/\(eventId)/requests",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func updateEventRequest(eventId: String, requestId: String, request: EventRequest) async throws -> EventRequest {
        return try await apiService.request(
            endpoint: "events/\(eventId)/requests/\(requestId)",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func addEventReview(eventId: String, review: Review) async throws -> Review {
        return try await apiService.request(
            endpoint: "events/\(eventId)/reviews",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(review)
        )
    }
    
    func getEventReviews(eventId: String) async throws -> [Review] {
        return try await apiService.request(
            endpoint: "events/\(eventId)/reviews",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func upgradeEventVisibility(eventId: String, visibility: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/visibility",
            method: HTTPMethod.put.rawValue,
            queryItems: [URLQueryItem(name: "visibility", value: visibility)]
        )
    }
    
    func joinEvent(eventId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "events/\(eventId)/join",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func leaveEvent(eventId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "events/\(eventId)/leave",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func addComment(eventId: String, comment: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/comments",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(["comment": comment])
        )
    }
    
    func deleteComment(eventId: String, commentId: String) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/comments/\(commentId)",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func setReminder(eventId: String, enabled: Bool) async throws -> Event {
        return try await apiService.request(
            endpoint: "events/\(eventId)/reminder",
            method: HTTPMethod.put.rawValue,
            queryItems: [URLQueryItem(name: "enabled", value: String(enabled))]
        )
    }
    
    func getEventRating(eventId: String) async throws -> Float {
        let response: [String: Float] = try await apiService.request(
            endpoint: "events/\(eventId)/rating",
            method: HTTPMethod.get.rawValue
        )
        return response["rating"] ?? 0.0
    }
    
    func rateEvent(eventId: String, rating: Float, review: String?) async throws -> Event {
        var queryItems = [URLQueryItem(name: "rating", value: String(rating))]
        if let review = review {
            queryItems.append(URLQueryItem(name: "review", value: review))
        }
        
        return try await apiService.request(
            endpoint: "events/\(eventId)/rate",
            method: HTTPMethod.post.rawValue,
            queryItems: queryItems
        )
    }
    
    func getEventUpdates(eventId: String) async throws -> AsyncStream<Event> {
        return try await webSocketService.subscribe(
            topic: "events.\(eventId)",
            messageType: Event.self
        )
    }
} 