//
//  EventService.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine

class EventService {
    static let shared = EventService()
    
    // API endpoints
    private let eventsEndpoint = "events"
    private let categoriesEndpoint = "categories"
    private let bookingsEndpoint = "bookings"
    private let reviewsEndpoint = "reviews"
    
    // API service for network calls
    private let apiService = APIService.shared
    
    // MARK: - Event Methods
    
    func getEvents(page: Int = 1, limit: Int = 20, filters: EventFilters? = nil) async throws -> EventsResponse {
        var queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let filters = filters {
            if let categoryId = filters.categoryId {
                queryItems.append(URLQueryItem(name: "categoryId", value: categoryId))
            }
            
            if let searchQuery = filters.searchQuery, !searchQuery.isEmpty {
                queryItems.append(URLQueryItem(name: "search", value: searchQuery))
            }
            
            if let location = filters.location, let lat = location.coordinates?[0], let lng = location.coordinates?[1] {
                queryItems.append(URLQueryItem(name: "lat", value: "\(lat)"))
                queryItems.append(URLQueryItem(name: "lng", value: "\(lng)"))
                
                if let radius = filters.radius {
                    queryItems.append(URLQueryItem(name: "radius", value: "\(radius)"))
                }
            }
            
            if let startDate = filters.startDate {
                queryItems.append(URLQueryItem(name: "startDate", value: startDate))
            }
            
            if let endDate = filters.endDate {
                queryItems.append(URLQueryItem(name: "endDate", value: endDate))
            }
            
            if let minPrice = filters.minPrice {
                queryItems.append(URLQueryItem(name: "minPrice", value: "\(minPrice)"))
            }
            
            if let maxPrice = filters.maxPrice {
                queryItems.append(URLQueryItem(name: "maxPrice", value: "\(maxPrice)"))
            }
            
            if let sortBy = filters.sortBy {
                queryItems.append(URLQueryItem(name: "sortBy", value: sortBy))
            }
            
            if let sortOrder = filters.sortOrder {
                queryItems.append(URLQueryItem(name: "sortOrder", value: sortOrder))
            }
        }
        
        return try await apiService.request(
            endpoint: eventsEndpoint,
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func getEventById(eventId: String) async throws -> Event {
        let response: EventResponse = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)",
            method: "GET"
        )
        
        return response.data
    }
    
    func createEvent(event: CreateEventRequest) async throws -> Event {
        let data = try JSONEncoder().encode(event)
        
        let response: EventResponse = try await apiService.request(
            endpoint: eventsEndpoint,
            method: "POST",
            body: data
        )
        
        return response.data
    }
    
    func updateEvent(eventId: String, event: UpdateEventRequest) async throws -> Event {
        let data = try JSONEncoder().encode(event)
        
        let response: EventResponse = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)",
            method: "PUT",
            body: data
        )
        
        return response.data
    }
    
    func deleteEvent(eventId: String) async throws -> Bool {
        let response: ApiResponse<Bool> = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)",
            method: "DELETE"
        )
        
        return response.success
    }
    
    func getEventsByCategory(categoryId: String, page: Int = 1, limit: Int = 20) async throws -> EventsResponse {
        let queryItems = [
            URLQueryItem(name: "categoryId", value: categoryId),
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        return try await apiService.request(
            endpoint: eventsEndpoint,
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func getEventsByUser(userId: String, page: Int = 1, limit: Int = 20) async throws -> EventsResponse {
        let queryItems = [
            URLQueryItem(name: "userId", value: userId),
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        return try await apiService.request(
            endpoint: eventsEndpoint,
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func searchEvents(query: String, page: Int = 1, limit: Int = 20) async throws -> EventsResponse {
        let queryItems = [
            URLQueryItem(name: "search", value: query),
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        return try await apiService.request(
            endpoint: eventsEndpoint,
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func getNearbyEvents(latitude: Double, longitude: Double, radius: Int = 10, page: Int = 1, limit: Int = 20) async throws -> EventsResponse {
        let queryItems = [
            URLQueryItem(name: "lat", value: "\(latitude)"),
            URLQueryItem(name: "lng", value: "\(longitude)"),
            URLQueryItem(name: "radius", value: "\(radius)"),
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        return try await apiService.request(
            endpoint: "\(eventsEndpoint)/nearby",
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func getEventReviews(eventId: String, page: Int = 1, limit: Int = 20) async throws -> ReviewsResponse {
        let queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        return try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)/reviews",
            method: "GET",
            queryItems: queryItems
        )
    }
    
    func addEventReview(eventId: String, review: CreateReviewRequest) async throws -> Review {
        let data = try JSONEncoder().encode(review)
        
        let response: ReviewResponse = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)/reviews",
            method: "POST",
            body: data
        )
        
        return response.data
    }
    
    func bookEvent(eventId: String, booking: CreateBookingRequest) async throws -> Booking {
        let data = try JSONEncoder().encode(booking)
        
        let response: BookingResponse = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)/bookings",
            method: "POST",
            body: data
        )
        
        return response.data
    }
    
    func uploadEventImage(eventId: String, imageData: Data, fileName: String) async throws -> String {
        let multipartData = [
            "image": MultipartData(
                data: imageData,
                mimeType: "image/jpeg",
                filename: fileName
            )
        ]
        
        let response: ImageUploadResponse = try await apiService.request(
            endpoint: "\(eventsEndpoint)/\(eventId)/images",
            method: "POST",
            multipartData: multipartData
        )
        
        return response.imageUrl
    }
}

// MARK: - Request Models
struct EventFilters {
    let categoryId: String?
    let searchQuery: String?
    let location: Location?
    let radius: Int?
    let startDate: String?
    let endDate: String?
    let minPrice: Double?
    let maxPrice: Double?
    let sortBy: String?
    let sortOrder: String?
}

struct CreateEventRequest: Codable {
    let title: String
    let description: String
    let categoryId: String
    let location: Location
    let startDate: String
    let endDate: String
    let price: Double?
    let capacity: Int?
    let isPublic: Bool
    let images: [String]?
    let tags: [String]?
}

struct UpdateEventRequest: Codable {
    let title: String?
    let description: String?
    let categoryId: String?
    let location: Location?
    let startDate: String?
    let endDate: String?
    let price: Double?
    let capacity: Int?
    let isPublic: Bool?
    let images: [String]?
    let tags: [String]?
}

struct CreateReviewRequest: Codable {
    let rating: Int
    let comment: String?
    let images: [String]?
}

struct CreateBookingRequest: Codable {
    let quantity: Int
    let paymentMethod: String
    let notes: String?
}

// MARK: - Response Models
struct EventsResponse: Codable {
    let success: Bool
    let data: [Event]
    let pagination: PaginationInfo?
    let message: String?
}

struct EventResponse: Codable {
    let success: Bool
    let data: Event
    let message: String?
}

struct ReviewsResponse: Codable {
    let success: Bool
    let data: [Review]
    let pagination: PaginationInfo?
    let message: String?
}

struct ReviewResponse: Codable {
    let success: Bool
    let data: Review
    let message: String?
}

struct BookingResponse: Codable {
    let success: Bool
    let data: Booking
    let message: String?
}

struct ImageUploadResponse: Codable {
    let success: Bool
    let imageUrl: String
    let message: String?
}
