//
//  LocationRepository.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import CoreLocation
import Combine

protocol LocationRepositoryProtocol {
    func getCurrentLocation() -> AnyPublisher<CLLocation, Error>
    func getLocationPermissionStatus() -> CLAuthorizationStatus
    func requestLocationPermission() -> AnyPublisher<CLAuthorizationStatus, Error>
    func startLocationUpdates() -> AnyPublisher<CLLocation, Error>
    func stopLocationUpdates()
    func geocodeAddress(_ address: String) -> AnyPublisher<CLPlacemark, Error>
    func reverseGeocodeLocation(_ location: CLLocation) -> AnyPublisher<CLPlacemark, Error>
    func calculateDistance(from: CLLocation, to: CLLocation) -> CLLocationDistance
    func getNearbyPlaces(location: CLLocation, radius: Double, type: PlaceType) -> AnyPublisher<[Place], Error>
    func saveLocationHistory(_ location: CLLocation, context: String)
    func getLocationHistory(limit: Int) -> AnyPublisher<[LocationHistory], Error>
    func clearLocationHistory() -> AnyPublisher<Void, Error>
}

class LocationRepository: NSObject, LocationRepositoryProtocol {
    private let locationManager: CLLocationManager
    private let geocoder: CLGeocoder
    private var locationUpdateSubject = PassthroughSubject<CLLocation, Error>()
    private var permissionSubject = PassthroughSubject<CLAuthorizationStatus, Error>()
    private var isUpdatingLocation = false
    private var cancellables = Set<AnyCancellable>()

    override init() {
        locationManager = CLLocationManager()
        geocoder = CLGeocoder()
        super.init()

        locationManager.delegate = self
        locationManager.desiredAccuracy = kCLLocationAccuracyBest
        locationManager.distanceFilter = 10.0 // 10 meters
    }

