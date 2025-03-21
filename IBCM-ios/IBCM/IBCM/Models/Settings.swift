import Foundation

struct Settings: Codable {
    var appearance: AppearanceSettings
    var notifications: NotificationSettings
    var privacy: PrivacySettings
    var location: LocationSettings
    var language: String
    
    static var `default`: Settings {
        Settings(
            appearance: .default,
            notifications: .default,
            privacy: .default,
            location: .default,
            language: "en"
        )
    }
}

struct AppearanceSettings: Codable {
    var darkThemeEnabled: Bool
    var fontSize: FontSize
    var colorScheme: ColorScheme
    
    static var `default`: AppearanceSettings {
        AppearanceSettings(
            darkThemeEnabled: false,
            fontSize: .medium,
            colorScheme: .system
        )
    }
    
    enum FontSize: String, Codable, CaseIterable {
        case small
        case medium
        case large
    }
    
    enum ColorScheme: String, Codable, CaseIterable {
        case light
        case dark
        case system
    }
}

struct NotificationSettings: Codable {
    var eventRemindersEnabled: Bool
    var eventUpdatesEnabled: Bool
    var commentNotificationsEnabled: Bool
    var chatNotificationsEnabled: Bool
    var emailNotificationsEnabled: Bool
    var pushNotificationsEnabled: Bool
    
    static var `default`: NotificationSettings {
        NotificationSettings(
            eventRemindersEnabled: true,
            eventUpdatesEnabled: true,
            commentNotificationsEnabled: true,
            chatNotificationsEnabled: true,
            emailNotificationsEnabled: true,
            pushNotificationsEnabled: true
        )
    }
}

struct PrivacySettings: Codable {
    var profileVisibility: ProfileVisibility
    var showLocation: Bool
    var showOnlineStatus: Bool
    var allowFriendRequests: Bool
    var allowMessagesFromNonFriends: Bool
    
    static var `default`: PrivacySettings {
        PrivacySettings(
            profileVisibility: .public,
            showLocation: true,
            showOnlineStatus: true,
            allowFriendRequests: true,
            allowMessagesFromNonFriends: false
        )
    }
    
    enum ProfileVisibility: String, Codable, CaseIterable {
        case `public`
        case friendsOnly
        case `private`
    }
}

struct LocationSettings: Codable {
    var locationEnabled: Bool
    var distanceUnit: DistanceUnit
    var shareLocation: Bool
    
    static var `default`: LocationSettings {
        LocationSettings(
            locationEnabled: true,
            distanceUnit: .kilometers,
            shareLocation: true
        )
    }
    
    enum DistanceUnit: String, Codable, CaseIterable {
        case kilometers = "km"
        case miles = "mi"
    }
}

// MARK: - Response Types
struct SettingsResponse: Codable {
    let success: Bool
    let data: Settings
    let message: String?
}

struct SettingsUpdateResponse: Codable {
    let success: Bool
    let message: String?
} 