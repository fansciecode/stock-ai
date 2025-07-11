import Foundation
import Combine

@MainActor
class EventsViewModel: ObservableObject {
    @Published var events: [Event] = []
    @Published var categories: [EventCategory] = []
    @Published var isLoading = false
    @Published var isLoadingMore = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var searchText = ""
    @Published var filters = EventFilter(
        categories: [],
        locations: [],
        dateRange: nil,
        priceRange: nil,
        eventTypes: [],
        features: [],
        rating: nil,
        sortBy: .date,
        sortOrder: .descending
    )
    @Published var sortBy: SortOption = .date {
        didSet {
            filters.sortBy = sortBy
            Task {
                await loadEvents()
            }
        }
    }

    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared
    private var currentPage = 1
    private let pageSize = 20
    private var hasMorePages = true
    private var lastSearchText = ""
    private var searchTask: Task<Void, Never>?

    init() {
        setupSearchDebouncing()
    }

    private func setupSearchDebouncing() {
        $searchText
            .debounce(for: .milliseconds(500), scheduler: RunLoop.main)
            .removeDuplicates()
            .sink { [weak self] searchText in
                guard let self = self else { return }
                if searchText != self.lastSearchText {
                    self.lastSearchText = searchText
                    Task {
                        await self.searchEvents()
                    }
                }
            }
            .store(in: &cancellables)
    }

