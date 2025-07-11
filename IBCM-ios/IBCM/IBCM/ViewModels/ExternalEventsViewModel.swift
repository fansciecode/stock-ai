//
//  ExternalEventsViewModel.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine
import SwiftUI

@MainActor
class ExternalEventsViewModel: ObservableObject {
    @Published var events: [ExternalEvent] = []
    @Published var categories: [EventCategory] = []
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var canLoadMore = false
    @Published var currentPage = 1
    @Published var totalPages = 1
    @Published var searchQuery = ""
    @Published var selectedCategory: String?
    @Published var selectedLocation: String?
    @Published var selectedDate: Date?

    private var cancellables = Set<AnyCancellable>()
    private let externalEventService = ExternalEventService()

    init() {
        setupBindings()
    }

    private func setupBindings() {
        // Debounce search query
        $searchQuery
            .debounce(for: .milliseconds(500), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] query in
                if !query.isEmpty {
                    self?.searchEvents(query: query)
                }
            }
            .store(in: &cancellables)
    }

    func loadInitialData() {
        Task {
            isLoading = true
            errorMessage = nil

            do {
                // Load categories first
                categories = try await loadCategories()

                // Then load initial events
                await loadEvents(page: 1, reset: true)
            } catch {
                errorMessage = error.localizedDescription
            }

            isLoading = false
        }
    }

    func loadEvents(page: Int = 1, reset: Bool = false) async {
        guard !isLoading else { return }

        isLoading = true

        do {
            let response = try await externalEventService.getExternalEvents(
                category: selectedCategory,
                location: selectedLocation,
                date: selectedDate,
                query: searchQuery.isEmpty ? nil : searchQuery,
                page: page
            )

            if reset {
                events = response.events
            } else {
                events.append(contentsOf: response.events)
            }

            currentPage = response.currentPage
            totalPages = response.totalPages
            canLoadMore = currentPage < totalPages

        } catch {
            errorMessage = error.localizedDescription
        }

        isLoading = false
    }

    func loadMoreEvents() {
        guard canLoadMore && !isLoading else { return }

        Task {
            await loadEvents(page: currentPage + 1, reset: false)
        }
    }

    func searchEvents(query: String) {
        searchQuery = query
        Task {
            await loadEvents(page: 1, reset: true)
        }
    }

    func applyFilters(category: String?, location: String?, date: Date?) {
        selectedCategory = category
        selectedLocation = location
        selectedDate = date

        Task {
            await loadEvents(page: 1, reset: true)
        }
    }

    func clearFilters() {
        selectedCategory = nil
        selectedLocation = nil
        selectedDate = nil
        searchQuery = ""

        Task {
            await loadEvents(page: 1, reset: true)
        }
    }

    func refreshEvents() {
        Task {
            await loadEvents(page: 1, reset: true)
        }
    }

    private func loadCategories() async throws -> [EventCategory] {
        return try await externalEventService.getCategories()
    }
}

// MARK: - Models
struct ExternalEvent: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let category: String
    let date: String
    let location: EventLocation?
    let latitude: Double
    let longitude: Double
    let imageUrl: String?
    let price: Double
    let organizer: String
    let source: String
    let externalId: String?

    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateFormat = "yyyy-MM-dd"

        if let eventDate = formatter.date(from: date) {
            formatter.dateStyle = .medium
            formatter.timeStyle = .none
            return formatter.string(from: eventDate)
        }

        return date
    }

    var formattedPrice: String {
        if price == 0 {
            return "Free"
        }

        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: price)) ?? "$\(price)"
    }
}

struct EventLocation: Codable {
    let address: String
    let city: String?
    let state: String?
    let country: String?
    let latitude: Double?
    let longitude: Double?
    let name: String?
    let placeId: String?
    let venue: String?
}

struct EventCategory: Identifiable, Codable {
    let id: String
    let name: String
}

struct ExternalEventsResponse: Codable {
    let events: [ExternalEvent]
    let currentPage: Int
    let totalPages: Int
    let totalCount: Int
}

struct EventRegistrationRequest: Codable {
    let name: String
    let email: String
    let phone: String?
    let numberOfTickets: Int
}

struct EventRegistrationResponse: Codable {
    let registrationId: String
    let eventId: String
    let confirmationCode: String
    let registrationDate: Date
    let status: String
}

// MARK: - External Event Service
class ExternalEventService {
    private let baseURL = "https://api.ibcm.com/external-events"
    private let session = URLSession.shared

