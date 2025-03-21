import Foundation

protocol UserAPIService: BaseAPIService {
    func login(email: String, password: String) async throws -> User
    func signup(userData: SignupRequest) async throws -> User
    func logout() async throws
    func getCurrentUser() async throws -> User
    func updateProfile(user: User) async throws -> User
    func updatePreferences(preferences: [String: Any]) async throws -> User
    func updateCategories(categories: [String: [String]]) async throws -> User
    func deleteAccount() async throws
    func resetPassword(email: String) async throws
    func verifyEmail(token: String) async throws
    func updateProfilePicture(imageUrl: String) async throws -> String
    func getUserById(userId: String) async throws -> User
    func searchUsers(query: String) async throws -> [User]
    func updateUser(userId: String, userData: UserUpdateRequest) async throws -> User
    func getAttendingEvents(userId: String) async throws -> [Event]
    func getUserSettings(userId: String) async throws -> UserSettings
    func updateUserSettings(userId: String, settings: [String: Any]) async throws -> User
    func getUserFriends(userId: String) async throws -> [User]
    func addFriend(userId: String, friendId: String) async throws
    func removeFriend(userId: String, friendId: String) async throws
    func getBlockedUsers(userId: String) async throws -> [User]
    func blockUser(userId: String, blockedId: String) async throws
    func unblockUser(userId: String, blockedId: String) async throws
    func updatePassword(userId: String, currentPassword: String, newPassword: String) async throws
    func verifyUser(userId: String) async throws
    func getUserNotifications(userId: String) async throws -> [Notification]
    func updateNotificationStatus(userId: String, notificationId: String, read: Bool) async throws
    func getUserPreferences(userId: String) async throws -> [String: Any]
    func updateUserPreferences(userId: String, preferences: [String: Any]) async throws -> User
    func followUser(userId: String) async throws
    func unfollowUser(userId: String) async throws
    func getUserFollowers(userId: String) async throws -> [User]
    func getUserFollowing(userId: String) async throws -> [User]
}

struct SignupRequest: Codable {
    let email: String
    let password: String
    let displayName: String
    let phoneNumber: String?
    let dateOfBirth: Date?
    let gender: String?
}

struct UserUpdateRequest: Codable {
    let displayName: String?
    let email: String?
    let bio: String?
    let profilePictureUrl: String?
}

class UserAPIServiceImpl: UserAPIService {
    func login(email: String, password: String) async throws -> User {
        let credentials = ["email": email, "password": password]
        return try await apiService.request(
            endpoint: "auth/login",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(credentials)
        )
    }
    
    func signup(userData: SignupRequest) async throws -> User {
        return try await apiService.request(
            endpoint: "auth/signup",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(userData)
        )
    }
    
    func logout() async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "auth/logout",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func getCurrentUser() async throws -> User {
        return try await apiService.request(
            endpoint: "users/me",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateProfile(user: User) async throws -> User {
        return try await apiService.request(
            endpoint: "users/me",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(user)
        )
    }
    
    func updatePreferences(preferences: [String: Any]) async throws -> User {
        return try await apiService.request(
            endpoint: "users/me/preferences",
            method: HTTPMethod.put.rawValue,
            body: try JSONSerialization.data(withJSONObject: preferences)
        )
    }
    
    func updateCategories(categories: [String: [String]]) async throws -> User {
        return try await apiService.request(
            endpoint: "users/me/categories",
            method: HTTPMethod.put.rawValue,
            body: try JSONSerialization.data(withJSONObject: categories)
        )
    }
    
    func deleteAccount() async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/me",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func resetPassword(email: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "auth/reset-password",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(["email": email])
        )
    }
    
    func verifyEmail(token: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "auth/verify-email",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(["token": token])
        )
    }
    
    func updateProfilePicture(imageUrl: String) async throws -> String {
        let response: [String: String] = try await apiService.request(
            endpoint: "users/me/profile-picture",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(["imageUrl": imageUrl])
        )
        return response["url"] ?? imageUrl
    }
    
    func getUserById(userId: String) async throws -> User {
        return try await apiService.request(
            endpoint: "users/\(userId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func searchUsers(query: String) async throws -> [User] {
        return try await apiService.request(
            endpoint: "users/search",
            method: HTTPMethod.get.rawValue,
            queryItems: [URLQueryItem(name: "q", value: query)]
        )
    }
    
    func updateUser(userId: String, userData: UserUpdateRequest) async throws -> User {
        return try await apiService.request(
            endpoint: "users/\(userId)",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(userData)
        )
    }
    
    func getAttendingEvents(userId: String) async throws -> [Event] {
        return try await apiService.request(
            endpoint: "users/\(userId)/events/attending",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getUserSettings(userId: String) async throws -> UserSettings {
        return try await apiService.request(
            endpoint: "users/\(userId)/settings",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateUserSettings(userId: String, settings: [String: Any]) async throws -> User {
        return try await apiService.request(
            endpoint: "users/\(userId)/settings",
            method: HTTPMethod.put.rawValue,
            body: try JSONSerialization.data(withJSONObject: settings)
        )
    }
    
    func getUserFriends(userId: String) async throws -> [User] {
        return try await apiService.request(
            endpoint: "users/\(userId)/friends",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func addFriend(userId: String, friendId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/friends/\(friendId)",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func removeFriend(userId: String, friendId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/friends/\(friendId)",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func getBlockedUsers(userId: String) async throws -> [User] {
        return try await apiService.request(
            endpoint: "users/\(userId)/blocked",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func blockUser(userId: String, blockedId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/block/\(blockedId)",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func unblockUser(userId: String, blockedId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/block/\(blockedId)",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func updatePassword(userId: String, currentPassword: String, newPassword: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/password",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode([
                "currentPassword": currentPassword,
                "newPassword": newPassword
            ])
        )
    }
    
    func verifyUser(userId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/verify",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func getUserNotifications(userId: String) async throws -> [Notification] {
        return try await apiService.request(
            endpoint: "users/\(userId)/notifications",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateNotificationStatus(userId: String, notificationId: String, read: Bool) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/notifications/\(notificationId)",
            method: HTTPMethod.put.rawValue,
            queryItems: [URLQueryItem(name: "read", value: String(read))]
        )
    }
    
    func getUserPreferences(userId: String) async throws -> [String: Any] {
        return try await apiService.request(
            endpoint: "users/\(userId)/preferences",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateUserPreferences(userId: String, preferences: [String: Any]) async throws -> User {
        return try await apiService.request(
            endpoint: "users/\(userId)/preferences",
            method: HTTPMethod.put.rawValue,
            body: try JSONSerialization.data(withJSONObject: preferences)
        )
    }
    
    func followUser(userId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/follow",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func unfollowUser(userId: String) async throws {
        let _: EmptyResponse = try await apiService.request(
            endpoint: "users/\(userId)/unfollow",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func getUserFollowers(userId: String) async throws -> [User] {
        return try await apiService.request(
            endpoint: "users/\(userId)/followers",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getUserFollowing(userId: String) async throws -> [User] {
        return try await apiService.request(
            endpoint: "users/\(userId)/following",
            method: HTTPMethod.get.rawValue
        )
    }
} 