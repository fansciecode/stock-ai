import Foundation

enum Environment {
    // MARK: - API Configuration
    static let apiBaseURL: URL = {
        #if DEBUG
        return URL(string: "YOUR_DEV_API_URL")!
        #else
        return URL(string: "YOUR_PROD_API_URL")!
        #endif
    }()
    
    static let webSocketURL: URL = {
        #if DEBUG
        return URL(string: "YOUR_DEV_WEBSOCKET_URL")!
        #else
        return URL(string: "YOUR_PROD_WEBSOCKET_URL")!
        #endif
    }()
    
    // MARK: - App Configuration
    static let appName = "IBCM"
    static let appVersion = Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
    static let buildNumber = Bundle.main.infoDictionary?["CFBundleVersion"] as? String ?? "1"
    
    // MARK: - API Keys
    static let googleMapsAPIKey = "YOUR_GOOGLE_MAPS_API_KEY"
    static let stripePublishableKey = "YOUR_STRIPE_PUBLISHABLE_KEY"
    
    // MARK: - Feature Flags
    static let isAnalyticsEnabled = true
    static let isCrashReportingEnabled = true
    
    // MARK: - Timeouts
    static let networkTimeout: TimeInterval = 30
    static let webSocketTimeout: TimeInterval = 30
    
    // MARK: - Cache Configuration
    static let maxImageCacheSize: UInt = 50 * 1024 * 1024 // 50 MB
    static let maxDiskCacheSize: UInt = 100 * 1024 * 1024 // 100 MB
    
    // MARK: - URLs
    static let termsOfServiceURL = URL(string: "https://your-domain.com/terms")!
    static let privacyPolicyURL = URL(string: "https://your-domain.com/privacy")!
    static let supportURL = URL(string: "https://your-domain.com/support")!
} 