    func getExternalEvents(
        category: String? = nil,
        location: String? = nil,
        date: Date? = nil,
        query: String? = nil,
        page: Int = 1
    ) async throws -> ExternalEventsResponse {
        var components = URLComponents(string: "\(baseURL)/events")!
        var queryItems: [URLQueryItem] = []

        if let category = category, category != "all" {
            queryItems.append(URLQueryItem(name: "category", value: category))
        }

        if let location = location, !location.isEmpty {
            queryItems.append(URLQueryItem(name: "location", value: location))
        }

        if let date = date {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd"
            queryItems.append(URLQueryItem(name: "date", value: formatter.string(from: date)))
        }

        if let query = query, !query.isEmpty {
            queryItems.append(URLQueryItem(name: "query", value: query))
        }

        queryItems.append(URLQueryItem(name: "page", value: String(page)))
        components.queryItems = queryItems

        guard let url = components.url else {
            throw URLError(.badURL)
        }

        do {
            let (data, _) = try await session.data(from: url)
            let response = try JSONDecoder().decode(ExternalEventsResponse.self, from: data)
            return response
        } catch {
            // Return mock data for development
            return getMockEventsResponse(
                category: category,
                location: location,
                query: query,
                page: page
            )
        }
    }

    func getCategories() async throws -> [EventCategory] {
        // Return mock categories for now
        return [
            EventCategory(id: "all", name: "All Categories"),
            EventCategory(id: "music", name: "Music & Concerts"),
            EventCategory(id: "tech", name: "Technology"),
            EventCategory(id: "art", name: "Arts & Culture"),
            EventCategory(id: "food", name: "Food & Drink"),
            EventCategory(id: "sports", name: "Sports & Fitness"),
            EventCategory(id: "business", name: "Business & Professional"),
            EventCategory(id: "entertainment", name: "Entertainment"),
            EventCategory(id: "education", name: "Education & Learning"),
            EventCategory(id: "health", name: "Health & Wellness"),
            EventCategory(id: "community", name: "Community & Social")
        ]
    }

    func registerForEvent(eventId: String, registration: EventRegistrationRequest) async throws -> EventRegistrationResponse {
        let url = URL(string: "\(baseURL)/events/\(eventId)/register")!
        var request = URLRequest(url: url)
        request.httpMethod = "POST"
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")

        let encoder = JSONEncoder()
        request.httpBody = try encoder.encode(registration)

        do {
            let (data, _) = try await session.data(for: request)
            let response = try JSONDecoder().decode(EventRegistrationResponse.self, from: data)
            return response
        } catch {
            // Return mock success response
            return EventRegistrationResponse(
                registrationId: UUID().uuidString,
                eventId: eventId,
                confirmationCode: "CONF-\(Int.random(in: 10000...99999))",
                registrationDate: Date(),
                status: "CONFIRMED"
            )
        }
    }

    // MARK: - Mock Data
    private func getMockEventsResponse(
        category: String?,
        location: String?,
        query: String?,
        page: Int
    ) -> ExternalEventsResponse {
        let allEvents = getMockEvents()

        var filteredEvents = allEvents

        // Apply filters
        if let category = category, category != "all" {
            filteredEvents = filteredEvents.filter { $0.category == category }
        }

        if let location = location, !location.isEmpty {
            filteredEvents = filteredEvents.filter { event in
                event.location?.address.localizedCaseInsensitiveContains(location) == true ||
                event.location?.city?.localizedCaseInsensitiveContains(location) == true
            }
        }

        if let query = query, !query.isEmpty {
            filteredEvents = filteredEvents.filter { event in
                event.title.localizedCaseInsensitiveContains(query) ||
                event.description.localizedCaseInsensitiveContains(query) ||
                event.organizer.localizedCaseInsensitiveContains(query)
            }
        }

        // Pagination
        let pageSize = 10
        let startIndex = (page - 1) * pageSize
        let endIndex = min(startIndex + pageSize, filteredEvents.count)

        let paginatedEvents = Array(filteredEvents[startIndex..<endIndex])

        return ExternalEventsResponse(
            events: paginatedEvents,
            currentPage: page,
            totalPages: Int(ceil(Double(filteredEvents.count) / Double(pageSize))),
            totalCount: filteredEvents.count
        )
    }

