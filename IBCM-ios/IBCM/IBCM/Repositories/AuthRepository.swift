import Foundation

protocol AuthRepository {
    func login(email: String, password: String) async throws -> User
    func register(email: String, password: String, name: String) async throws -> User
    func resetPassword(email: String) async throws -> Bool
    func logout() async throws
    func refreshToken() async throws -> String
    func getCurrentUser() async throws -> User?
}

class AuthRepositoryImpl: AuthRepository {
    private let apiService: APIService
    private let userDefaults: UserDefaults
    private let tokenKey = "auth_token"
    private let refreshTokenKey = "refresh_token"
    
    init(apiService: APIService = .shared, userDefaults: UserDefaults = .standard) {
        self.apiService = apiService
        self.userDefaults = userDefaults
    }
    
    func login(email: String, password: String) async throws -> User {
        let response: AuthResponse = try await apiService.request(
            endpoint: "/auth/login",
            method: "POST",
            body: try JSONEncoder().encode([
                "email": email,
                "password": password
            ])
        )
        
        if response.success {
            userDefaults.set(response.token, forKey: tokenKey)
            userDefaults.set(response.refreshToken, forKey: refreshTokenKey)
            return response.user
        } else {
            throw AuthError.invalidCredentials
        }
    }
    
    func register(email: String, password: String, name: String) async throws -> User {
        let response: AuthResponse = try await apiService.request(
            endpoint: "/auth/register",
            method: "POST",
            body: try JSONEncoder().encode([
                "email": email,
                "password": password,
                "name": name
            ])
        )
        
        if response.success {
            userDefaults.set(response.token, forKey: tokenKey)
            userDefaults.set(response.refreshToken, forKey: refreshTokenKey)
            return response.user
        } else {
            throw AuthError.registrationFailed
        }
    }
    
    func resetPassword(email: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/auth/reset-password",
            method: "POST",
            body: try JSONEncoder().encode(["email": email])
        )
        return response.success
    }
    
    func logout() async throws {
        _ = try await apiService.request(
            endpoint: "/auth/logout",
            method: "POST"
        )
        
        userDefaults.removeObject(forKey: tokenKey)
        userDefaults.removeObject(forKey: refreshTokenKey)
    }
    
    func refreshToken() async throws -> String {
        guard let refreshToken = userDefaults.string(forKey: refreshTokenKey) else {
            throw AuthError.noRefreshToken
        }
        
        let response: AuthResponse = try await apiService.request(
            endpoint: "/auth/refresh",
            method: "POST",
            body: try JSONEncoder().encode(["refresh_token": refreshToken])
        )
        
        if response.success {
            userDefaults.set(response.token, forKey: tokenKey)
            userDefaults.set(response.refreshToken, forKey: refreshTokenKey)
            return response.token
        } else {
            throw AuthError.refreshFailed
        }
    }
    
    func getCurrentUser() async throws -> User? {
        guard userDefaults.string(forKey: tokenKey) != nil else {
            return nil
        }
        
        let response: UserResponse = try await apiService.request(
            endpoint: "/auth/me",
            method: "GET"
        )
        
        return response.data
    }
}

// MARK: - Response Types
struct AuthResponse: Codable {
    let success: Bool
    let token: String
    let refreshToken: String
    let user: User
    let message: String?
}

// MARK: - Errors
enum AuthError: LocalizedError {
    case invalidCredentials
    case registrationFailed
    case noRefreshToken
    case refreshFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidCredentials:
            return "Invalid email or password"
        case .registrationFailed:
            return "Failed to register user"
        case .noRefreshToken:
            return "No refresh token available"
        case .refreshFailed:
            return "Failed to refresh authentication token"
        }
    }
} 