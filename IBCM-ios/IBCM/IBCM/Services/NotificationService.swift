import Foundation
import UserNotifications
import UIKit

@MainActor
class NotificationService: NSObject, ObservableObject, UNUserNotificationCenterDelegate {
    static let shared = NotificationService()
    
    @Published var hasPermission = false
    @Published var deviceToken: String?
    
    private override init() {
        super.init()
        UNUserNotificationCenter.current().delegate = self
    }
    
    func requestPermission() async throws {
        let center = UNUserNotificationCenter.current()
        let options: UNAuthorizationOptions = [.alert, .sound, .badge]
        
        let granted = try await center.requestAuthorization(options: options)
        hasPermission = granted
        
        await MainActor.run {
            UIApplication.shared.registerForRemoteNotifications()
        }
    }
    
    func updateDeviceToken(_ token: Data) {
        let tokenString = token.map { String(format: "%02.2hhx", $0) }.joined()
        deviceToken = tokenString
        
        Task {
            do {
                try await registerDevice(token: tokenString)
            } catch {
                print("Failed to register device token:", error)
            }
        }
    }
    
    private func registerDevice(token: String) async throws {
        let deviceInfo = [
            "deviceId": token,
            "platform": "ios",
            "userId": UserDefaults.standard.string(forKey: "userId") ?? ""
        ]
        
        try await NetworkService.shared.request(
            endpoint: "/notifications/register",
            method: "POST",
            body: try JSONEncoder().encode(deviceInfo)
        ) as EmptyResponse
    }
    
    func unregisterDevice() async throws {
        guard let token = deviceToken else { return }
        
        try await NetworkService.shared.request(
            endpoint: "/notifications/unregister?deviceId=\(token)",
            method: "DELETE"
        ) as EmptyResponse
    }
    
    // MARK: - UNUserNotificationCenterDelegate
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        willPresent notification: UNNotification
    ) async -> UNNotificationPresentationOptions {
        // Show notification when app is in foreground
        return [.banner, .sound, .badge]
    }
    
    func userNotificationCenter(
        _ center: UNUserNotificationCenter,
        didReceive response: UNNotificationResponse
    ) async {
        // Handle notification tap
        let userInfo = response.notification.request.content.userInfo
        guard let notificationType = userInfo["type"] as? String,
              let relatedId = userInfo["relatedId"] as? String else {
            return
        }
        
        // Handle different notification types
        switch notificationType {
        case "event_invitation", "event_update", "event_reminder":
            NotificationCenter.default.post(
                name: .openEvent,
                object: nil,
                userInfo: ["eventId": relatedId]
            )
            
        case "chat_message":
            NotificationCenter.default.post(
                name: .openChat,
                object: nil,
                userInfo: ["chatId": relatedId]
            )
            
        case "friend_request":
            NotificationCenter.default.post(
                name: .openProfile,
                object: nil,
                userInfo: ["userId": relatedId]
            )
            
        default:
            break
        }
    }
}

// MARK: - Notification Names
extension Notification.Name {
    static let openEvent = Notification.Name("openEvent")
    static let openChat = Notification.Name("openChat")
    static let openProfile = Notification.Name("openProfile")
}

// MARK: - Empty Response
struct EmptyResponse: Codable {
    let success: Bool
    let message: String?
} 