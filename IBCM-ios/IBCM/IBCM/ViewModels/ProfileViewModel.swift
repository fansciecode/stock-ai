import SwiftUI
import FirebaseAuth

@MainActor
class ProfileViewModel: ObservableObject {
    @Published var isEditing = false
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var isLoggedOut = false
    @Published var selectedImage: UIImage?
    
    // Edit form fields
    @Published var fullName = ""
    @Published var username = ""
    @Published var phoneNumber = ""
    
    // Stats
    @Published var userStats = UserStats()
    @Published var businessStats = BusinessStats()
    
    func updateProfileImage(_ image: UIImage) {
        selectedImage = image
        Task {
            do {
                isLoading = true
                // Convert image to Data
                guard let imageData = image.jpegData(compressionQuality: 0.7) else {
                    throw NSError(domain: "", code: -1, userInfo: [NSLocalizedDescriptionKey: "Failed to process image"])
                }
                
                // Upload to backend
                let response: ImageUploadResponse = try await NetworkService.shared.uploadImage(
                    endpoint: "/user/profile-image",
                    imageData: imageData
                )
                
                // Update user profile
                try await updateUserProfile(["profileImage": response.imageUrl])
                
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
            isLoading = false
        }
    }
    
    func updateProfile() async {
        do {
            isLoading = true
            
            let profileData = [
                "fullName": fullName,
                "username": username,
                "phoneNumber": phoneNumber
            ]
            
            try await updateUserProfile(profileData)
            isEditing = false
            
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    private func updateUserProfile(_ data: [String: Any]) async throws {
        let jsonData = try JSONSerialization.data(withJSONObject: data)
        let _: UserResponse = try await NetworkService.shared.request(
            endpoint: "/user/profile",
            method: "PUT",
            body: jsonData
        )
    }
    
    func fetchProfileStats() async {
        do {
            let response: ProfileStatsResponse = try await NetworkService.shared.request(
                endpoint: "/user/stats",
                method: "GET"
            )
            
            if response.data.role == .business {
                businessStats = response.businessStats
            } else {
                userStats = response.userStats
            }
            
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func handleAction(_ action: ProfileAction) {
        switch action {
        case .manageEvents:
            // Navigate to events management
            break
        case .manageProducts:
            // Navigate to products management
            break
        case .manageBookings:
            // Navigate to bookings management
            break
        case .viewAnalytics:
            // Navigate to analytics
            break
        case .viewOrders:
            // Navigate to orders
            break
        case .viewReviews:
            // Navigate to reviews
            break
        }
    }
    
    func logout() async {
        do {
            isLoading = true
            
            // Firebase sign out
            try Auth.auth().signOut()
            
            // Backend logout
            let _: MessageResponse = try await NetworkService.shared.request(
                endpoint: "/auth/logout",
                method: "POST"
            )
            
            isLoggedOut = true
            
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
}

// MARK: - Models
struct UserStats: Codable {
    var totalOrders: Int = 0
    var totalEvents: Int = 0
    var totalReviews: Int = 0
}

struct ProfileStatsResponse: Codable {
    let success: Bool
    let data: User
    let userStats: UserStats
    let businessStats: BusinessStats
    let message: String?
}

struct ImageUploadResponse: Codable {
    let success: Bool
    let imageUrl: String
    let message: String?
}

struct MessageResponse: Codable {
    let success: Bool
    let message: String
}

enum ProfileAction: String, Identifiable {
    case manageEvents = "Manage Events"
    case manageProducts = "Manage Products"
    case manageBookings = "Manage Bookings"
    case viewAnalytics = "View Analytics"
    case viewOrders = "View Orders"
    case viewReviews = "View Reviews"
    
    var id: String { rawValue }
    
    var iconName: String {
        switch self {
        case .manageEvents: return "calendar"
        case .manageProducts: return "cube.box"
        case .manageBookings: return "book"
        case .viewAnalytics: return "chart.bar"
        case .viewOrders: return "list.bullet"
        case .viewReviews: return "star"
        }
    }
    
    var title: String { rawValue }
    
    var color: Color {
        switch self {
        case .manageEvents: return .blue
        case .manageProducts: return .green
        case .manageBookings: return .purple
        case .viewAnalytics: return .orange
        case .viewOrders: return .pink
        case .viewReviews: return .yellow
        }
    }
    
    static func actions(for role: UserRole) -> [ProfileAction] {
        switch role {
        case .business:
            return [.manageEvents, .manageProducts, .manageBookings, .viewAnalytics, .viewOrders, .viewReviews]
        case .user:
            return [.viewOrders, .viewReviews]
        case .admin:
            return [.viewAnalytics, .viewOrders, .viewReviews]
        }
    }
} 