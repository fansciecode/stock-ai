import Foundation

enum Environment: String {
    case development = "dev"
    case staging = "staging"
    case production = "prod"
}

class ConfigurationService {
    static let shared = ConfigurationService()
    
    private let environment: Environment
    
    private init() {
        #if DEBUG
        self.environment = .development
        #else
        self.environment = .production
        #endif
    }
    
    var baseURL: String {
        switch environment {
        case .development:
            return "https://dev-api.ibcm.com"
        case .staging:
            return "https://staging-api.ibcm.com"
        case .production:
            return "https://api.ibcm.com"
        }
    }
    
    var webSocketURL: String {
        switch environment {
        case .development:
            return "wss://dev-ws.ibcm.com"
        case .staging:
            return "wss://staging-ws.ibcm.com"
        case .production:
            return "wss://ws.ibcm.com"
        }
    }
    
    var apiVersion: String {
        return "v1"
    }
    
    var timeoutInterval: TimeInterval {
        switch environment {
        case .development:
            return 60
        case .staging:
            return 45
        case .production:
            return 30
        }
    }
    
    var maxRetryAttempts: Int {
        switch environment {
        case .development:
            return 5
        case .staging:
            return 3
        case .production:
            return 2
        }
    }
    
    var cacheExpirationInterval: TimeInterval {
        switch environment {
        case .development:
            return 600 // 10 minutes
        case .staging:
            return 300 // 5 minutes
        case .production:
            return 300 // 5 minutes
        }
    }
    
    var loggingEnabled: Bool {
        switch environment {
        case .development, .staging:
            return true
        case .production:
            return false
        }
    }
    
    func endpoint(for path: String) -> String {
        return "/\(apiVersion)/\(path)"
    }
    
    func isDebugEnvironment() -> Bool {
        return environment != .production
    }
    
    func getEnvironment() -> Environment {
        return environment
    }
} 