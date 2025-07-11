//
//  HomeViewModel.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine
import CoreLocation
import MapKit

// MARK: - Auth States
enum AuthState {
    case unauthenticated
    case authenticated
    case needsCategories
}

// MARK: - Home View Model
class HomeViewModel: ObservableObject {

    // MARK: - Published Properties
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var userLocation: CLLocationCoordinate2D?
    @Published var categories: [Category] = []
    @Published var selectedCategory: Category?
    @Published var selectedCategories: [Category] = []
    @Published var events: [Event] = []
    @Published var filteredEvents: [Event] = []
    @Published var nearbyEvents: [Event] = []
    @Published var searchQuery = ""
    @Published var selectedEventId: String?
    @Published var authState: AuthState = .unauthenticated
    @Published var userInteractionCount = 0
    @Published var user: User?
    @Published var isMapView = true
    @Published var unreadNotificationCount = 0
    @Published var userProfileImageUrl = ""
    @Published var featuredEvents: [Event] = []
    @Published var trendingEvents: [Event] = []
    @Published var upcomingEvents: [Event] = []

    // MARK: - Services
    private let categoryService = CategoryService()
    private let eventService = EventService()
    private let userService = UserService()
    private let locationService = LocationService()
    private let authService = AuthService()

    // MARK: - Cancellables
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Constants
    private let maxFreeInteractions = 3
    private let locationUpdateInterval: TimeInterval = 30.0

    // MARK: - Initialization
    init() {
        setupLocationUpdates()
        checkAuthState()
        loadInitialData()
    }

    // MARK: - Public Methods

    func loadHomeData() {
        isLoading = true
        errorMessage = nil

        let group = DispatchGroup()

        // Load categories
        group.enter()
        loadCategories {
            group.leave()
        }

        // Load events
        group.enter()
        loadEvents {
            group.leave()
        }

        // Load user data if authenticated
        if authState == .authenticated {
            group.enter()
            loadUserData {
                group.leave()
            }
        }

        group.notify(queue: .main) { [weak self] in
            self?.isLoading = false
            self?.updateNearbyEvents()
        }
    }

    func searchEvents(_ query: String) {
        searchQuery = query

        if query.isEmpty {
            filteredEvents = events
        } else {
            filteredEvents = events.filter { event in
                event.title.localizedCaseInsensitiveContains(query) ||
                event.description.localizedCaseInsensitiveContains(query) ||
                event.location.localizedCaseInsensitiveContains(query)
            }
        }

        updateNearbyEvents()
    }

    func clearSearch() {
        searchQuery = ""
        filteredEvents = events
        updateNearbyEvents()
    }

    func filterByCategory(_ category: Category) {
        selectedCategory = category

        filteredEvents = events.filter { event in
            event.categoryId == category.id
        }

        updateNearbyEvents()
    }

    func clearCategoryFilter() {
        selectedCategory = nil
        filteredEvents = events
        updateNearbyEvents()
    }

    func updateUserLocation(_ location: CLLocationCoordinate2D) {
        userLocation = location
        updateNearbyEvents()

        // Update location in backend if authenticated
        if authState == .authenticated {
            updateUserLocationInBackend(location)
        }
    }

    func toggleViewMode() {
        isMapView.toggle()
    }

    func incrementUserInteraction() {
        userInteractionCount += 1

        // Check if user needs to log in
        if userInteractionCount >= maxFreeInteractions && authState == .unauthenticated {
            // Trigger login requirement
            // This would typically be handled by the view
        }
    }

