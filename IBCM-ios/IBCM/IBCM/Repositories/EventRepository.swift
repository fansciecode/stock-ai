import Foundation

protocol EventRepository {
    func createEvent(event: Event) async throws -> Event
    func getEventById(eventId: String) async throws -> Event
    func updateEvent(event: Event) async throws -> Event
    func deleteEvent(eventId: String) async throws
    func searchEvents(query: String) async throws -> [Event]
    func getEventsByCategory(category: String) async throws -> [Event]
    func getEventsByUser(userId: String) async throws -> [Event]
    func joinEvent(eventId: String) async throws -> Event
    func leaveEvent(eventId: String) async throws -> Event
    func addEventReview(eventId: String, review: Review) async throws -> Review
    func addComment(eventId: String, text: String) async throws -> Event
    func addCommentWithImage(eventId: String, text: String, imageUrl: String) async throws -> Event
    func deleteComment(eventId: String, commentId: String) async throws -> Event
    func setReminder(eventId: String, enabled: Bool) async throws -> Event
    func upgradeEventVisibility(eventId: String) async throws -> Event
    func observeEvent(eventId: String) -> AsyncStream<Event>
    func observeEventsByCategory(category: String) -> AsyncStream<[Event]>
    func observeEventsByUser(userId: String) -> AsyncStream<[Event]>
    func getNearbyEvents(latitude: Double, longitude: Double, radius: Double) async throws -> [Event]
    func getUpcomingEvents() async throws -> [Event]
    func getPopularEvents() async throws -> [Event]
    func getEventRequests(eventId: String) async throws -> [EventRequest]
    func createEventRequest(request: EventRequest) async throws -> EventRequest
    func updateEventRequest(request: EventRequest) async throws -> EventRequest
    func getEventReviews(eventId: String) async throws -> [Review]
    func getRating(eventId: String) async throws -> Float
    func rateEvent(eventId: String, rating: Float, review: String?) async throws -> Event
    func getEventUpdates(eventId: String) async throws -> Event
}

class EventRepositoryImpl: EventRepository {
    private let apiService: APIService
    private let webSocket: WebSocketService
    private let cache: NSCache<NSString, CachedEvent>
    private var eventObservers: [String: AsyncStream<Event>] = [:]
    private var categoryObservers: [String: AsyncStream<[Event]>] = [:]
    private var userObservers: [String: AsyncStream<[Event]>] = [:]
    
    init(apiService: APIService = .shared, webSocket: WebSocketService = .shared) {
        self.apiService = apiService
        self.webSocket = webSocket
        self.cache = NSCache()
    }
    
