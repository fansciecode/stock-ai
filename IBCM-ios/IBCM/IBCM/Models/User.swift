import Foundation

struct User: Codable, Identifiable {
    let id: String
    var email: String
    var username: String
    var fullName: String?
    var phoneNumber: String?
    var profileImage: String?
    var role: UserRole
    var isVerified: Bool
    var createdAt: Date
    var updatedAt: Date
    
    enum UserRole: String, Codable {
        case user
        case business
        case admin
    }
}

// MARK: - User Response
struct UserResponse: Codable {
    let success: Bool
    let data: User
    let message: String?
} 