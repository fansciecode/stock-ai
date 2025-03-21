import Foundation
import SwiftUI

@MainActor
class SettingsViewModel: ObservableObject {
    @Published var settings = Settings.default
    @Published var isLoading = false
    @Published var isSaving = false
    @Published var errorMessage: String?
    @Published var showError = false
    
    private let apiService: APIService
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        Task {
            await loadSettings()
        }
    }
    
    func loadSettings() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: SettingsResponse = try await apiService.request(
                endpoint: "/settings",
                method: "GET"
            )
            settings = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    private func updateSettings() async {
        isSaving = true
        errorMessage = nil
        
        do {
            let response: SettingsUpdateResponse = try await apiService.request(
                endpoint: "/settings",
                method: "PUT",
                body: try JSONEncoder().encode(settings)
            )
            
            if !response.success {
                errorMessage = response.message ?? "Failed to update settings"
                showError = true
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isSaving = false
    }
    
    // MARK: - Appearance Settings
    func toggleDarkTheme() {
        settings.appearance.darkThemeEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func setFontSize(_ size: AppearanceSettings.FontSize) {
        settings.appearance.fontSize = size
        Task {
            await updateSettings()
        }
    }
    
    func setColorScheme(_ scheme: AppearanceSettings.ColorScheme) {
        settings.appearance.colorScheme = scheme
        Task {
            await updateSettings()
        }
    }
    
    // MARK: - Notification Settings
    func toggleEventReminders() {
        settings.notifications.eventRemindersEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleEventUpdates() {
        settings.notifications.eventUpdatesEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleCommentNotifications() {
        settings.notifications.commentNotificationsEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleChatNotifications() {
        settings.notifications.chatNotificationsEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleEmailNotifications() {
        settings.notifications.emailNotificationsEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func togglePushNotifications() {
        settings.notifications.pushNotificationsEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    // MARK: - Privacy Settings
    func setProfileVisibility(_ visibility: PrivacySettings.ProfileVisibility) {
        settings.privacy.profileVisibility = visibility
        Task {
            await updateSettings()
        }
    }
    
    func toggleShowLocation() {
        settings.privacy.showLocation.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleOnlineStatus() {
        settings.privacy.showOnlineStatus.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleFriendRequests() {
        settings.privacy.allowFriendRequests.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func toggleMessagesFromNonFriends() {
        settings.privacy.allowMessagesFromNonFriends.toggle()
        Task {
            await updateSettings()
        }
    }
    
    // MARK: - Location Settings
    func toggleLocationEnabled() {
        settings.location.locationEnabled.toggle()
        Task {
            await updateSettings()
        }
    }
    
    func setDistanceUnit(_ unit: LocationSettings.DistanceUnit) {
        settings.location.distanceUnit = unit
        Task {
            await updateSettings()
        }
    }
    
    func toggleShareLocation() {
        settings.location.shareLocation.toggle()
        Task {
            await updateSettings()
        }
    }
    
    // MARK: - Language Settings
    func setLanguage(_ language: String) {
        settings.language = language
        Task {
            await updateSettings()
        }
    }
} 