    func getCurrentLocation() -> AnyPublisher<CLLocation, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(LocationError.managerNotAvailable))
                return
            }

            switch self.locationManager.authorizationStatus {
            case .authorizedWhenInUse, .authorizedAlways:
                if let location = self.locationManager.location {
                    promise(.success(location))
                } else {
                    self.locationManager.requestLocation()

                    // Set up one-time location listener
                    self.locationUpdateSubject
                        .first()
                        .sink(
                            receiveCompletion: { completion in
                                if case .failure(let error) = completion {
                                    promise(.failure(error))
                                }
                            },
                            receiveValue: { location in
                                promise(.success(location))
                            }
                        )
                        .store(in: &self.cancellables)
                }
            case .denied, .restricted:
                promise(.failure(LocationError.permissionDenied))
            case .notDetermined:
                self.locationManager.requestWhenInUseAuthorization()

                self.permissionSubject
                    .first()
                    .sink(
                        receiveCompletion: { _ in },
                        receiveValue: { status in
                            if status == .authorizedWhenInUse || status == .authorizedAlways {
                                self.locationManager.requestLocation()
                            } else {
                                promise(.failure(LocationError.permissionDenied))
                            }
                        }
                    )
                    .store(in: &self.cancellables)
            @unknown default:
                promise(.failure(LocationError.unknown))
            }
        }
        .eraseToAnyPublisher()
    }

    func getLocationPermissionStatus() -> CLAuthorizationStatus {
        return locationManager.authorizationStatus
    }

    func requestLocationPermission() -> AnyPublisher<CLAuthorizationStatus, Error> {
        return Future { [weak self] promise in
            guard let self = self else {
                promise(.failure(LocationError.managerNotAvailable))
                return
            }

            if self.locationManager.authorizationStatus == .notDetermined {
                self.locationManager.requestWhenInUseAuthorization()

                self.permissionSubject
                    .first()
                    .sink(
                        receiveCompletion: { _ in },
                        receiveValue: { status in
                            promise(.success(status))
                        }
                    )
                    .store(in: &self.cancellables)
            } else {
                promise(.success(self.locationManager.authorizationStatus))
            }
        }
        .eraseToAnyPublisher()
    }

    func startLocationUpdates() -> AnyPublisher<CLLocation, Error> {
        guard !isUpdatingLocation else {
            return locationUpdateSubject.eraseToAnyPublisher()
        }

        switch locationManager.authorizationStatus {
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.startUpdatingLocation()
            isUpdatingLocation = true
            return locationUpdateSubject.eraseToAnyPublisher()
        case .denied, .restricted:
            return Fail(error: LocationError.permissionDenied)
                .eraseToAnyPublisher()
        case .notDetermined:
            return requestLocationPermission()
                .flatMap { [weak self] status -> AnyPublisher<CLLocation, Error> in
                    guard let self = self else {
                        return Fail(error: LocationError.managerNotAvailable)
                            .eraseToAnyPublisher()
                    }

                    if status == .authorizedWhenInUse || status == .authorizedAlways {
                        return self.startLocationUpdates()
                    } else {
                        return Fail(error: LocationError.permissionDenied)
                            .eraseToAnyPublisher()
                    }
                }
                .eraseToAnyPublisher()
        @unknown default:
            return Fail(error: LocationError.unknown)
                .eraseToAnyPublisher()
        }
    }

    func stopLocationUpdates() {
        locationManager.stopUpdatingLocation()
        isUpdatingLocation = false
    }

    func geocodeAddress(_ address: String) -> AnyPublisher<CLPlacemark, Error> {
        return Future { [weak self] promise in
            self?.geocoder.geocodeAddressString(address) { placemarks, error in
                if let error = error {
                    promise(.failure(error))
                } else if let placemark = placemarks?.first {
                    promise(.success(placemark))
                } else {
                    promise(.failure(LocationError.geocodingFailed))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func reverseGeocodeLocation(_ location: CLLocation) -> AnyPublisher<CLPlacemark, Error> {
        return Future { [weak self] promise in
            self?.geocoder.reverseGeocodeLocation(location) { placemarks, error in
                if let error = error {
                    promise(.failure(error))
                } else if let placemark = placemarks?.first {
                    promise(.success(placemark))
                } else {
                    promise(.failure(LocationError.geocodingFailed))
                }
            }
        }
        .eraseToAnyPublisher()
    }

    func calculateDistance(from: CLLocation, to: CLLocation) -> CLLocationDistance {
        return from.distance(from: to)
    }

    func getNearbyPlaces(location: CLLocation, radius: Double, type: PlaceType) -> AnyPublisher<[Place], Error> {
        // In a real implementation, this would use Apple Maps API or Google Places API
        // For now, we'll return mock data
        return Future { promise in
            DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
                let mockPlaces = self.generateMockPlaces(around: location, type: type)
                promise(.success(mockPlaces))
            }
        }
        .eraseToAnyPublisher()
    }

    func saveLocationHistory(_ location: CLLocation, context: String) {
        let history = LocationHistory(
            id: UUID().uuidString,
            location: location,
            context: context,
            timestamp: Date()
        )

        // Save to local storage (UserDefaults or Core Data)
        var savedHistory = getStoredLocationHistory()
        savedHistory.append(history)

        // Keep only last 100 entries
        if savedHistory.count > 100 {
            savedHistory = Array(savedHistory.suffix(100))
        }

        saveLocationHistoryToStorage(savedHistory)
    }

    func getLocationHistory(limit: Int) -> AnyPublisher<[LocationHistory], Error> {
        return Future { [weak self] promise in
            let history = self?.getStoredLocationHistory() ?? []
            let limitedHistory = Array(history.suffix(limit))
            promise(.success(limitedHistory))
        }
        .eraseToAnyPublisher()
    }

    func clearLocationHistory() -> AnyPublisher<Void, Error> {
        return Future { promise in
            UserDefaults.standard.removeObject(forKey: "location_history")
            promise(.success(()))
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Private Methods

    private func generateMockPlaces(around location: CLLocation, type: PlaceType) -> [Place] {
        let placeNames = getPlaceNames(for: type)

        return placeNames.enumerated().map { index, name in
            let randomOffset = 0.01 * Double.random(in: -1...1)
            let mockLocation = CLLocation(
                latitude: location.coordinate.latitude + randomOffset,
                longitude: location.coordinate.longitude + randomOffset
            )

            return Place(
                id: UUID().uuidString,
                name: name,
                location: mockLocation,
                type: type,
                address: "Sample Address \(index + 1)",
                phoneNumber: "+1234567890",
                rating: Double.random(in: 3.0...5.0),
                isOpen: Bool.random()
            )
        }
    }

    private func getPlaceNames(for type: PlaceType) -> [String] {
        switch type {
        case .restaurant:
            return ["The Gourmet Spot", "Cafe Delight", "Bistro Central", "Food Haven", "Dining Plaza"]
        case .hotel:
            return ["Grand Hotel", "Comfort Inn", "Luxury Suites", "City Lodge", "Boutique Hotel"]
        case .gasStation:
            return ["Shell Station", "Chevron", "BP Gas", "Exxon", "Texaco"]
        case .hospital:
            return ["City Hospital", "General Medical Center", "Emergency Care", "Health Plaza", "Medical Center"]
        case .pharmacy:
            return ["CVS Pharmacy", "Walgreens", "Rite Aid", "Local Pharmacy", "MedCare"]
        case .shopping:
            return ["Shopping Mall", "Outlet Center", "Market Square", "Retail Plaza", "Shopping Center"]
        case .entertainment:
            return ["Cinema Complex", "Entertainment Center", "Arcade Plaza", "Fun Zone", "Activity Center"]
        case .other:
            return ["Local Business", "Service Center", "Community Center", "Public Building", "Facility"]
        }
    }

    private func getStoredLocationHistory() -> [LocationHistory] {
        guard let data = UserDefaults.standard.data(forKey: "location_history"),
              let history = try? JSONDecoder().decode([LocationHistory].self, from: data) else {
            return []
        }
        return history
    }

    private func saveLocationHistoryToStorage(_ history: [LocationHistory]) {
        guard let data = try? JSONEncoder().encode(history) else { return }
        UserDefaults.standard.set(data, forKey: "location_history")
    }
}

// MARK: - CLLocationManagerDelegate

extension LocationRepository: CLLocationManagerDelegate {
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.last else { return }
        locationUpdateSubject.send(location)
    }

    func locationManager(_ manager: CLLocationManager, didFailWithError error: Error) {
        locationUpdateSubject.send(completion: .failure(error))
    }

    func locationManager(_ manager: CLLocationManager, didChangeAuthorization status: CLAuthorizationStatus) {
        permissionSubject.send(status)
    }
}

// MARK: - Mock Implementation

class MockLocationRepository: LocationRepositoryProtocol {
    private var mockLocation = CLLocation(latitude: 37.7749, longitude: -122.4194) // San Francisco
    private var permissionStatus: CLAuthorizationStatus = .authorizedWhenInUse
    private var locationUpdateSubject = PassthroughSubject<CLLocation, Error>()
    private var isUpdating = false

    func getCurrentLocation() -> AnyPublisher<CLLocation, Error> {
        return Just(mockLocation)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getLocationPermissionStatus() -> CLAuthorizationStatus {
        return permissionStatus
    }

    func requestLocationPermission() -> AnyPublisher<CLAuthorizationStatus, Error> {
        return Just(permissionStatus)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(1.0), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func startLocationUpdates() -> AnyPublisher<CLLocation, Error> {
        if !isUpdating {
            isUpdating = true
            // Simulate periodic location updates
            Timer.publish(every: 5.0, on: .main, in: .common)
                .autoconnect()
                .sink { _ in
                    let randomOffset = 0.001 * Double.random(in: -1...1)
                    self.mockLocation = CLLocation(
                        latitude: self.mockLocation.coordinate.latitude + randomOffset,
                        longitude: self.mockLocation.coordinate.longitude + randomOffset
                    )
                    self.locationUpdateSubject.send(self.mockLocation)
                }
                .store(in: &cancellables)
        }

        return locationUpdateSubject.eraseToAnyPublisher()
    }

    func stopLocationUpdates() {
        isUpdating = false
        cancellables.removeAll()
    }

    func geocodeAddress(_ address: String) -> AnyPublisher<CLPlacemark, Error> {
        let mockPlacemark = CLPlacemark()
        return Just(mockPlacemark)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(1.0), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func reverseGeocodeLocation(_ location: CLLocation) -> AnyPublisher<CLPlacemark, Error> {
        let mockPlacemark = CLPlacemark()
        return Just(mockPlacemark)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(1.0), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func calculateDistance(from: CLLocation, to: CLLocation) -> CLLocationDistance {
        return from.distance(from: to)
    }

    func getNearbyPlaces(location: CLLocation, radius: Double, type: PlaceType) -> AnyPublisher<[Place], Error> {
        let mockPlaces = [
            Place(
                id: "1",
                name: "Mock Restaurant",
                location: location,
                type: .restaurant,
                address: "123 Mock St",
                phoneNumber: "+1234567890",
                rating: 4.5,
                isOpen: true
            ),
            Place(
                id: "2",
                name: "Mock Hotel",
                location: location,
                type: .hotel,
                address: "456 Mock Ave",
                phoneNumber: "+1234567891",
                rating: 4.2,
                isOpen: true
            )
        ]

        return Just(mockPlaces)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(1.0), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func saveLocationHistory(_ location: CLLocation, context: String) {
        // Mock implementation - could save to in-memory array
    }

    func getLocationHistory(limit: Int) -> AnyPublisher<[LocationHistory], Error> {
        let mockHistory = [
            LocationHistory(
                id: "1",
                location: mockLocation,
                context: "Event search",
                timestamp: Date()
            )
        ]

        return Just(mockHistory)
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func clearLocationHistory() -> AnyPublisher<Void, Error> {
        return Just(())
            .setFailureType(to: Error.self)
            .delay(for: .seconds(0.5), scheduler: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    private var cancellables = Set<AnyCancellable>()
}

// MARK: - Error Types

enum LocationError: Error, LocalizedError {
    case managerNotAvailable
    case permissionDenied
    case locationNotAvailable
    case geocodingFailed
    case networkError
    case unknown

    var errorDescription: String? {
        switch self {
        case .managerNotAvailable:
            return "Location manager is not available"
        case .permissionDenied:
            return "Location permission denied"
        case .locationNotAvailable:
            return "Location is not available"
        case .geocodingFailed:
            return "Geocoding failed"
        case .networkError:
            return "Network error occurred"
        case .unknown:
            return "Unknown location error"
        }
    }
}

// MARK: - Supporting Models

enum PlaceType: String, CaseIterable, Codable {
    case restaurant = "restaurant"
    case hotel = "hotel"
    case gasStation = "gas_station"
    case hospital = "hospital"
    case pharmacy = "pharmacy"
    case shopping = "shopping"
    case entertainment = "entertainment"
    case other = "other"
}

struct Place: Identifiable, Codable {
    let id: String
    let name: String
    let location: CLLocation
    let type: PlaceType
    let address: String
    let phoneNumber: String?
    let rating: Double
    let isOpen: Bool

    enum CodingKeys: String, CodingKey {
        case id, name, type, address, phoneNumber, rating, isOpen
        case latitude, longitude
    }

    init(id: String, name: String, location: CLLocation, type: PlaceType, address: String, phoneNumber: String?, rating: Double, isOpen: Bool) {
        self.id = id
        self.name = name
        self.location = location
        self.type = type
        self.address = address
        self.phoneNumber = phoneNumber
        self.rating = rating
        self.isOpen = isOpen
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        name = try container.decode(String.self, forKey: .name)
        type = try container.decode(PlaceType.self, forKey: .type)
        address = try container.decode(String.self, forKey: .address)
        phoneNumber = try container.decodeIfPresent(String.self, forKey: .phoneNumber)
        rating = try container.decode(Double.self, forKey: .rating)
        isOpen = try container.decode(Bool.self, forKey: .isOpen)

        let latitude = try container.decode(Double.self, forKey: .latitude)
        let longitude = try container.decode(Double.self, forKey: .longitude)
        location = CLLocation(latitude: latitude, longitude: longitude)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(name, forKey: .name)
        try container.encode(type, forKey: .type)
        try container.encode(address, forKey: .address)
        try container.encodeIfPresent(phoneNumber, forKey: .phoneNumber)
        try container.encode(rating, forKey: .rating)
        try container.encode(isOpen, forKey: .isOpen)
        try container.encode(location.coordinate.latitude, forKey: .latitude)
        try container.encode(location.coordinate.longitude, forKey: .longitude)
    }
}

struct LocationHistory: Identifiable, Codable {
    let id: String
    let location: CLLocation
    let context: String
    let timestamp: Date

    enum CodingKeys: String, CodingKey {
        case id, context, timestamp
        case latitude, longitude
    }

    init(id: String, location: CLLocation, context: String, timestamp: Date) {
        self.id = id
        self.location = location
        self.context = context
        self.timestamp = timestamp
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)
        id = try container.decode(String.self, forKey: .id)
        context = try container.decode(String.self, forKey: .context)
        timestamp = try container.decode(Date.self, forKey: .timestamp)

        let latitude = try container.decode(Double.self, forKey: .latitude)
        let longitude = try container.decode(Double.self, forKey: .longitude)
        location = CLLocation(latitude: latitude, longitude: longitude)
    }

    func encode(to encoder: Encoder) throws {
        var container = encoder.container(keyedBy: CodingKeys.self)
        try container.encode(id, forKey: .id)
        try container.encode(context, forKey: .context)
        try container.encode(timestamp, forKey: .timestamp)
        try container.encode(location.coordinate.latitude, forKey: .latitude)
        try container.encode(location.coordinate.longitude, forKey: .longitude)
    }
}
