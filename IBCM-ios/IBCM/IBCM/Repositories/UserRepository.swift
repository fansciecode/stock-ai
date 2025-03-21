import Foundation

protocol UserRepository {
    func getProfile() async throws -> User
    func updateProfile(name: String?, email: String?, phone: String?, bio: String?, avatar: Data?) async throws -> User
    func updatePassword(currentPassword: String, newPassword: String) async throws -> Bool
    func updateNotificationPreferences(preferences: NotificationPreferences) async throws -> Bool
    func deleteAccount() async throws -> Bool
    func getBlockedUsers() async throws -> [User]
    func blockUser(userId: String) async throws -> Bool
    func unblockUser(userId: String) async throws -> Bool
}

class UserRepositoryImpl: UserRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedUser>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func getProfile() async throws -> User {
        if let cachedUser = cache.object(forKey: "current_user" as NSString) {
            if Date().timeIntervalSince(cachedUser.timestamp) < 300 { // 5 minutes cache
                return cachedUser.user
            }
        }
        
        let response: UserResponse = try await apiService.request(
            endpoint: "/users/profile",
            method: "GET"
        )
        
        let user = response.data
        cache.setObject(CachedUser(user: user, timestamp: Date()), forKey: "current_user" as NSString)
        return user
    }
    
    func updateProfile(name: String?, email: String?, phone: String?, bio: String?, avatar: Data?) async throws -> User {
        var formData = [String: Any]()
        if let name = name { formData["name"] = name }
        if let email = email { formData["email"] = email }
        if let phone = phone { formData["phone"] = phone }
        if let bio = bio { formData["bio"] = bio }
        
        let response: UserResponse = try await apiService.request(
            endpoint: "/users/profile",
            method: "PUT",
            body: try JSONEncoder().encode(formData),
            multipartData: avatar.map { [
                "avatar": MultipartData(data: $0, mimeType: "image/jpeg", filename: "avatar.jpg")
            ] }
        )
        
        let user = response.data
        cache.setObject(CachedUser(user: user, timestamp: Date()), forKey: "current_user" as NSString)
        return user
    }
    
    func updatePassword(currentPassword: String, newPassword: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/users/password",
            method: "PUT",
            body: try JSONEncoder().encode([
                "current_password": currentPassword,
                "new_password": newPassword
            ])
        )
        return response.success
    }
    
    func updateNotificationPreferences(preferences: NotificationPreferences) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/users/notification-preferences",
            method: "PUT",
            body: try JSONEncoder().encode(preferences)
        )
        return response.success
    }
    
    func deleteAccount() async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/users/account",
            method: "DELETE"
        )
        
        if response.success {
            cache.removeAllObjects()
        }
        
        return response.success
    }
    
    func getBlockedUsers() async throws -> [User] {
        let response: UserListResponse = try await apiService.request(
            endpoint: "/users/blocked",
            method: "GET"
        )
        return response.data
    }
    
    func blockUser(userId: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/users/\(userId)/block",
            method: "POST"
        )
        return response.success
    }
    
    func unblockUser(userId: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/users/\(userId)/unblock",
            method: "POST"
        )
        return response.success
    }
}

// MARK: - Cache Types
private class CachedUser {
    let user: User
    let timestamp: Date
    
    init(user: User, timestamp: Date) {
        self.user = user
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct UserResponse: Codable {
    let success: Bool
    let data: User
    let message: String?
}

struct UserListResponse: Codable {
    let success: Bool
    let data: [User]
    let message: String?
}

struct BasicResponse: Codable {
    let success: Bool
    let message: String?
}

// MARK: - Multipart Data
struct MultipartData {
    let data: Data
    let mimeType: String
    let filename: String
} 