import Foundation
import SwiftUI
import CoreLocation

@MainActor
class SearchViewModel: ObservableObject {
    @Published var searchQuery = ""
    @Published var searchResults: [SearchResult] = []
    @Published var suggestions: [SearchSuggestion] = []
    @Published var recentSearches: [SearchHistoryItem] = []
    @Published var filters = SearchFilters()
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var hasMore = false
    @Published var showLocationPicker = false
    
    private var currentPage = 1
    private var searchTask: Task<Void, Never>?
    private let apiService: APIService
    private let locationManager = CLLocationManager()
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
        setupSearchSubscription()
        loadRecentSearches()
        loadSuggestions()
    }
    
    private func setupSearchSubscription() {
        Task {
            for await text in $searchQuery.values {
                searchTask?.cancel()
                
                if text.isEmpty {
                    searchResults = []
                    loadSuggestions()
                    continue
                }
                
                searchTask = Task {
                    await search(query: text)
                }
            }
        }
    }
    
    func search(query: String? = nil, resetResults: Bool = true) async {
        if resetResults {
            currentPage = 1
            searchResults = []
        }
        
        isLoading = true
        errorMessage = ""
        
        do {
            filters.query = query ?? searchQuery
            filters.page = currentPage
            
            let response: SearchResponse = try await apiService.post(
                "/api/search",
                body: filters
            )
            
            if resetResults {
                searchResults = response.data
            } else {
                searchResults.append(contentsOf: response.data)
            }
            
            hasMore = response.metadata?.hasMore ?? false
            currentPage += 1
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func loadMore() async {
        if !isLoading && hasMore {
            await search(resetResults: false)
        }
    }
    
    func loadSuggestions() {
        Task {
            do {
                let response: SearchSuggestionsResponse = try await apiService.get("/api/search/suggestions")
                suggestions = response.data
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
    
    func loadRecentSearches() {
        Task {
            do {
                let response: SearchHistoryResponse = try await apiService.get("/api/search/history")
                recentSearches = response.data
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
    
    func clearFilters() {
        filters = SearchFilters()
        Task {
            await search()
        }
    }
    
    func updateCategory(_ category: String?) {
        filters.category = category
        Task {
            await search()
        }
    }
    
    func updateSortByTime(_ sortByTime: Bool) {
        filters.sortByTime = sortByTime
        Task {
            await search()
        }
    }
    
    func updateLocation(latitude: Double, longitude: Double, radius: Double) {
        filters.location = SearchFilters.LocationFilter(
            latitude: latitude,
            longitude: longitude,
            radius: radius
        )
        Task {
            await search()
        }
    }
    
    func updateLocationByCity(_ city: String) {
        filters.location = SearchFilters.LocationFilter(city: city)
        Task {
            await search()
        }
    }
    
    func useCurrentLocation() {
        locationManager.requestWhenInUseAuthorization()
        
        if let location = locationManager.location {
            updateLocation(
                latitude: location.coordinate.latitude,
                longitude: location.coordinate.longitude,
                radius: 10 // Default 10km radius
            )
        }
    }
    
    func clearLocation() {
        filters.location = nil
        Task {
            await search()
        }
    }
} 