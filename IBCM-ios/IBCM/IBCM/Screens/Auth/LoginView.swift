//
//  LoginView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct LoginView: View {
    @StateObject private var viewModel = LoginViewModel()
    @EnvironmentObject private var appState: AppState
    @State private var email = ""
    @State private var password = ""
    @State private var isPasswordVisible = false
    @State private var showError = false
    @State private var errorMessage: String? = nil
    @State private var showingForgotPassword = false
    @State private var showingSignup = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Main content with proper spacing to match Android
                    VStack(spacing: 32) {
                        Spacer()
                            .frame(height: 60)

                        // Welcome Header - matches Android
                        VStack(spacing: 8) {
                            Text("Welcome Back")
                                .font(.largeTitle)
                                .fontWeight(.medium)
                                .foregroundColor(.primary)

                            Text("Sign in to your IBCM account")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        .padding(.bottom, 16)

                        // Form Section
                        VStack(spacing: 16) {
                            // Email TextField - matches Android OutlinedTextField
                            VStack(alignment: .leading, spacing: 4) {
                                TextField("Email", text: $email)
                                    .textFieldStyle(IBCMTextFieldStyle(
                                        isError: showError && !isValidEmail(email)
                                    ))
                                    .textContentType(.emailAddress)
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                                    .submitLabel(.next)
                                    .onSubmit {
                                        // Move focus to password field
                                    }
                            }

                            // Password TextField - matches Android OutlinedTextField
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    if isPasswordVisible {
                                        TextField("Password", text: $password)
                                            .textContentType(.password)
                                            .submitLabel(.done)
                                            .onSubmit {
                                                handleLogin()
                                            }
                                    } else {
                                        SecureField("Password", text: $password)
                                            .textContentType(.password)
                                            .submitLabel(.done)
                                            .onSubmit {
                                                handleLogin()
                                            }
                                    }

                                    Button(action: {
                                        isPasswordVisible.toggle()
                                    }) {
                                        Image(systemName: isPasswordVisible ? "eye.slash" : "eye")
                                            .foregroundColor(.secondary)
                                    }
                                }
                                .textFieldStyle(IBCMTextFieldStyle(
                                    isError: showError && password.isEmpty
                                ))
                            }

                            // Error Message Display
                            if showError, let errorMessage = errorMessage {
                                HStack {
                                    Image(systemName: "exclamationmark.triangle")
                                        .foregroundColor(.red)
                                        .font(.caption)
                                    Text(errorMessage)
                                        .font(.caption)
                                        .foregroundColor(.red)
                                    Spacer()
                                }
                                .padding(.horizontal, 4)
                            }
                        }
                        .padding(.horizontal, 16)

                        // Login Button - matches Android Button style
                        VStack(spacing: 16) {
                            Button(action: handleLogin) {
                                HStack {
                                    if viewModel.isLoading {
                                        ProgressView()
                                            .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                            .scaleEffect(0.8)
                                    } else {
                                        Text("Login")
                                            .fontWeight(.medium)
                                    }
                                }
                                .frame(maxWidth: .infinity)
                                .frame(height: 50) // Match Android height
                                .background(
                                    Color.blue
                                        .opacity(isFormValid && !viewModel.isLoading ? 1.0 : 0.6)
                                )
                                .foregroundColor(.white)
                                .cornerRadius(8)
                            }
                            .disabled(!isFormValid || viewModel.isLoading)
                            .padding(.horizontal, 16)

                            // Forgot Password - matches Android TextButton
                            Button("Forgot Password?") {
                                showingForgotPassword = true
                            }
                            .font(.subheadline)
                            .foregroundColor(.blue)
                            .padding(.top, 8)
                        }

                        Spacer()

                        // Bottom Section - Sign up link
                        VStack(spacing: 16) {
                            // Divider
                            HStack {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(height: 1)
                                Text("or")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                                    .padding(.horizontal, 16)
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(height: 1)
                            }
                            .padding(.horizontal, 16)

                            // Sign up link - matches Android Row layout
                            HStack {
                                Text("Don't have an account?")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)

                                Button("Sign Up") {
                                    showingSignup = true
                                }
                                .font(.subheadline)
                                .fontWeight(.medium)
                                .foregroundColor(.blue)
                            }
                        }
                        .padding(.bottom, 32)
                    }
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .background(Color(.systemBackground))
        }
        .navigationViewStyle(StackNavigationViewStyle())
        .sheet(isPresented: $showingForgotPassword) {
            ForgotPasswordView()
        }
        .sheet(isPresented: $showingSignup) {
            SignupView()
        }
        .onChange(of: viewModel.authState) { authState in
            handleAuthStateChange(authState)
        }
        .onChange(of: viewModel.errorMessage) { error in
            if let error = error {
                errorMessage = error
                showError = true

                // Show toast for verification errors (matching Android behavior)
                if error.contains("verified") || error.contains("verification") {
                    showToast(error)
                }
            }
        }
        .onAppear {
            clearForm()
        }
    }

    // MARK: - Private Methods

    private var isFormValid: Bool {
        return isValidEmail(email) && !password.isEmpty
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "^[A-Za-z0-9._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,}$"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    private func validateInputs() -> Bool {
        showError = false

        if !isValidEmail(email) {
            errorMessage = "Please enter a valid email address"
            showError = true
            return false
        }

        if password.isEmpty {
            errorMessage = "Please enter your password"
            showError = true
            return false
        }

        return true
    }

    private func handleLogin() {
        guard validateInputs() else { return }

        viewModel.login(
            email: email,
            password: password,
            onError: { error in
                errorMessage = error
                showError = true
            },
            onSuccess: { success in
                // Success will be handled in handleAuthStateChange
            }
        )
    }

    private func handleAuthStateChange(_ authState: AuthState) {
        switch authState {
        case .authenticated:
            print("LoginView: User authenticated, navigating to Home screen")
            // For mock purposes, assume the user has categories
            // Don't wait for API calls that may fail - just proceed to the Home screen
            appState.isAuthenticated = true
            appState.currentUser = viewModel.currentUser

        case .unauthenticated:
            // If there's an error and we're unauthenticated, it's already handled
            // in the error message observer
            break

        case .unknown:
            // No action needed for unknown state
            break
        }
    }

    private func clearForm() {
        email = ""
        password = ""
        showError = false
        errorMessage = nil
        isPasswordVisible = false
        viewModel.clearError()
    }

    private func showToast(_ message: String) {
        // iOS doesn't have built-in toast, but we can show an alert
        // or use a third-party library for toast functionality
        DispatchQueue.main.async {
            // For now, we'll handle this in the error message display
            // In a full implementation, you might want to use a toast library
        }
    }
}

