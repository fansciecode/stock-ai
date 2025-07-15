import Foundation
import Combine

// MARK: - Settings Models

struct AppSettings {
    var appearance: AppearanceSettings
    var notifications: NotificationSettings
    var privacy: PrivacySettings
    var location: LocationSettings
    var language: String
    
    static var defaultSettings: AppSettings {
        return AppSettings(
            appearance: AppearanceSettings.defaultSettings,
            notifications: NotificationSettings.defaultSettings,
            privacy: PrivacySettings.defaultSettings,
            location: LocationSettings.defaultSettings,
            language: "en"
        )
    }
}

struct AppearanceSettings {
    var darkThemeEnabled: Bool
    var colorScheme: ColorScheme
    var fontSize: FontSize
    
    enum ColorScheme: String, CaseIterable {
        case blue
        case green
        case purple
        case orange
        case red
    }
    
    enum FontSize: String, CaseIterable {
        case small
        case medium
        case large
        case extraLarge
    }
    
    static var defaultSettings: AppearanceSettings {
        return AppearanceSettings(
            darkThemeEnabled: false,
            colorScheme: .blue,
            fontSize: .medium
        )
    }
}

struct NotificationSettings {
    var eventRemindersEnabled: Bool
    var eventUpdatesEnabled: Bool
    var commentNotificationsEnabled: Bool
    var chatNotificationsEnabled: Bool
    var pushNotificationsEnabled: Bool
    var emailNotificationsEnabled: Bool
    
    static var defaultSettings: NotificationSettings {
        return NotificationSettings(
            eventRemindersEnabled: true,
            eventUpdatesEnabled: true,
            commentNotificationsEnabled: true,
            chatNotificationsEnabled: true,
            pushNotificationsEnabled: true,
            emailNotificationsEnabled: true
        )
    }
}

struct PrivacySettings {
    var profileVisibility: ProfileVisibility
    var showLocation: Bool
    var showOnlineStatus: Bool
    var allowFriendRequests: Bool
    var allowMessagesFromNonFriends: Bool
    
    enum ProfileVisibility: String, CaseIterable {
        case everyone
        case friends
        case private
    }
    
    static var defaultSettings: PrivacySettings {
        return PrivacySettings(
            profileVisibility: .everyone,
            showLocation: true,
            showOnlineStatus: true,
            allowFriendRequests: true,
            allowMessagesFromNonFriends: false
        )
    }
}

struct LocationSettings {
    var locationEnabled: Bool
    var shareLocation: Bool
    var distanceUnit: DistanceUnit
    
    enum DistanceUnit: String, CaseIterable {
        case kilometers
        case miles
    }
    
    static var defaultSettings: LocationSettings {
        return LocationSettings(
            locationEnabled: true,
            shareLocation: true,
            distanceUnit: .kilometers
        )
    }
}

// MARK: - Settings View Model

class SettingsViewModel: ObservableObject {
    @Published var settings: AppSettings = AppSettings.defaultSettings
    @Published var isLoading = false
    @Published var showError = false
    @Published var errorMessage: String?
    
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        loadSettingsFromStorage()
    }
    
    // MARK: - Settings Loading
    
    func loadSettingsFromStorage() {
        // In a real app, you would load settings from UserDefaults or a database
        // For this example, we'll use default settings
        settings = AppSettings.defaultSettings
    }
    
    func loadSettings() async {
        // Simulate loading settings from an API
        isLoading = true
        
        do {
            try await Task.sleep(nanoseconds: 1_000_000_000) // 1 second
            
            // In a real app, you would fetch settings from an API
            DispatchQueue.main.async {
                self.isLoading = false
            }
        } catch {
            DispatchQueue.main.async {
                self.isLoading = false
                self.showError = true
                self.errorMessage = "Failed to load settings: \(error.localizedDescription)"
            }
        }
    }
    
    // MARK: - Settings Saving
    
    private func saveSettings() {
        // In a real app, you would save settings to UserDefaults or a database
        // For this example, we'll just print the settings
        print("Settings saved: \(settings)")
        
        // Simulate API call to save settings
        Task {
            do {
                try await Task.sleep(nanoseconds: 500_000_000) // 0.5 seconds
                // In a real app, you would make an API call here
            } catch {
                DispatchQueue.main.async {
                    self.showError = true
                    self.errorMessage = "Failed to save settings: \(error.localizedDescription)"
                }
            }
        }
    }
    
    // MARK: - Appearance Settings
    
    func toggleDarkTheme() {
        settings.appearance.darkThemeEnabled.toggle()
        saveSettings()
    }
    
    func setColorScheme(_ colorScheme: AppearanceSettings.ColorScheme) {
        settings.appearance.colorScheme = colorScheme
        saveSettings()
    }
    
    func setFontSize(_ fontSize: AppearanceSettings.FontSize) {
        settings.appearance.fontSize = fontSize
        saveSettings()
    }
    
    // MARK: - Notification Settings
    
    func toggleEventReminders() {
        settings.notifications.eventRemindersEnabled.toggle()
        saveSettings()
    }
    
    func toggleEventUpdates() {
        settings.notifications.eventUpdatesEnabled.toggle()
        saveSettings()
    }
    
    func toggleCommentNotifications() {
        settings.notifications.commentNotificationsEnabled.toggle()
        saveSettings()
    }
    
    func toggleChatNotifications() {
        settings.notifications.chatNotificationsEnabled.toggle()
        saveSettings()
    }
    
    func togglePushNotifications() {
        settings.notifications.pushNotificationsEnabled.toggle()
        saveSettings()
    }
    
    func toggleEmailNotifications() {
        settings.notifications.emailNotificationsEnabled.toggle()
        saveSettings()
    }
    
    // MARK: - Privacy Settings
    
    func setProfileVisibility(_ visibility: PrivacySettings.ProfileVisibility) {
        settings.privacy.profileVisibility = visibility
        saveSettings()
    }
    
    func toggleShowLocation() {
        settings.privacy.showLocation.toggle()
        saveSettings()
    }
    
    func toggleOnlineStatus() {
        settings.privacy.showOnlineStatus.toggle()
        saveSettings()
    }
    
    func toggleFriendRequests() {
        settings.privacy.allowFriendRequests.toggle()
        saveSettings()
    }
    
    func toggleMessagesFromNonFriends() {
        settings.privacy.allowMessagesFromNonFriends.toggle()
        saveSettings()
    }
    
    // MARK: - Location Settings
    
    func toggleLocationEnabled() {
        settings.location.locationEnabled.toggle()
        if !settings.location.locationEnabled {
            settings.location.shareLocation = false
        }
        saveSettings()
    }
    
    func toggleShareLocation() {
        settings.location.shareLocation.toggle()
        saveSettings()
    }
    
    func setDistanceUnit(_ unit: LocationSettings.DistanceUnit) {
        settings.location.distanceUnit = unit
        saveSettings()
    }
    
    // MARK: - Language Settings
    
    func setLanguage(_ language: String) {
        settings.language = language
        saveSettings()
    }
} 