    func createEvent(event: Event) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events",
            method: "POST",
            body: try JSONEncoder().encode(event)
        )
        
        let createdEvent = response.data
        cache.setObject(CachedEvent(event: createdEvent, timestamp: Date()), forKey: createdEvent.id as NSString)
        return createdEvent
    }
    
    func getEventById(eventId: String) async throws -> Event {
        if let cached = cache.object(forKey: eventId as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.event
            }
        }
        
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)",
            method: "GET"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func updateEvent(event: Event) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(event.id)",
            method: "PUT",
            body: try JSONEncoder().encode(event)
        )
        
        let updatedEvent = response.data
        cache.setObject(CachedEvent(event: updatedEvent, timestamp: Date()), forKey: updatedEvent.id as NSString)
        return updatedEvent
    }
    
    func deleteEvent(eventId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/events/\(eventId)",
            method: "DELETE"
        )
        
        if response.success {
            cache.removeObject(forKey: eventId as NSString)
        } else {
            throw EventError.deleteFailed
        }
    }
    
    func searchEvents(query: String) async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/search",
            method: "GET",
            queryItems: [URLQueryItem(name: "query", value: query)]
        )
        
        response.data.forEach { event in
            cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        }
        
        return response.data
    }
    
    func getEventsByCategory(category: String) async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/category/\(category)",
            method: "GET"
        )
        
        response.data.forEach { event in
            cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        }
        
        return response.data
    }
    
    func getEventsByUser(userId: String) async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/user/\(userId)",
            method: "GET"
        )
        
        response.data.forEach { event in
            cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        }
        
        return response.data
    }
    
    func joinEvent(eventId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/join",
            method: "POST"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func leaveEvent(eventId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/leave",
            method: "POST"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func addEventReview(eventId: String, review: Review) async throws -> Review {
        let response: ReviewResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/reviews",
            method: "POST",
            body: try JSONEncoder().encode(review)
        )
        return response.data
    }
    
    func addComment(eventId: String, text: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/comments",
            method: "POST",
            body: try JSONEncoder().encode(["text": text])
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func addCommentWithImage(eventId: String, text: String, imageUrl: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/comments",
            method: "POST",
            body: try JSONEncoder().encode([
                "text": text,
                "imageUrl": imageUrl
            ])
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func deleteComment(eventId: String, commentId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/comments/\(commentId)",
            method: "DELETE"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func setReminder(eventId: String, enabled: Bool) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/reminder",
            method: "PUT",
            body: try JSONEncoder().encode(["enabled": enabled])
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func upgradeEventVisibility(eventId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/upgrade",
            method: "POST"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func observeEvent(eventId: String) -> AsyncStream<Event> {
        if let existing = eventObservers[eventId] {
            return existing
        }
        
        let stream = AsyncStream<Event> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "event.\(eventId)") {
                    if let event = try? JSONDecoder().decode(Event.self, from: message) {
                        continuation.yield(event)
                    }
                }
            }
        }
        
        eventObservers[eventId] = stream
        return stream
    }
    
    func observeEventsByCategory(category: String) -> AsyncStream<[Event]> {
        if let existing = categoryObservers[category] {
            return existing
        }
        
        let stream = AsyncStream<[Event]> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "events.category.\(category)") {
                    if let events = try? JSONDecoder().decode([Event].self, from: message) {
                        continuation.yield(events)
                    }
                }
            }
        }
        
        categoryObservers[category] = stream
        return stream
    }
    
    func observeEventsByUser(userId: String) -> AsyncStream<[Event]> {
        if let existing = userObservers[userId] {
            return existing
        }
        
        let stream = AsyncStream<[Event]> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "events.user.\(userId)") {
                    if let events = try? JSONDecoder().decode([Event].self, from: message) {
                        continuation.yield(events)
                    }
                }
            }
        }
        
        userObservers[userId] = stream
        return stream
    }
    
    func getNearbyEvents(latitude: Double, longitude: Double, radius: Double) async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/nearby",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "latitude", value: "\(latitude)"),
                URLQueryItem(name: "longitude", value: "\(longitude)"),
                URLQueryItem(name: "radius", value: "\(radius)")
            ]
        )
        return response.data
    }
    
    func getUpcomingEvents() async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/upcoming",
            method: "GET"
        )
        return response.data
    }
    
    func getPopularEvents() async throws -> [Event] {
        let response: EventListResponse = try await apiService.request(
            endpoint: "/events/popular",
            method: "GET"
        )
        return response.data
    }
    
    func getEventRequests(eventId: String) async throws -> [EventRequest] {
        let response: EventRequestListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/requests",
            method: "GET"
        )
        return response.data
    }
    
    func createEventRequest(request: EventRequest) async throws -> EventRequest {
        let response: EventRequestResponse = try await apiService.request(
            endpoint: "/events/requests",
            method: "POST",
            body: try JSONEncoder().encode(request)
        )
        return response.data
    }
    
    func updateEventRequest(request: EventRequest) async throws -> EventRequest {
        let response: EventRequestResponse = try await apiService.request(
            endpoint: "/events/requests/\(request.id)",
            method: "PUT",
            body: try JSONEncoder().encode(request)
        )
        return response.data
    }
    
    func getEventReviews(eventId: String) async throws -> [Review] {
        let response: ReviewListResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/reviews",
            method: "GET"
        )
        return response.data
    }
    
    func getRating(eventId: String) async throws -> Float {
        let response: RatingResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/rating",
            method: "GET"
        )
        return response.rating
    }
    
    func rateEvent(eventId: String, rating: Float, review: String?) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/rate",
            method: "POST",
            body: try JSONEncoder().encode([
                "rating": rating,
                "review": review
            ])
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
    
    func getEventUpdates(eventId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "/events/\(eventId)/updates",
            method: "GET"
        )
        
        let event = response.data
        cache.setObject(CachedEvent(event: event, timestamp: Date()), forKey: event.id as NSString)
        return event
    }
}

// MARK: - Cache Types
private class CachedEvent {
    let event: Event
    let timestamp: Date
    
    init(event: Event, timestamp: Date) {
        self.event = event
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct EventResponse: Codable {
    let success: Bool
    let data: Event
    let message: String?
}

struct EventListResponse: Codable {
    let success: Bool
    let data: [Event]
    let message: String?
}

struct ReviewResponse: Codable {
    let success: Bool
    let data: Review
    let message: String?
}

struct ReviewListResponse: Codable {
    let success: Bool
    let data: [Review]
    let message: String?
}

struct EventRequestResponse: Codable {
    let success: Bool
    let data: EventRequest
    let message: String?
}

struct EventRequestListResponse: Codable {
    let success: Bool
    let data: [EventRequest]
    let message: String?
}

struct RatingResponse: Codable {
    let success: Bool
    let rating: Float
    let message: String?
}

// MARK: - Errors
enum EventError: LocalizedError {
    case invalidEvent
    case eventNotFound
    case createFailed
    case updateFailed
    case deleteFailed
    case joinFailed
    case leaveFailed
    case reviewFailed
    case commentFailed
    case upgradeFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidEvent:
            return "Invalid event"
        case .eventNotFound:
            return "Event not found"
        case .createFailed:
            return "Failed to create event"
        case .updateFailed:
            return "Failed to update event"
        case .deleteFailed:
            return "Failed to delete event"
        case .joinFailed:
            return "Failed to join event"
        case .leaveFailed:
            return "Failed to leave event"
        case .reviewFailed:
            return "Failed to add review"
        case .commentFailed:
            return "Failed to add comment"
        case .upgradeFailed:
            return "Failed to upgrade event visibility"
        }
    }
} 