    func getCurrentTimeGreeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())

        switch hour {
        case 0..<12:
            return "Good morning! 🌅"
        case 12..<17:
            return "Good afternoon! ☀️"
        case 17..<21:
            return "Good evening! 🌆"
        default:
            return "Good night! 🌙"
        }
    }

    func refreshData() {
        loadHomeData()
    }

    // MARK: - Private Methods

    private func setupLocationUpdates() {
        locationService.startUpdatingLocation()

        locationService.$location
            .compactMap { $0 }
            .sink { [weak self] location in
                self?.updateUserLocation(location.coordinate)
            }
            .store(in: &cancellables)
    }

    private func checkAuthState() {
        authService.checkAuthenticationStatus { [weak self] isAuthenticated in
            DispatchQueue.main.async {
                if isAuthenticated {
                    self?.authState = .authenticated
                    self?.loadUserData { }
                } else {
                    self?.authState = .unauthenticated
                }
            }
        }
    }

    private func loadInitialData() {
        // Load cached data first for better UX
        loadCachedData()

        // Then load fresh data
        loadHomeData()
    }

    private func loadCachedData() {
        // Load cached categories
        if let cachedCategories = UserDefaults.standard.data(forKey: "cached_categories") {
            do {
                let decoder = JSONDecoder()
                categories = try decoder.decode([Category].self, from: cachedCategories)
            } catch {
                print("Error loading cached categories: \(error)")
            }
        }

        // Load cached events
        if let cachedEvents = UserDefaults.standard.data(forKey: "cached_events") {
            do {
                let decoder = JSONDecoder()
                events = try decoder.decode([Event].self, from: cachedEvents)
                filteredEvents = events
            } catch {
                print("Error loading cached events: \(error)")
            }
        }
    }

    private func loadCategories(completion: @escaping () -> Void) {
        categoryService.getCategories { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let categories):
                    self?.categories = categories
                    self?.cacheCategories(categories)
                case .failure(let error):
                    self?.errorMessage = "Failed to load categories: \(error.localizedDescription)"
                }
                completion()
            }
        }
    }

    private func loadEvents(completion: @escaping () -> Void) {
        eventService.getEvents { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let events):
                    self?.events = events
                    self?.filteredEvents = events
                    self?.cacheEvents(events)
                    self?.categorizeEvents(events)
                case .failure(let error):
                    self?.errorMessage = "Failed to load events: \(error.localizedDescription)"
                }
                completion()
            }
        }
    }

    private func loadUserData(completion: @escaping () -> Void) {
        userService.getCurrentUser { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let user):
                    self?.user = user
                    self?.userProfileImageUrl = user.profileImageUrl ?? ""
                    self?.loadUserNotifications()
                case .failure(let error):
                    self?.errorMessage = "Failed to load user data: \(error.localizedDescription)"
                }
                completion()
            }
        }
    }

    private func loadUserNotifications() {
        // Load notification count
        // This would typically call a notification service
        // For now, we'll simulate it
        unreadNotificationCount = Int.random(in: 0...5)
    }

    private func updateNearbyEvents() {
        guard let userLocation = userLocation else {
            nearbyEvents = filteredEvents
            return
        }

        let eventsWithDistance = filteredEvents.map { event -> (Event, Double) in
            let eventLocation = CLLocation(latitude: event.latitude, longitude: event.longitude)
            let userLocationCL = CLLocation(latitude: userLocation.latitude, longitude: userLocation.longitude)
            let distance = eventLocation.distance(from: userLocationCL)
            return (event, distance)
        }

        // Sort by distance and take events within 50km
        nearbyEvents = eventsWithDistance
            .filter { $0.1 <= 50000 } // 50km in meters
            .sorted { $0.1 < $1.1 }
            .map { $0.0 }
    }

    private func updateUserLocationInBackend(_ location: CLLocationCoordinate2D) {
        userService.updateUserLocation(
            latitude: location.latitude,
            longitude: location.longitude
        ) { result in
            switch result {
            case .success:
                print("User location updated successfully")
            case .failure(let error):
                print("Failed to update user location: \(error)")
            }
        }
    }

    private func categorizeEvents(_ events: [Event]) {
        let now = Date()
        let calendar = Calendar.current

        // Featured events (high rating, recent, or promoted)
        featuredEvents = events.filter { event in
            event.rating >= 4.5 || event.isFeatured
        }.prefix(10).map { $0 }

        // Trending events (high engagement, recent activity)
        trendingEvents = events.filter { event in
            event.attendeeCount > 100 || event.isPopular
        }.prefix(10).map { $0 }

        // Upcoming events (next 7 days)
        upcomingEvents = events.filter { event in
            let eventDate = event.date
            let daysDifference = calendar.dateComponents([.day], from: now, to: eventDate).day ?? 0
            return daysDifference >= 0 && daysDifference <= 7
        }.sorted { $0.date < $1.date }
    }

    private func cacheCategories(_ categories: [Category]) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(categories)
            UserDefaults.standard.set(data, forKey: "cached_categories")
        } catch {
            print("Error caching categories: \(error)")
        }
    }

    private func cacheEvents(_ events: [Event]) {
        do {
            let encoder = JSONEncoder()
            let data = try encoder.encode(events)
            UserDefaults.standard.set(data, forKey: "cached_events")
        } catch {
            print("Error caching events: \(error)")
        }
    }
}

// MARK: - Location Manager
class LocationManager: NSObject, ObservableObject, CLLocationManagerDelegate {
    private let locationManager = CLLocationManager()

    @Published var location: CLLocation?
    @Published var authorizationStatus: CLAuthorizationStatus = .notDetermined

    override init() {
        super.init()
        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.requestWhenInUseAuthorization()
    }

    func requestWhenInUseAuthorization() {
        locationManager.requestWhenInUseAuthorization()
    }

    func startUpdatingLocation() {
        locationManager.startUpdatingLocation()
    }

    func stopUpdatingLocation() {
        locationManager.stopUpdatingLocation()
    }

    // MARK: - CLLocationManagerDelegate

    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        location = locations.last
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        print("Location manager failed with error: \(error)")
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        authorizationStatus = status

