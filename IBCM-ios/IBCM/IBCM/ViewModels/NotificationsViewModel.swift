import Foundation

@MainActor
class NotificationsViewModel: ObservableObject {
    @Published var notifications: [Notification] = []
    @Published var unreadCount = 0
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var preferences: NotificationPreferences = .default
    
    func loadNotifications() async {
        isLoading = true
        do {
            let response: NotificationsResponse = try await NetworkService.shared.request(
                endpoint: "/notifications",
                method: "GET"
            )
            notifications = response.data
            unreadCount = response.unreadCount
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    func markAsRead(notificationId: String) async {
        do {
            let response: NotificationResponse = try await NetworkService.shared.request(
                endpoint: "/notifications/\(notificationId)/read",
                method: "PUT"
            )
            
            if let index = notifications.firstIndex(where: { $0.id == notificationId }) {
                notifications[index] = response.data
            }
            
            unreadCount = max(0, unreadCount - 1)
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func markAllAsRead() async {
        do {
            try await NetworkService.shared.request(
                endpoint: "/notifications/read-all",
                method: "PUT"
            ) as EmptyResponse
            
            notifications = notifications.map { notification in
                Notification(
                    id: notification.id,
                    title: notification.title,
                    message: notification.message,
                    type: notification.type,
                    createdAt: notification.createdAt,
                    isRead: true,
                    relatedId: notification.relatedId
                )
            }
            
            unreadCount = 0
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func deleteNotification(notificationId: String) async {
        do {
            try await NetworkService.shared.request(
                endpoint: "/notifications/\(notificationId)",
                method: "DELETE"
            ) as EmptyResponse
            
            notifications.removeAll { $0.id == notificationId }
            if let notification = notifications.first(where: { $0.id == notificationId }), !notification.isRead {
                unreadCount = max(0, unreadCount - 1)
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func loadPreferences() async {
        do {
            let response: NotificationPreferencesResponse = try await NetworkService.shared.request(
                endpoint: "/notifications/preferences",
                method: "GET"
            )
            preferences = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func updatePreferences() async {
        do {
            let response: NotificationPreferencesResponse = try await NetworkService.shared.request(
                endpoint: "/notifications/preferences",
                method: "PUT",
                body: try JSONEncoder().encode(preferences)
            )
            preferences = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func handleNotificationTap(notification: Notification) {
        guard let relatedId = notification.relatedId else { return }
        
        switch notification.type {
        case .eventInvitation, .eventUpdate, .eventReminder:
            NotificationCenter.default.post(
                name: .openEvent,
                object: nil,
                userInfo: ["eventId": relatedId]
            )
            
        case .chatMessage:
            NotificationCenter.default.post(
                name: .openChat,
                object: nil,
                userInfo: ["chatId": relatedId]
            )
            
        case .friendRequest:
            NotificationCenter.default.post(
                name: .openProfile,
                object: nil,
                userInfo: ["userId": relatedId]
            )
            
        case .system:
            break
        }
        
        Task {
            await markAsRead(notificationId: notification.id)
        }
    }
} 