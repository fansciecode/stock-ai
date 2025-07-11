import Foundation
import Combine

@MainActor
class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var isLoggedIn = false
    @Published var currentUser: User?

    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared

    var isFormValid: Bool {
        !email.isEmpty &&
        !password.isEmpty &&
        isValidEmail(email) &&
        password.count >= 6
    }

    init() {
        // Clear any previous error when user starts typing
        Publishers.CombineLatest($email, $password)
            .sink { [weak self] _, _ in
                self?.errorMessage = ""
            }
            .store(in: &cancellables)
    }

    func login() async {
        guard isFormValid else {
            errorMessage = "Please fill in all fields correctly"
            return
        }

        isLoading = true
        errorMessage = ""

        do {
            let response = try await networkService.login(
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password
            ).async()

            if response.success {
                // Store auth tokens
                networkService.setAuthTokens(
                    token: response.data.token,
                    refreshToken: response.data.refreshToken
                )

                // Update state
                currentUser = response.data.user
                isLoggedIn = true

                // Clear form
                clearForm()
            } else {
                errorMessage = response.message ?? "Login failed"
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func clearForm() {
        email = ""
        password = ""
        errorMessage = ""
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    private func handleError(_ error: Error) {
        if let networkError = error as? NetworkError {
            switch networkError {
            case .unauthorized:
                errorMessage = "Invalid email or password"
            case .networkError:
                errorMessage = "Network connection error. Please check your internet connection."
            case .serverError(let code):
                errorMessage = "Server error (\(code)). Please try again later."
            default:
                errorMessage = networkError.localizedDescription
            }
        } else {
            errorMessage = "An unexpected error occurred. Please try again."
        }
    }
}

// Extension to convert Publisher to async/await
extension Publisher {
    func async() async throws -> Output {
        try await withCheckedThrowingContinuation { continuation in
            var cancellable: AnyCancellable?
            cancellable = first()
                .sink(
                    receiveCompletion: { completion in
                        switch completion {
                        case .finished:
                            break
                        case .failure(let error):
                            continuation.resume(throwing: error)
                        }
                        cancellable?.cancel()
                    },
                    receiveValue: { value in
                        continuation.resume(returning: value)
                        cancellable?.cancel()
                    }
                )
        }
    }
}
