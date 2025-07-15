import Foundation
import Combine

class AuthViewModel: ObservableObject {
    // Published properties to match Android AuthViewModel
    @Published var authState: AuthState = .notAuthenticated
    @Published var isLoading: Bool = false
    @Published var errorMessage: String?
    @Published var user: User?
    @Published var hasSelectedCategories: Bool = false
    
    // Services
    private let authService: AuthService
    private let userService: UserService
    
    // Cancellables
    private var cancellables = Set<AnyCancellable>()
    
    init() {
        self.authService = AuthService()
        self.userService = UserService()
        
        checkAuthState()
    }
    
    // MARK: - Public Methods
    
    func login(email: String, password: String, completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil
        
        authService.login(email: email, password: password)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                switch result {
                case .finished:
                    break
                case .failure(let error):
                    self?.errorMessage = "Login failed: \(error.localizedDescription)"
                    completion(false)
                }
            } receiveValue: { [weak self] authResponse in
                self?.authState = .authenticated
                self?.user = authResponse.user
                self?.hasSelectedCategories = authResponse.hasSelectedCategories
                completion(authResponse.hasSelectedCategories)
            }
            .store(in: &cancellables)
    }
    
    func signup(email: String, password: String, name: String, completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil
        
        authService.signup(email: email, password: password, name: name)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                switch result {
                case .finished:
                    break
                case .failure(let error):
                    self?.errorMessage = "Signup failed: \(error.localizedDescription)"
                    completion(false)
                }
            } receiveValue: { [weak self] authResponse in
                self?.authState = .authenticated
                self?.user = authResponse.user
                self?.hasSelectedCategories = false
                completion(false)
            }
            .store(in: &cancellables)
    }
    
    func forgotPassword(email: String, completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil
        
        authService.forgotPassword(email: email)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                switch result {
                case .finished:
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = "Password reset failed: \(error.localizedDescription)"
                    completion(false)
                }
            } receiveValue: { _ in
                // Nothing to do here
            }
            .store(in: &cancellables)
    }
    
    func logout() {
        isLoading = true
        
        authService.logout()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                switch result {
                case .finished:
                    self?.authState = .notAuthenticated
                    self?.user = nil
                case .failure(let error):
                    self?.errorMessage = "Logout failed: \(error.localizedDescription)"
                }
            } receiveValue: { _ in
                // Nothing to do here
            }
            .store(in: &cancellables)
    }
    
    func saveUserCategories(categoryIds: [String], completion: @escaping (Bool) -> Void) {
        isLoading = true
        errorMessage = nil
        
        userService.saveUserCategories(categoryIds: categoryIds)
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                switch result {
                case .finished:
                    self?.hasSelectedCategories = true
                    completion(true)
                case .failure(let error):
                    self?.errorMessage = "Failed to save categories: \(error.localizedDescription)"
                    completion(false)
                }
            } receiveValue: { _ in
                // Nothing to do here
            }
            .store(in: &cancellables)
    }
    
    // MARK: - Private Methods
    
    private func checkAuthState() {
        isLoading = true
        
        authService.checkAuthState()
            .receive(on: DispatchQueue.main)
            .sink { [weak self] result in
                self?.isLoading = false
                
                if case .failure(let error) = result {
                    self?.errorMessage = "Auth check failed: \(error.localizedDescription)"
                    self?.authState = .notAuthenticated
                }
            } receiveValue: { [weak self] authResponse in
                if authResponse.isAuthenticated {
                    self?.authState = .authenticated
                    self?.user = authResponse.user
                    self?.hasSelectedCategories = authResponse.hasSelectedCategories
                } else {
                    self?.authState = .notAuthenticated
                }
            }
            .store(in: &cancellables)
    }
}

// MARK: - Models

struct User: Identifiable, Codable {
    let id: String
    let email: String
    let name: String
    let profileImageUrl: String?
    let isVerified: Bool
}

struct AuthResponse {
    let isAuthenticated: Bool
    let user: User?
    let hasSelectedCategories: Bool
} 