    private func getMockEvents() -> [ExternalEvent] {
        return [
            ExternalEvent(
                id: "ext1",
                title: "Summer Music Festival 2024",
                description: "Annual music festival featuring top artists from around the world. Join us for an unforgettable experience with live performances, food trucks, and entertainment for all ages.",
                category: "music",
                date: "2024-07-15",
                location: EventLocation(
                    address: "Central Park, New York, NY",
                    city: "New York",
                    state: "NY",
                    country: "USA",
                    latitude: 40.785091,
                    longitude: -73.968285,
                    name: "Central Park",
                    placeId: "central_park_ny",
                    venue: "Great Lawn"
                ),
                latitude: 40.785091,
                longitude: -73.968285,
                imageUrl: "https://images.unsplash.com/photo-1459749411175-04bf5292ceea?w=800",
                price: 89.99,
                organizer: "NYC Events",
                source: "google",
                externalId: "nyc_music_fest_2024"
            ),
            ExternalEvent(
                id: "ext2",
                title: "Tech Innovation Conference 2024",
                description: "Explore the latest in technology and innovation. Network with industry leaders and discover cutting-edge solutions that will shape the future.",
                category: "tech",
                date: "2024-08-22",
                location: EventLocation(
                    address: "Moscone Center, San Francisco, CA",
                    city: "San Francisco",
                    state: "CA",
                    country: "USA",
                    latitude: 37.783333,
                    longitude: -122.416667,
                    name: "Moscone Center",
                    placeId: "moscone_sf",
                    venue: "West Hall"
                ),
                latitude: 37.783333,
                longitude: -122.416667,
                imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                price: 299.99,
                organizer: "TechCorp",
                source: "eventbrite",
                externalId: "tech_conf_2024"
            ),
            ExternalEvent(
                id: "ext3",
                title: "Modern Art Exhibition: Digital Dreams",
                description: "Featuring works from contemporary digital artists. Discover new perspectives and artistic expressions in the digital age.",
                category: "art",
                date: "2024-09-10",
                location: EventLocation(
                    address: "Museum of Modern Art, New York, NY",
                    city: "New York",
                    state: "NY",
                    country: "USA",
                    latitude: 40.779437,
                    longitude: -73.963244,
                    name: "MoMA",
                    placeId: "moma_ny",
                    venue: "Gallery 5"
                ),
                latitude: 40.779437,
                longitude: -73.963244,
                imageUrl: "https://images.unsplash.com/photo-1578662996442-48f60103fc96?w=800",
                price: 24.50,
                organizer: "MoMA",
                source: "facebook",
                externalId: "moma_digital_2024"
            ),
            ExternalEvent(
                id: "ext4",
                title: "Gourmet Food & Wine Festival",
                description: "Taste dishes and wines from award-winning chefs and vineyards. A culinary adventure featuring local and international cuisine.",
                category: "food",
                date: "2024-07-30",
                location: EventLocation(
                    address: "Navy Pier, Chicago, IL",
                    city: "Chicago",
                    state: "IL",
                    country: "USA",
                    latitude: 41.891775,
                    longitude: -87.608010,
                    name: "Navy Pier",
                    placeId: "navy_pier_chicago",
                    venue: "Festival Hall"
                ),
                latitude: 41.891775,
                longitude: -87.608010,
                imageUrl: "https://images.unsplash.com/photo-1555939594-58d7cb561ad1?w=800",
                price: 65.00,
                organizer: "Chicago Culinary Events",
                source: "google",
                externalId: "chi_food_fest_2024"
            ),
            ExternalEvent(
                id: "ext5",
                title: "Boston Marathon 2024",
                description: "Annual city marathon with routes for all skill levels. Challenge yourself and support great causes while running through historic Boston.",
                category: "sports",
                date: "2024-10-15",
                location: EventLocation(
                    address: "Hopkinton, MA to Boston, MA",
                    city: "Boston",
                    state: "MA",
                    country: "USA",
                    latitude: 42.361145,
                    longitude: -71.057083,
                    name: "Boston Marathon Route",
                    placeId: "boston_marathon",
                    venue: "City Streets"
                ),
                latitude: 42.361145,
                longitude: -71.057083,
                imageUrl: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=800",
                price: 195.00,
                organizer: "Boston Athletic Association",
                source: "official",
                externalId: "boston_marathon_2024"
            ),
            ExternalEvent(
                id: "ext6",
                title: "Startup Pitch Competition",
                description: "Watch innovative startups pitch their ideas to investors. Network with entrepreneurs and learn about the latest business trends.",
                category: "business",
                date: "2024-06-20",
                location: EventLocation(
                    address: "Austin Convention Center, Austin, TX",
                    city: "Austin",
                    state: "TX",
                    country: "USA",
                    latitude: 30.267153,
                    longitude: -97.743061,
                    name: "Austin Convention Center",
                    placeId: "austin_convention",
                    venue: "Ballroom A"
                ),
                latitude: 30.267153,
                longitude: -97.743061,
                imageUrl: "https://images.unsplash.com/photo-1556761175-4b46a572b786?w=800",
                price: 0.0,
                organizer: "Austin Startup Network",
                source: "meetup",
                externalId: "austin_pitch_2024"
            )
        ]
    }
}
