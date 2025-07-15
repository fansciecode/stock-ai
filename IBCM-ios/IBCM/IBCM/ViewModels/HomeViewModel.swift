//
//  HomeViewModel.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import Foundation
import SwiftUI
import MapKit
import CoreLocation

class HomeViewModel: NSObject, ObservableObject, CLLocationManagerDelegate {
    // MARK: - Properties
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var categories: [Category] = []
    @Published var events: [Event] = []
    @Published var filteredEvents: [Event] = []
    @Published var selectedCategories: [Category] = []
    @Published var mapRegion = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    
    // Auth prompts
    @Published var showLoginPrompt = false
    @Published var showVerificationPrompt = false
    @Published var showCategorySelectionPrompt = false
    
    // Location
    private var locationManager: CLLocationManager?
    private var userLocation: CLLocation?
    
    override init() {
        super.init()
        setupLocationManager()
    }
    
    // MARK: - Location Methods
    
    func setupLocationManager() {
        locationManager = CLLocationManager()
        locationManager?.delegate = self
    }
    
    func checkLocationPermission() {
        guard let locationManager = locationManager else { return }
        
        switch locationManager.authorizationStatus {
        case .notDetermined:
            locationManager.requestWhenInUseAuthorization()
        case .authorizedWhenInUse, .authorizedAlways:
            locationManager.startUpdatingLocation()
        default:
            break
        }
    }
    
    func locationManagerDidChangeAuthorization(_ manager: CLLocationManager) {
        checkLocationPermission()
    }
    
    func locationManager(_ manager: CLLocationManager, didUpdateLocations locations: [CLLocation]) {
        guard let location = locations.first else { return }
        
        userLocation = location
        
        // Update map region
        mapRegion = MKCoordinateRegion(
            center: location.coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
        )
        
        // Update event distances
        updateEventDistances()
        
        // Stop updating location after we get the first one
        manager.stopUpdatingLocation()
    }
    
    // MARK: - Data Loading Methods
    
    func loadCategories() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.categories = [
                Category(id: "1", name: "Music"),
                Category(id: "2", name: "Sports"),
                Category(id: "3", name: "Food"),
                Category(id: "4", name: "Art"),
                Category(id: "5", name: "Technology"),
                Category(id: "6", name: "Business"),
                Category(id: "7", name: "Education"),
                Category(id: "8", name: "Health")
            ]
            self.isLoading = false
        }
    }
    
    func loadEvents() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.events = [
                Event(
                    id: "1",
                    title: "Tech Conference 2025",
                    description: "Annual technology conference featuring the latest innovations",
                    startDate: Date().addingTimeInterval(86400 * 5),
                    endDate: Date().addingTimeInterval(86400 * 7),
                    location: EventLocation(
                        address: "123 Tech St, San Francisco, CA",
                        coordinates: [-122.4194, 37.7749]
                    ),
                    imageUrl: "https://example.com/tech.jpg",
                    category: Category(id: "5", name: "Technology")
                ),
                Event(
                    id: "2",
                    title: "Music Festival",
                    description: "A weekend of amazing music performances",
                    startDate: Date().addingTimeInterval(86400 * 10),
                    endDate: Date().addingTimeInterval(86400 * 12),
                    location: EventLocation(
                        address: "Golden Gate Park, San Francisco, CA",
                        coordinates: [-122.4862, 37.7694]
                    ),
                    imageUrl: "https://example.com/music.jpg",
                    category: Category(id: "1", name: "Music")
                ),
                Event(
                    id: "3",
                    title: "Charity Run",
                    description: "5K run to raise funds for local charities",
                    startDate: Date().addingTimeInterval(86400 * 15),
                    endDate: Date().addingTimeInterval(86400 * 15),
                    location: EventLocation(
                        address: "Marina Green, San Francisco, CA",
                        coordinates: [-122.4417, 37.8065]
                    ),
                    imageUrl: "https://example.com/run.jpg",
                    category: Category(id: "2", name: "Sports")
                )
            ]
            
            self.updateEventDistances()
            self.filteredEvents = self.events
            self.isLoading = false
        }
    }
    
    // MARK: - Filter Methods
    
    func selectCategory(category: Category) {
        if let index = selectedCategories.firstIndex(where: { $0.id == category.id }) {
            selectedCategories.remove(at: index)
        } else {
            selectedCategories.append(category)
        }
        
        filterEvents()
    }
    
    func searchEvents(query: String) {
        filterEvents(searchQuery: query)
    }
    
    private func filterEvents(searchQuery: String = "") {
        if selectedCategories.isEmpty && searchQuery.isEmpty {
            filteredEvents = events
            return
        }
        
        filteredEvents = events.filter { event in
            let matchesCategory = selectedCategories.isEmpty || 
                                 (event.category != nil && 
                                  selectedCategories.contains(where: { $0.id == event.category?.id }))
            
            let matchesSearch = searchQuery.isEmpty || 
                              event.title.lowercased().contains(searchQuery.lowercased()) ||
                              event.description.lowercased().contains(searchQuery.lowercased())
            
            return matchesCategory && matchesSearch
        }
    }
    
    // MARK: - Helper Methods
    
    private func updateEventDistances() {
        guard let userLocation = userLocation else { return }
        
        for i in 0..<events.count {
            if let coordinates = events[i].location?.coordinates,
               coordinates.count >= 2 {
                let eventLocation = CLLocation(
                    latitude: coordinates[1],
                    longitude: coordinates[0]
                )
                
                events[i].distance = userLocation.distance(from: eventLocation)
            }
        }
        
        // Update filtered events as well
        for i in 0..<filteredEvents.count {
            if let eventIndex = events.firstIndex(where: { $0.id == filteredEvents[i].id }) {
                filteredEvents[i].distance = events[eventIndex].distance
            }
        }
    }
}

// MARK: - Models

struct Category: Identifiable, Equatable {
    let id: String
    let name: String
    
    static func == (lhs: Category, rhs: Category) -> Bool {
        return lhs.id == rhs.id
    }
}

struct EventLocation {
    let address: String
    let coordinates: [Double] // [longitude, latitude]
}

struct Event: Identifiable {
    let id: String
    let title: String
    let description: String
    let startDate: Date
    let endDate: Date
    let location: EventLocation?
    let imageUrl: String?
    let category: Category?
    var distance: Double?
}