    func loadEvents() async {
        guard !isLoading else { return }

        isLoading = true
        currentPage = 1
        hasMorePages = true
        errorMessage = ""

        do {
            let response = try await networkService.getEvents(page: currentPage, limit: pageSize).async()

            if response.success {
                events = response.data.events
                hasMorePages = currentPage < response.data.totalPages
            } else {
                errorMessage = response.message ?? "Failed to load events"
                showError = true
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func loadMoreEvents() async {
        guard !isLoadingMore && hasMorePages && searchText.isEmpty else { return }

        isLoadingMore = true
        currentPage += 1

        do {
            let response = try await networkService.getEvents(page: currentPage, limit: pageSize).async()

            if response.success {
                events.append(contentsOf: response.data.events)
                hasMorePages = currentPage < response.data.totalPages
            } else {
                currentPage -= 1 // Revert page increment on failure
            }
        } catch {
            currentPage -= 1 // Revert page increment on failure
            handleError(error)
        }

        isLoadingMore = false
    }

    func refreshEvents() async {
        currentPage = 1
        hasMorePages = true
        await loadEvents()
    }

    func searchEvents() async {
        // Cancel previous search task
        searchTask?.cancel()

        searchTask = Task {
            guard !Task.isCancelled else { return }

            if searchText.isEmpty {
                await loadEvents()
                return
            }

            isLoading = true
            currentPage = 1
            hasMorePages = true
            errorMessage = ""

            do {
                let searchRequest = EventSearchRequest(
                    query: searchText,
                    category: filters.categories.first,
                    location: filters.locations.first,
                    startDate: filters.dateRange?.startDate,
                    endDate: filters.dateRange?.endDate,
                    priceMin: filters.priceRange?.min,
                    priceMax: filters.priceRange?.max,
                    eventType: filters.eventTypes.first,
                    visibility: .public,
                    page: currentPage,
                    limit: pageSize,
                    sortBy: filters.sortBy.rawValue,
                    sortOrder: filters.sortOrder.rawValue
                )

                guard !Task.isCancelled else { return }

                let response = try await networkService.searchEvents(query: searchText, filters: searchRequest).async()

                guard !Task.isCancelled else { return }

                if response.success {
                    events = response.data.events
                    hasMorePages = currentPage < response.data.totalPages
                } else {
                    errorMessage = response.message ?? "Search failed"
                    showError = true
                }
            } catch {
                guard !Task.isCancelled else { return }
                handleError(error)
            }

            isLoading = false
        }
    }

    func loadCategories() async {
        do {
            let response: [EventCategory] = try await networkService.getCategories().async()
            categories = response.filter { $0.isActive }
        } catch {
            print("Failed to load categories: \(error)")
        }
    }

    func filterByCategory(_ categoryId: String?) async {
        if let categoryId = categoryId {
            filters.categories = [categoryId]
        } else {
            filters.categories = []
        }

        await applyFilters()
    }

    func applyFilters() async {
        currentPage = 1
        hasMorePages = true

        if searchText.isEmpty {
            await loadFilteredEvents()
        } else {
            await searchEvents()
        }
    }

    private func loadFilteredEvents() async {
        isLoading = true
        errorMessage = ""

        do {
            // Convert filters to search request parameters
            let searchRequest = EventSearchRequest(
                query: nil,
                category: filters.categories.first,
                location: filters.locations.first,
                startDate: filters.dateRange?.startDate,
                endDate: filters.dateRange?.endDate,
                priceMin: filters.priceRange?.min,
                priceMax: filters.priceRange?.max,
                eventType: filters.eventTypes.first,
                visibility: .public,
                page: currentPage,
                limit: pageSize,
                sortBy: filters.sortBy.rawValue,
                sortOrder: filters.sortOrder.rawValue
            )

            let response = try await networkService.searchEvents(query: "", filters: searchRequest).async()

            if response.success {
                events = response.data.events
                hasMorePages = currentPage < response.data.totalPages
            } else {
                errorMessage = response.message ?? "Failed to apply filters"
                showError = true
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func clearFilters() {
        filters = EventFilter(
            categories: [],
            locations: [],
            dateRange: nil,
            priceRange: nil,
            eventTypes: [],
            features: [],
            rating: nil,
            sortBy: .date,
            sortOrder: .descending
        )

        Task {
            await loadEvents()
        }
    }

    func toggleFavorite(event: Event) async {
        // Implementation for favorite/unfavorite
        // This would typically call an API endpoint
        do {
            // let response = try await networkService.toggleEventFavorite(eventId: event.id).async()
            // Handle response and update local state
        } catch {
            handleError(error)
        }
    }

    func registerForEvent(_ event: Event) async {
        do {
            let response = try await networkService.registerForEvent(eventId: event.id).async()

            if response.success {
                // Update local event data
                if let index = events.firstIndex(where: { $0.id == event.id }) {
                    var updatedEvent = events[index]
                    // Update attendee count or registration status
                    events[index] = updatedEvent
                }
            } else {
                errorMessage = response.message ?? "Registration failed"
                showError = true
            }
        } catch {
            handleError(error)
        }
    }

    func unregisterFromEvent(_ event: Event) async {
        do {
            let response = try await networkService.unregisterFromEvent(eventId: event.id).async()

            if response.success {
                // Update local event data
                if let index = events.firstIndex(where: { $0.id == event.id }) {
                    var updatedEvent = events[index]
                    // Update attendee count or registration status
                    events[index] = updatedEvent
                }
            } else {
                errorMessage = response.message ?? "Unregistration failed"
                showError = true
            }
        } catch {
            handleError(error)
        }
    }

    private func handleError(_ error: Error) {
        if let networkError = error as? NetworkError {
            switch networkError {
            case .unauthorized:
                errorMessage = "Please log in to continue"
            case .networkError:
                errorMessage = "Network connection error. Please check your internet connection."
            case .serverError(let code):
                errorMessage = "Server error (\(code)). Please try again later."
            default:
                errorMessage = networkError.localizedDescription
            }
        } else {
            errorMessage = "An unexpected error occurred. Please try again."
        }
        showError = true
    }
}

// MARK: - Helper Extensions
extension EventsViewModel {
    var filteredEventsCount: Int {
        return events.count
    }

    var hasActiveFilters: Bool {
        return !filters.categories.isEmpty ||
               !filters.locations.isEmpty ||
               filters.dateRange != nil ||
               filters.priceRange != nil ||
               !filters.eventTypes.isEmpty ||
               filters.rating != nil
    }

    var activeFiltersDescription: String {
        var descriptions: [String] = []

        if !filters.categories.isEmpty {
            descriptions.append("Categories (\(filters.categories.count))")
        }

        if !filters.locations.isEmpty {
            descriptions.append("Locations (\(filters.locations.count))")
        }

        if filters.dateRange != nil {
            descriptions.append("Date Range")
        }

        if filters.priceRange != nil {
            descriptions.append("Price Range")
        }

        if !filters.eventTypes.isEmpty {
            descriptions.append("Event Types (\(filters.eventTypes.count))")
        }

        if filters.rating != nil {
            descriptions.append("Rating")
        }

        return descriptions.joined(separator: ", ")
    }
}

// MARK: - Search and Filter Models
struct EventSearchState {
    var isSearching: Bool = false
    var searchResults: [Event] = []
    var searchSuggestions: [String] = []
    var recentSearches: [String] = []
}

extension EventsViewModel {
    func saveRecentSearch(_ query: String) {
        var recent = UserDefaults.standard.stringArray(forKey: "RecentSearches") ?? []

        // Remove if already exists
        recent.removeAll { $0 == query }

        // Add to beginning
        recent.insert(query, at: 0)

        // Keep only last 10 searches
        if recent.count > 10 {
            recent = Array(recent.prefix(10))
        }

        UserDefaults.standard.set(recent, forKey: "RecentSearches")
    }

    func getRecentSearches() -> [String] {
        return UserDefaults.standard.stringArray(forKey: "RecentSearches") ?? []
    }

    func clearRecentSearches() {
        UserDefaults.standard.removeObject(forKey: "RecentSearches")
    }
}
