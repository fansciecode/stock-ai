import Foundation
import Combine
import KeychainSwift

// MARK: - AuthService
class AuthService: ObservableObject {
    static let shared = AuthService()

    // MARK: - Published Properties
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var authToken: String?
    @Published var refreshToken: String?
    @Published var isLoading = false
    @Published var errorMessage: String?

    // MARK: - Private Properties
    private let apiClient = APIClient.shared
    private let keychain = KeychainSwift()
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Constants
    private enum KeychainKeys {
        static let authToken = "auth_token"
        static let refreshToken = "refresh_token"
        static let userId = "user_id"
    }

    // MARK: - Initialization
    private init() {
        loadStoredCredentials()
    }

    // MARK: - Public Methods

    /// Check if user is authenticated and load stored credentials
    func loadStoredCredentials() {
        guard let token = keychain.get(KeychainKeys.authToken),
              let refreshToken = keychain.get(KeychainKeys.refreshToken) else {
            isAuthenticated = false
            return
        }

        self.authToken = token
        self.refreshToken = refreshToken

        // Verify token validity
        verifyToken()
    }

    /// Login user with email and password
    func login(email: String, password: String, deviceToken: String? = nil) -> AnyPublisher<AuthResponse, APIError> {
        isLoading = true
        errorMessage = nil

        let request = LoginRequest(
            email: email,
            password: password,
            deviceToken: deviceToken
        )

        return apiClient.request(
            endpoint: AuthEndpoint.login,
            method: .POST,
            body: request
        )
        .map(AuthResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success, let authData = response.data {
                    self?.handleSuccessfulAuth(authData)
                } else {
                    self?.errorMessage = response.message ?? "Login failed"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Register new user
    func register(
        firstName: String,
        lastName: String,
        email: String,
        password: String,
        phoneNumber: String? = nil,
        dateOfBirth: String? = nil,
        gender: String? = nil,
        location: Location? = nil,
        interests: [String]? = nil,
        marketingConsent: Bool = false,
        termsAccepted: Bool = true,
        deviceToken: String? = nil
    ) -> AnyPublisher<AuthResponse, APIError> {
        isLoading = true
        errorMessage = nil

        let request = RegisterRequest(
            firstName: firstName,
            lastName: lastName,
            email: email,
            password: password,
            phoneNumber: phoneNumber,
            dateOfBirth: dateOfBirth,
            gender: gender,
            location: location,
            interests: interests,
            marketingConsent: marketingConsent,
            termsAccepted: termsAccepted,
            deviceToken: deviceToken
        )

        return apiClient.request(
            endpoint: AuthEndpoint.register,
            method: .POST,
            body: request
        )
        .map(AuthResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success, let authData = response.data {
                    self?.handleSuccessfulAuth(authData)
                } else {
                    self?.errorMessage = response.message ?? "Registration failed"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Send forgot password email
    func forgotPassword(email: String) -> AnyPublisher<BaseResponse, APIError> {
        isLoading = true
        errorMessage = nil

        let request = ForgotPasswordRequest(email: email)

        return apiClient.request(
            endpoint: AuthEndpoint.forgotPassword,
            method: .POST,
            body: request
        )
        .map(BaseResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if !response.success {
                    self?.errorMessage = response.message ?? "Failed to send reset email"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Reset password with token
    func resetPassword(token: String, newPassword: String, confirmPassword: String) -> AnyPublisher<BaseResponse, APIError> {
        isLoading = true
        errorMessage = nil

        let request = ResetPasswordRequest(
            token: token,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        )

        return apiClient.request(
            endpoint: AuthEndpoint.resetPassword,
            method: .POST,
            body: request
        )
        .map(BaseResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if !response.success {
                    self?.errorMessage = response.message ?? "Failed to reset password"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Change user password
    func changePassword(currentPassword: String, newPassword: String, confirmPassword: String) -> AnyPublisher<BaseResponse, APIError> {
        isLoading = true
        errorMessage = nil

        let request = ChangePasswordRequest(
            currentPassword: currentPassword,
            newPassword: newPassword,
            confirmPassword: confirmPassword
        )

        return apiClient.request(
            endpoint: AuthEndpoint.changePassword,
            method: .POST,
            body: request
        )
        .map(BaseResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if !response.success {
                    self?.errorMessage = response.message ?? "Failed to change password"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Verify current token
    func verifyToken() {
        guard let token = authToken else {
            logout()
            return
        }

        apiClient.request(
            endpoint: AuthEndpoint.verifyToken,
            method: .GET,
            headers: ["Authorization": "Bearer \(token)"]
        )
        .map(UserResponse.self)
        .sink(
            receiveCompletion: { [weak self] completion in
                if case .failure = completion {
                    self?.logout()
                }
            },
            receiveValue: { [weak self] response in
                if response.success, let user = response.data {
                    self?.currentUser = user
                    self?.isAuthenticated = true
                } else {
                    self?.logout()
                }
            }
        )
        .store(in: &cancellables)
    }

    /// Refresh authentication token
    func refreshAuthToken() -> AnyPublisher<TokenRefreshResponse, APIError> {
        guard let refreshToken = refreshToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }

        let request = TokenRefreshRequest(refreshToken: refreshToken)

        return apiClient.request(
            endpoint: AuthEndpoint.refreshToken,
            method: .POST,
            body: request
        )
        .map(TokenRefreshResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success, let tokenData = response.data {
                    self?.authToken = tokenData.token
                    self?.refreshToken = tokenData.refreshToken
                    self?.storeTokens(
                        authToken: tokenData.token,
                        refreshToken: tokenData.refreshToken
                    )
                } else {
                    self?.logout()
                }
            },
            receiveCompletion: { [weak self] completion in
                if case .failure = completion {
                    self?.logout()
                }
            }
        )
        .eraseToAnyPublisher()
    }

    /// Update user profile
    func updateProfile(_ request: UserUpdateRequest) -> AnyPublisher<UserResponse, APIError> {
        isLoading = true
        errorMessage = nil

        guard let token = authToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }

        return apiClient.request(
            endpoint: AuthEndpoint.updateProfile,
            method: .PUT,
            headers: ["Authorization": "Bearer \(token)"],
            body: request
        )
        .map(UserResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success, let user = response.data {
                    self?.currentUser = user
                } else {
                    self?.errorMessage = response.message ?? "Failed to update profile"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Upload profile image
    func uploadProfileImage(imageData: Data, imageType: String) -> AnyPublisher<UserResponse, APIError> {
        isLoading = true
        errorMessage = nil

        guard let token = authToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }

        let base64Image = imageData.base64EncodedString()
        let request = ProfileImageUpdateRequest(
            imageData: base64Image,
            imageType: imageType
        )

        return apiClient.request(
            endpoint: AuthEndpoint.uploadProfileImage,
            method: .POST,
            headers: ["Authorization": "Bearer \(token)"],
            body: request
        )
        .map(UserResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success, let user = response.data {
                    self?.currentUser = user
                } else {
                    self?.errorMessage = response.message ?? "Failed to upload image"
                }
                self?.isLoading = false
            },
            receiveCompletion: { [weak self] completion in
                if case .failure(let error) = completion {
                    self?.errorMessage = error.localizedDescription
                }
                self?.isLoading = false
            }
        )
        .eraseToAnyPublisher()
    }

    /// Logout user
    func logout() {
        // Call logout endpoint if we have a token
        if let token = authToken {
            apiClient.request(
                endpoint: AuthEndpoint.logout,
                method: .POST,
                headers: ["Authorization": "Bearer \(token)"]
            )
            .map(BaseResponse.self)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)
        }

        // Clear local data
        clearStoredCredentials()
        isAuthenticated = false
        currentUser = nil
        authToken = nil
        refreshToken = nil
        errorMessage = nil
    }

    /// Delete user account
    func deleteAccount() -> AnyPublisher<BaseResponse, APIError> {
        guard let token = authToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }

        return apiClient.request(
            endpoint: AuthEndpoint.deleteAccount,
            method: .DELETE,
            headers: ["Authorization": "Bearer \(token)"]
        )
        .map(BaseResponse.self)
        .handleEvents(
            receiveOutput: { [weak self] response in
                if response.success {
                    self?.logout()
                }
            }
        )
        .eraseToAnyPublisher()
    }

    // MARK: - Private Methods

    private func handleSuccessfulAuth(_ authData: AuthData) {
        currentUser = authData.user
        authToken = authData.token
        refreshToken = authData.refreshToken
        isAuthenticated = true

        storeTokens(authToken: authData.token, refreshToken: authData.refreshToken)

        // Store user ID for additional reference
        keychain.set(authData.user.id, forKey: KeychainKeys.userId)
    }

    private func storeTokens(authToken: String, refreshToken: String) {
        keychain.set(authToken, forKey: KeychainKeys.authToken)
        keychain.set(refreshToken, forKey: KeychainKeys.refreshToken)
    }

    private func clearStoredCredentials() {
        keychain.delete(KeychainKeys.authToken)
        keychain.delete(KeychainKeys.refreshToken)
        keychain.delete(KeychainKeys.userId)
    }
}

// MARK: - Auth Endpoints
enum AuthEndpoint: String, CaseIterable {
    case login = "/auth/login"
    case register = "/auth/register"
    case forgotPassword = "/auth/forgot-password"
    case resetPassword = "/auth/reset-password"
    case changePassword = "/auth/change-password"
    case verifyToken = "/auth/verify"
    case refreshToken = "/auth/refresh-token"
    case logout = "/auth/logout"
    case updateProfile = "/auth/profile"
    case uploadProfileImage = "/auth/upload-profile-image"
    case deleteAccount = "/auth/delete-account"
}

// MARK: - Base Response
struct BaseResponse: Codable {
    let success: Bool
    let message: String?
    let errors: [String]?
}

// MARK: - API Error
enum APIError: Error, LocalizedError {
    case invalidURL
    case noData
    case decodingError
    case networkError(Error)
    case serverError(Int, String?)
    case unauthorized
    case forbidden
    case notFound
    case badRequest(String?)
    case unknown

    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .noData:
            return "No data received"
        case .decodingError:
            return "Failed to decode response"
        case .networkError(let error):
            return "Network error: \(error.localizedDescription)"
        case .serverError(let code, let message):
            return "Server error (\(code)): \(message ?? "Unknown error")"
        case .unauthorized:
            return "Unauthorized access"
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .badRequest(let message):
            return "Bad request: \(message ?? "Invalid request")"
        case .unknown:
            return "Unknown error occurred"
        }
    }
}

// MARK: - HTTP Method
enum HTTPMethod: String {
    case GET = "GET"
    case POST = "POST"
    case PUT = "PUT"
    case DELETE = "DELETE"
    case PATCH = "PATCH"
}
