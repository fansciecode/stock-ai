import Foundation
import Combine

class UserService {
    // API endpoints
    private let userProfileEndpoint = "/api/users/profile"
    private let userCategoriesEndpoint = "/api/users/categories"
    private let userEventsEndpoint = "/api/users/events"
    
    // MARK: - User Methods
    
    func getUserProfile() -> AnyPublisher<User, Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<User, Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                let user = User(
                    id: "user123",
                    email: "user@example.com",
                    name: "Test User",
                    profileImageUrl: "https://picsum.photos/200",
                    isVerified: true
                )
                promise(.success(user))
            }
        }.eraseToAnyPublisher()
    }
    
    func updateUserProfile(name: String, email: String) -> AnyPublisher<User, Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<User, Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                let user = User(
                    id: "user123",
                    email: email,
                    name: name,
                    profileImageUrl: "https://picsum.photos/200",
                    isVerified: true
                )
                promise(.success(user))
            }
        }.eraseToAnyPublisher()
    }
    
    func getUserCategories() -> AnyPublisher<[Category], Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<[Category], Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                let categories = [
                    Category(id: "1", name: "Music", iconName: "music.note"),
                    Category(id: "4", name: "Art", iconName: "paintpalette"),
                    Category(id: "5", name: "Technology", iconName: "laptopcomputer")
                ]
                promise(.success(categories))
            }
        }.eraseToAnyPublisher()
    }
    
    func saveUserCategories(categoryIds: [String]) -> AnyPublisher<Void, Error> {
        // In a real app, this would make an API call
        // For now, we'll simulate success
        return Future<Void, Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.0) {
                // Simulate success
                promise(.success(()))
            }
        }.eraseToAnyPublisher()
    }
    
    func getUserEvents() -> AnyPublisher<[Event], Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<[Event], Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                // Create a mock event service to get events
                let eventService = EventService()
                
                // Get mock events and filter to simulate user's events
                let allEvents = eventService.generateMockEvents()
                let userEvents = Array(allEvents.prefix(2))
                
                promise(.success(userEvents))
            }
        }.eraseToAnyPublisher()
    }
    
    func uploadProfileImage(imageData: Data) -> AnyPublisher<String, Error> {
        // In a real app, this would make an API call to upload the image
        // For now, we'll simulate success
        return Future<String, Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
                // Simulate a successful upload with a random image URL
                let imageUrl = "https://picsum.photos/200?random=\(Int.random(in: 1...100))"
                promise(.success(imageUrl))
            }
        }.eraseToAnyPublisher()
    }
} 