        switch status {
        case .authorizedWhenInUse, .authorizedAlways:
            startUpdatingLocation()
        case .denied, .restricted:
            stopUpdatingLocation()
        case .notDetermined:
            requestWhenInUseAuthorization()
        @unknown default:
            break
        }
    }
}

// MARK: - Service Extensions
extension HomeViewModel {

    // Category Service Mock
    class CategoryService {
        func getCategories(completion: @escaping (Result<[Category], Error>) -> Void) {
            // Simulate API call
            DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
                let categories = [
                    Category(id: "1", name: "Music", description: "Musical events", iconUrl: "music.note"),
                    Category(id: "2", name: "Sports", description: "Sports events", iconUrl: "sportscourt"),
                    Category(id: "3", name: "Food", description: "Food & dining", iconUrl: "fork.knife"),
                    Category(id: "4", name: "Art", description: "Art & culture", iconUrl: "paintbrush"),
                    Category(id: "5", name: "Technology", description: "Tech events", iconUrl: "laptop"),
                    Category(id: "6", name: "Business", description: "Business events", iconUrl: "briefcase"),
                    Category(id: "7", name: "Education", description: "Educational events", iconUrl: "book"),
                    Category(id: "8", name: "Health", description: "Health & wellness", iconUrl: "heart")
                ]
                completion(.success(categories))
            }
        }
    }

    // Event Service Mock
    class EventService {
        func getEvents(completion: @escaping (Result<[Event], Error>) -> Void) {
            // Simulate API call
            DispatchQueue.global().asyncAfter(deadline: .now() + 1.5) {
                let events = self.generateMockEvents()
                completion(.success(events))
            }
        }

        private func generateMockEvents() -> [Event] {
            let titles = [
                "Summer Music Festival",
                "Tech Conference 2024",
                "Art Gallery Opening",
                "Food Truck Rally",
                "Marathon Training",
                "Business Networking",
                "Photography Workshop",
                "Yoga in the Park"
            ]

            let descriptions = [
                "Join us for an amazing experience with great music and food!",
                "Learn about the latest technologies and network with professionals.",
                "Discover amazing artworks from local and international artists.",
                "Taste delicious food from the best food trucks in the city.",
                "Get ready for the marathon with professional training sessions.",
                "Connect with business professionals and expand your network.",
                "Learn professional photography techniques from experts.",
                "Relax and rejuvenate with outdoor yoga sessions."
            ]

            let locations = [
                "Central Park, NY",
                "Convention Center, SF",
                "Downtown Gallery, LA",
                "Riverside Park, Chicago",
                "City Stadium, Miami",
                "Business District, Boston",
                "Art Center, Seattle",
                "Community Park, Austin"
            ]

            return (0..<titles.count).map { index in
                Event(
                    id: "\(index + 1)",
                    title: titles[index],
                    description: descriptions[index],
                    date: Date().addingTimeInterval(Double.random(in: 0...604800)), // Next week
                    location: locations[index],
                    latitude: Double.random(in: 25.0...48.0),
                    longitude: Double.random(in: -125.0...(-67.0)),
                    price: Double.random(in: 0...100),
                    categoryId: "\(Int.random(in: 1...8))",
                    imageUrl: "https://picsum.photos/300/200?random=\(index)",
                    rating: Double.random(in: 3.0...5.0),
                    attendeeCount: Int.random(in: 10...500),
                    isFeatured: Bool.random(),
                    isPopular: Bool.random()
                )
            }
        }
    }

    // User Service Mock
    class UserService {
        func getCurrentUser(completion: @escaping (Result<User, Error>) -> Void) {
            // Simulate API call
            DispatchQueue.global().asyncAfter(deadline: .now() + 0.5) {
                let user = User(
                    id: "current_user",
                    username: "user123",
                    email: "user@example.com",
                    fullName: "John Doe",
                    profileImageUrl: "https://picsum.photos/100/100?random=user",
                    isVerified: true,
                    createdAt: Date().addingTimeInterval(-2592000), // 30 days ago
                    preferences: UserPreferences(
                        notificationsEnabled: true,
                        locationEnabled: true,
                        theme: "system"
                    )
                )
                completion(.success(user))
            }
        }

        func updateUserLocation(latitude: Double, longitude: Double, completion: @escaping (Result<Void, Error>) -> Void) {
            // Simulate API call
            DispatchQueue.global().asyncAfter(deadline: .now() + 0.5) {
                completion(.success(()))
            }
        }
    }

    // Location Service Mock
    class LocationService {
        @Published var location: CLLocation?

        func startUpdatingLocation() {
            // This would typically interface with CLLocationManager
            // For now, we'll simulate with a default location
            location = CLLocation(latitude: 37.7749, longitude: -122.4194)
        }
    }
}