// MARK: - Custom Text Field Style (Matches Android OutlinedTextField)
struct IBCMTextFieldStyle: TextFieldStyle {
    let isError: Bool

    init(isError: Bool = false) {
        self.isError = isError
    }

    func _body(configuration: TextField<Self._Label>) -> some View {
        configuration
            .padding(.horizontal, 16)
            .padding(.vertical, 16)
            .background(Color(.systemBackground))
            .cornerRadius(8)
            .overlay(
                RoundedRectangle(cornerRadius: 8)
                    .stroke(
                        isError ? Color.red : Color.gray.opacity(0.5),
                        lineWidth: isError ? 2 : 1
                    )
            )
    }
}

// MARK: - Auth State Enum (Matches Android)
enum AuthState {
    case unknown
    case authenticated
    case unauthenticated
}

// MARK: - Login ViewModel (Matches Android AuthViewModel)
@MainActor
class LoginViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var authState: AuthState = .unknown
    @Published var currentUser: User?

    private let authService = AuthService.shared
    private var cancellables = Set<AnyCancellable>()

    init() {
        // Observe auth service state changes
        authService.$isAuthenticated
            .sink { [weak self] isAuthenticated in
                self?.authState = isAuthenticated ? .authenticated : .unauthenticated
            }
            .store(in: &cancellables)

        authService.$currentUser
            .sink { [weak self] user in
                self?.currentUser = user
            }
            .store(in: &cancellables)

        authService.$isLoading
            .sink { [weak self] loading in
                self?.isLoading = loading
            }
            .store(in: &cancellables)

        authService.$errorMessage
            .sink { [weak self] error in
                self?.errorMessage = error
            }
            .store(in: &cancellables)
    }

    func login(email: String, password: String, onError: @escaping (String) -> Void, onSuccess: @escaping (Bool) -> Void) {
        authService.login(email: email, password: password)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        onError(error.localizedDescription)
                    }
                },
                receiveValue: { response in
                    if response.success {
                        onSuccess(true)
                    } else {
                        onError(response.message ?? "Login failed")
                    }
                }
            )
            .store(in: &cancellables)
    }

    func clearError() {
        errorMessage = nil
        authService.errorMessage = nil
    }
}

// MARK: - Preview
#Preview {
    LoginView()
        .environmentObject(AppState())
}
