import Foundation

protocol NotificationRepository {
    func getNotifications(page: Int, limit: Int) async throws -> ([Notification], ListMetadata)
    func getUnreadCount() async throws -> Int
    func markAsRead(id: String) async throws -> Bool
    func markAllAsRead() async throws -> Bool
    func deleteNotification(id: String) async throws -> Bool
    func updateNotificationSettings(settings: NotificationSettings) async throws -> NotificationSettings
    func getNotificationSettings() async throws -> NotificationSettings
    func registerDeviceToken(_ token: String, deviceType: String) async throws -> Bool
    func unregisterDeviceToken(_ token: String) async throws -> Bool
}

class NotificationRepositoryImpl: NotificationRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedNotification>
    private var settingsCache: CachedSettings?
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func getNotifications(page: Int, limit: Int) async throws -> ([Notification], ListMetadata) {
        let response: NotificationListResponse = try await apiService.request(
            endpoint: "/notifications",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        
        response.data.forEach { notification in
            cache.setObject(
                CachedNotification(notification: notification, timestamp: Date()),
                forKey: notification.id as NSString
            )
        }
        
        return (response.data, response.metadata)
    }
    
    func getUnreadCount() async throws -> Int {
        let response: UnreadCountResponse = try await apiService.request(
            endpoint: "/notifications/unread/count",
            method: "GET"
        )
        return response.count
    }
    
    func markAsRead(id: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/notifications/\(id)/read",
            method: "PUT"
        )
        
        if response.success {
            cache.removeObject(forKey: id as NSString)
        }
        
        return response.success
    }
    
    func markAllAsRead() async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/notifications/read/all",
            method: "PUT"
        )
        
        if response.success {
            cache.removeAllObjects()
        }
        
        return response.success
    }
    
    func deleteNotification(id: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/notifications/\(id)",
            method: "DELETE"
        )
        
        if response.success {
            cache.removeObject(forKey: id as NSString)
        }
        
        return response.success
    }
    
    func updateNotificationSettings(settings: NotificationSettings) async throws -> NotificationSettings {
        let response: NotificationSettingsResponse = try await apiService.request(
            endpoint: "/notifications/settings",
            method: "PUT",
            body: try JSONEncoder().encode(settings)
        )
        
        settingsCache = CachedSettings(settings: response.data, timestamp: Date())
        return response.data
    }
    
    func getNotificationSettings() async throws -> NotificationSettings {
        if let cached = settingsCache,
           Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
            return cached.settings
        }
        
        let response: NotificationSettingsResponse = try await apiService.request(
            endpoint: "/notifications/settings",
            method: "GET"
        )
        
        settingsCache = CachedSettings(settings: response.data, timestamp: Date())
        return response.data
    }
    
    func registerDeviceToken(_ token: String, deviceType: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/notifications/devices",
            method: "POST",
            body: try JSONEncoder().encode([
                "token": token,
                "type": deviceType
            ])
        )
        return response.success
    }
    
    func unregisterDeviceToken(_ token: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/notifications/devices/\(token)",
            method: "DELETE"
        )
        return response.success
    }
}

// MARK: - Cache Types
private class CachedNotification {
    let notification: Notification
    let timestamp: Date
    
    init(notification: Notification, timestamp: Date) {
        self.notification = notification
        self.timestamp = timestamp
    }
}

private class CachedSettings {
    let settings: NotificationSettings
    let timestamp: Date
    
    init(settings: NotificationSettings, timestamp: Date) {
        self.settings = settings
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct NotificationResponse: Codable {
    let success: Bool
    let data: Notification
    let message: String?
}

struct NotificationListResponse: Codable {
    let success: Bool
    let data: [Notification]
    let message: String?
    let metadata: ListMetadata
}

struct NotificationSettingsResponse: Codable {
    let success: Bool
    let data: NotificationSettings
    let message: String?
}

struct UnreadCountResponse: Codable {
    let success: Bool
    let count: Int
    let message: String?
}

// MARK: - Errors
enum NotificationError: LocalizedError {
    case invalidNotification
    case notificationNotFound
    case invalidSettings
    case deviceRegistrationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidNotification:
            return "Invalid notification"
        case .notificationNotFound:
            return "Notification not found"
        case .invalidSettings:
            return "Invalid notification settings"
        case .deviceRegistrationFailed:
            return "Failed to register device for notifications"
        }
    }
} 