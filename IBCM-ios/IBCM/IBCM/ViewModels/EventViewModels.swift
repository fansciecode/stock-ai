import Foundation
import SwiftUI

// MARK: - Event Creation View Model
@MainActor
class EventCreationViewModel: ObservableObject {
    @Published var formState = EventFormState()
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    
    struct EventFormState {
        var title = ""
        var description = ""
        var category = ""
        var date = Date()
        var time = Date()
        var location = ""
        var maxAttendees: Int?
        var visibility = EventType.Visibility.public.rawValue
        
        var titleError: String?
        var descriptionError: String?
        var categoryError: String?
        var locationError: String?
        
        var isValid: Bool {
            !title.isEmpty && !description.isEmpty && !category.isEmpty && !location.isEmpty && maxAttendees != nil
        }
    }
    
    let categories = EventType.Category.allCases
    
    func createEvent() async {
        guard formState.isValid else {
            validateForm()
            return
        }
        
        isLoading = true
        do {
            let event = try await NetworkService.shared.request(
                endpoint: "/events",
                method: "POST",
                body: try JSONEncoder().encode([
                    "title": formState.title,
                    "description": formState.description,
                    "category": formState.category,
                    "date": formState.date.timeIntervalSince1970,
                    "time": formState.time.timeIntervalSince1970,
                    "location": formState.location,
                    "maxAttendees": formState.maxAttendees ?? 0,
                    "visibility": formState.visibility
                ])
            ) as EventResponse
            
            // Handle success
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    private func validateForm() {
        formState.titleError = formState.title.isEmpty ? "Title is required" : nil
        formState.descriptionError = formState.description.isEmpty ? "Description is required" : nil
        formState.categoryError = formState.category.isEmpty ? "Category is required" : nil
        formState.locationError = formState.location.isEmpty ? "Location is required" : nil
    }
}

// MARK: - Event Search View Model
@MainActor
class EventSearchViewModel: ObservableObject {
    @Published var searchQuery = ""
    @Published var searchResults: [Event] = []
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    
    @Published var selectedCategory: EventType.Category?
    @Published var selectedDate: Date?
    @Published var selectedLocation: String?
    
    var searchTask: Task<Void, Never>?
    
    init() {
        setupSearchSubscription()
    }
    
    private func setupSearchSubscription() {
        Task {
            for await text in $searchQuery.values {
                searchTask?.cancel()
                
                if text.isEmpty {
                    await fetchEvents()
                    continue
                }
                
                searchTask = Task {
                    await searchEvents(query: text)
                }
            }
        }
    }
    
    func fetchEvents() async {
        isLoading = true
        do {
            var endpoint = "/events"
            var queryItems: [URLQueryItem] = []
            
            if let category = selectedCategory {
                queryItems.append(URLQueryItem(name: "category", value: category.rawValue))
            }
            
            if let date = selectedDate {
                queryItems.append(URLQueryItem(name: "date", value: "\(date.timeIntervalSince1970)"))
            }
            
            if let location = selectedLocation {
                queryItems.append(URLQueryItem(name: "location", value: location))
            }
            
            if !queryItems.isEmpty {
                endpoint += "?" + queryItems.map { "\($0.name)=\($0.value ?? "")" }.joined(separator: "&")
            }
            
            let response: EventsResponse = try await NetworkService.shared.request(
                endpoint: endpoint,
                method: "GET"
            )
            searchResults = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    private func searchEvents(query: String) async {
        isLoading = true
        do {
            let response: EventsResponse = try await NetworkService.shared.request(
                endpoint: "/events/search?q=\(query)",
                method: "GET"
            )
            searchResults = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
}

// MARK: - Event Details View Model
@MainActor
class EventDetailsViewModel: ObservableObject {
    @Published var event: Event?
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var analytics: EventAnalytics?
    
    func loadEventDetails(eventId: String) async {
        isLoading = true
        do {
            let response: EventResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)",
                method: "GET"
            )
            event = response.data
            await loadEventAnalytics(eventId: eventId)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    private func loadEventAnalytics(eventId: String) async {
        do {
            let response: EventAnalyticsResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)/analytics",
                method: "GET"
            )
            analytics = response.data
        } catch {
            // Handle analytics error silently
        }
    }
    
    func joinEvent() async {
        guard let eventId = event?.id else { return }
        
        do {
            let response: EventResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)/join",
                method: "POST"
            )
            event = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func leaveEvent() async {
        guard let eventId = event?.id else { return }
        
        do {
            let response: EventResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)/leave",
                method: "POST"
            )
            event = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func addReview(rating: Int, comment: String) async {
        guard let eventId = event?.id else { return }
        
        do {
            let response: EventResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)/reviews",
                method: "POST",
                body: try JSONEncoder().encode([
                    "rating": rating,
                    "comment": comment
                ])
            )
            event = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func addComment(text: String) async {
        guard let eventId = event?.id else { return }
        
        do {
            let response: EventResponse = try await NetworkService.shared.request(
                endpoint: "/events/\(eventId)/comments",
                method: "POST",
                body: try JSONEncoder().encode([
                    "text": text
                ])
            )
            event = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
} 