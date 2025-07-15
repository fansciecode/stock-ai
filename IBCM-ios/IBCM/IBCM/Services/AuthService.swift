import Foundation
import Combine

enum AuthState {
    case unknown
    case authenticated
    case notAuthenticated
}

struct AuthResponse {
    let isAuthenticated: Bool
    let user: User?
    let hasSelectedCategories: Bool
    let token: String?
}

class AuthService {
    static let shared = AuthService()
    
    // API endpoints
    private let loginEndpoint = "auth/login"
    private let signupEndpoint = "auth/register"
    private let forgotPasswordEndpoint = "auth/forgot-password"
    private let resetPasswordEndpoint = "auth/reset-password"
    private let verifyResetTokenEndpoint = "auth/validate-reset-token"
    private let logoutEndpoint = "auth/logout"
    private let checkAuthEndpoint = "auth/check"
    
    // API service for network calls
    private let apiService = APIService.shared
    
    // Publisher for auth state changes
    private let authStateSubject = CurrentValueSubject<AuthState, Never>(.unknown)
    var authStatePublisher: AnyPublisher<AuthState, Never> {
        authStateSubject.eraseToAnyPublisher()
    }
    
    // MARK: - Auth Methods
    
    func login(email: String, password: String) async throws -> AuthResponse {
        let loginRequest = LoginRequest(email: email, password: password)
        let data = try JSONEncoder().encode(loginRequest)
        
        let response: AuthData = try await apiService.request(
            endpoint: loginEndpoint,
            method: "POST",
            body: data
        )
        
        // Save token
        apiService.setAuthToken(response.token)
        
        // Update auth state
        authStateSubject.send(.authenticated)
        
        return AuthResponse(
            isAuthenticated: true,
            user: response.user,
            hasSelectedCategories: response.user.interests.count > 0,
            token: response.token
        )
    }
    
    func signup(name: String, email: String, password: String) async throws -> AuthResponse {
        let names = name.split(separator: " ")
        let firstName = String(names.first ?? "")
        let lastName = names.count > 1 ? names.dropFirst().joined(separator: " ") : ""
        
        let registerRequest = RegisterRequest(
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            phoneNumber: nil,
            dateOfBirth: nil,
            gender: nil,
            location: nil,
            interests: nil,
            marketingConsent: false,
            termsAccepted: true
        )
        
        let data = try JSONEncoder().encode(registerRequest)
        
        let response: AuthData = try await apiService.request(
            endpoint: signupEndpoint,
            method: "POST",
            body: data
        )
        
        // Save token
        apiService.setAuthToken(response.token)
        
        // Update auth state
        authStateSubject.send(.authenticated)
        
        return AuthResponse(
                        isAuthenticated: true,
            user: response.user,
            hasSelectedCategories: response.user.interests.count > 0,
            token: response.token
        )
    }
    
    func forgotPassword(email: String) async throws -> Bool {
        let forgotPasswordRequest = ForgotPasswordRequest(email: email)
        let data = try JSONEncoder().encode(forgotPasswordRequest)
        
        let response: ApiResponse<Bool> = try await apiService.request(
            endpoint: forgotPasswordEndpoint,
            method: "POST",
            body: data
        )
        
        return response.data ?? false
    }
    
    func resetPassword(token: String, newPassword: String) async throws -> Bool {
        let resetPasswordRequest = ResetPasswordRequest(
            token: token,
            newPassword: newPassword,
            confirmPassword: newPassword
        )
        
        let data = try JSONEncoder().encode(resetPasswordRequest)
        
        let response: ApiResponse<Bool> = try await apiService.request(
            endpoint: "\(resetPasswordEndpoint)/\(token)",
            method: "POST",
            body: data
        )
        
        return response.data ?? false
    }
    
    func verifyResetToken(token: String) async throws -> Bool {
        let response: ApiResponse<Bool> = try await apiService.request(
            endpoint: "\(verifyResetTokenEndpoint)/\(token)",
            method: "GET"
        )
        
        return response.data ?? false
    }
    
    func logout() async throws {
        let _: ApiResponse<Bool> = try await apiService.request(
            endpoint: logoutEndpoint,
            method: "POST"
        )
        
        // Clear token
        apiService.setAuthToken(nil)
        
        // Update auth state
        authStateSubject.send(.notAuthenticated)
    }
    
    func checkAuthState() async throws -> AuthResponse {
        do {
            let response: AuthData = try await apiService.request(
                endpoint: checkAuthEndpoint,
                method: "GET"
            )
            
            // Save token if present
            if let token = response.token {
                apiService.setAuthToken(token)
            }
            
            // Update auth state
            authStateSubject.send(.authenticated)
            
            return AuthResponse(
                        isAuthenticated: true,
                user: response.user,
                hasSelectedCategories: response.user.interests.count > 0,
                token: response.token
            )
        } catch {
            // Clear token
            apiService.setAuthToken(nil)
            
            // Update auth state
            authStateSubject.send(.notAuthenticated)
            
            return AuthResponse(
                        isAuthenticated: false,
                        user: nil,
                hasSelectedCategories: false,
                token: nil
            )
        }
    }
}

// MARK: - API Response Models
struct ApiResponse<T: Codable>: Codable {
    let success: Bool
    let data: T?
    let message: String?
    let errors: [String]?
}
