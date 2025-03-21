import Foundation

enum NotificationType: String, Codable {
    case eventInvitation = "event_invitation"
    case eventUpdate = "event_update"
    case eventReminder = "event_reminder"
    case chatMessage = "chat_message"
    case friendRequest = "friend_request"
    case system = "system"
}

struct Notification: Identifiable, Codable {
    let id: String
    let title: String
    let message: String
    let type: NotificationType
    let createdAt: Date
    let isRead: Bool
    let relatedId: String?
    
    var formattedDate: String {
        let formatter = RelativeDateTimeFormatter()
        return formatter.localizedString(for: createdAt, relativeTo: Date())
    }
}

struct NotificationPreferences: Codable {
    var eventInvitations: Bool
    var eventUpdates: Bool
    var eventReminders: Bool
    var chatMessages: Bool
    var friendRequests: Bool
    var systemNotifications: Bool
    var emailNotifications: Bool
    var pushNotifications: Bool
    
    static var `default`: NotificationPreferences {
        NotificationPreferences(
            eventInvitations: true,
            eventUpdates: true,
            eventReminders: true,
            chatMessages: true,
            friendRequests: true,
            systemNotifications: true,
            emailNotifications: true,
            pushNotifications: true
        )
    }
}

// Response types
struct NotificationResponse: Codable {
    let success: Bool
    let data: Notification
    let message: String?
}

struct NotificationsResponse: Codable {
    let success: Bool
    let data: [Notification]
    let unreadCount: Int
    let message: String?
}

struct NotificationPreferencesResponse: Codable {
    let success: Bool
    let data: NotificationPreferences
    let message: String?
} 