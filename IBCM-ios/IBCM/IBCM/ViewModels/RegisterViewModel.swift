import Foundation
import Combine

@MainActor
class RegisterViewModel: ObservableObject {
    @Published var name = ""
    @Published var email = ""
    @Published var phoneNumber = ""
    @Published var city = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var isRegistered = false

    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared

    var isFormValid: Bool {
        !name.isEmpty &&
        !email.isEmpty &&
        !password.isEmpty &&
        !confirmPassword.isEmpty &&
        isValidEmail(email) &&
        password.count >= 6 &&
        password == confirmPassword
    }

    var passwordStrength: PasswordStrength {
        return calculatePasswordStrength(password)
    }

    var passwordsMatch: Bool {
        return password == confirmPassword
    }

    init() {
        // Clear error message when user starts typing
        Publishers.CombineLatest4($name, $email, $password, $confirmPassword)
            .sink { [weak self] _, _, _, _ in
                self?.errorMessage = ""
            }
            .store(in: &cancellables)
    }

    func register() async {
        guard isFormValid else {
            errorMessage = "Please fill in all fields correctly"
            return
        }

        guard passwordsMatch else {
            errorMessage = "Passwords do not match"
            return
        }

        isLoading = true
        errorMessage = ""

        do {
            let location = Location(city: city.trimmingCharacters(in: .whitespacesAndNewlines))

            let registerRequest = RegisterRequest(
                name: name.trimmingCharacters(in: .whitespacesAndNewlines),
                email: email.trimmingCharacters(in: .whitespacesAndNewlines),
                password: password,
                phoneNumber: phoneNumber.isEmpty ? nil : phoneNumber.trimmingCharacters(in: .whitespacesAndNewlines),
                location: location.city.isEmpty ? nil : location
            )

            let response = try await networkService.register(request: registerRequest).async()

            if response.success {
                // Store auth tokens
                networkService.setAuthTokens(
                    token: response.data.token,
                    refreshToken: response.data.refreshToken
                )

                isRegistered = true
                clearForm()
            } else {
                errorMessage = response.message ?? "Registration failed"
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func clearForm() {
        name = ""
        email = ""
        phoneNumber = ""
        city = ""
        password = ""
        confirmPassword = ""
        errorMessage = ""
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    private func calculatePasswordStrength(_ password: String) -> PasswordStrength {
        var score = 0

        // Length check
        if password.count >= 8 {
            score += 1
        }

        // Contains uppercase
        if password.range(of: "[A-Z]", options: .regularExpression) != nil {
            score += 1
        }

        // Contains lowercase
        if password.range(of: "[a-z]", options: .regularExpression) != nil {
            score += 1
        }

        // Contains number
        if password.range(of: "[0-9]", options: .regularExpression) != nil {
            score += 1
        }

        // Contains special character
        if password.range(of: "[^A-Za-z0-9]", options: .regularExpression) != nil {
            score += 1
        }

        switch score {
        case 0...1:
            return .weak
        case 2...3:
            return .fair
        case 4:
            return .good
        case 5:
            return .strong
        default:
            return .weak
        }
    }

    private func handleError(_ error: Error) {
        if let networkError = error as? NetworkError {
            switch networkError {
            case .serverError(let code):
                if code == 409 {
                    errorMessage = "Email already exists. Please use a different email."
                } else {
                    errorMessage = "Server error (\(code)). Please try again later."
                }
            case .networkError:
                errorMessage = "Network connection error. Please check your internet connection."
            default:
                errorMessage = networkError.localizedDescription
            }
        } else {
            errorMessage = "An unexpected error occurred. Please try again."
        }
    }
}

// Validation helpers
extension RegisterViewModel {
    var nameValidation: ValidationResult {
        if name.isEmpty {
            return .empty
        } else if name.count < 2 {
            return .invalid("Name must be at least 2 characters")
        } else {
            return .valid
        }
    }

    var emailValidation: ValidationResult {
        if email.isEmpty {
            return .empty
        } else if !isValidEmail(email) {
            return .invalid("Please enter a valid email address")
        } else {
            return .valid
        }
    }

    var phoneValidation: ValidationResult {
        if phoneNumber.isEmpty {
            return .empty
        } else if phoneNumber.count < 10 {
            return .invalid("Phone number must be at least 10 digits")
        } else {
            return .valid
        }
    }

    var passwordValidation: ValidationResult {
        if password.isEmpty {
            return .empty
        } else if password.count < 6 {
            return .invalid("Password must be at least 6 characters")
        } else {
            return .valid
        }
    }

    var confirmPasswordValidation: ValidationResult {
        if confirmPassword.isEmpty {
            return .empty
        } else if password != confirmPassword {
            return .invalid("Passwords do not match")
        } else {
            return .valid
        }
    }
}

enum ValidationResult {
    case empty
    case valid
    case invalid(String)

    var isValid: Bool {
        switch self {
        case .valid:
            return true
        default:
            return false
        }
    }

    var errorMessage: String? {
        switch self {
        case .invalid(let message):
            return message
        default:
            return nil
        }
    }
}
