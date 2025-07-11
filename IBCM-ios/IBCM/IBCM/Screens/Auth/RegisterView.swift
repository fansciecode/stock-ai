import SwiftUI

struct RegisterView: View {
    @StateObject private var viewModel = RegisterViewModel()
    @Environment(\.dismiss) private var dismiss
    @State private var showingLogin = false
    @State private var agreedToTerms = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 24) {
                    // Header
                    VStack(spacing: 16) {
                        Image(systemName: "person.crop.circle.fill.badge.plus")
                            .font(.system(size: 64))
                            .foregroundColor(.blue)

                        Text("Create Account")
                            .font(.largeTitle)
                            .fontWeight(.bold)

                        Text("Join our community and discover amazing events")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .multilineTextAlignment(.center)
                    }
                    .padding(.top, 20)

                    // Registration form
                    VStack(spacing: 20) {
                        // Name field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Full Name")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            TextField("Enter your full name", text: $viewModel.name)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.name)
                                .autocapitalization(.words)
                        }

                        // Email field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Email")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            TextField("Enter your email", text: $viewModel.email)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.emailAddress)
                                .keyboardType(.emailAddress)
                                .autocapitalization(.none)
                                .disableAutocorrection(true)
                        }

                        // Phone field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Phone Number")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            TextField("Enter your phone number", text: $viewModel.phoneNumber)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.telephoneNumber)
                                .keyboardType(.phonePad)
                        }

                        // Location field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("City")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            TextField("Enter your city", text: $viewModel.city)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.addressCity)
                        }

                        // Password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Password")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            SecureField("Enter your password", text: $viewModel.password)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.newPassword)
                        }

                        // Confirm password field
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Confirm Password")
                                .font(.subheadline)
                                .fontWeight(.medium)

                            SecureField("Confirm your password", text: $viewModel.confirmPassword)
                                .textFieldStyle(CustomTextFieldStyle())
                                .textContentType(.newPassword)
                        }

                        // Password strength indicator
                        if !viewModel.password.isEmpty {
                            VStack(alignment: .leading, spacing: 4) {
                                HStack {
                                    Text("Password Strength:")
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    Text(viewModel.passwordStrength.rawValue)
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .foregroundColor(viewModel.passwordStrength.color)
                                }

                                ProgressView(value: viewModel.passwordStrength.value, total: 1.0)
                                    .tint(viewModel.passwordStrength.color)
                            }
                        }

                        // Error message
                        if !viewModel.errorMessage.isEmpty {
                            HStack {
                                Image(systemName: "exclamationmark.triangle")
                                    .foregroundColor(.red)
                                Text(viewModel.errorMessage)
                                    .foregroundColor(.red)
                                    .font(.caption)
                                Spacer()
                            }
                            .padding(.horizontal, 4)
                        }

                        // Terms and conditions
                        HStack(alignment: .top, spacing: 8) {
                            Button(action: {
                                agreedToTerms.toggle()
                            }) {
                                Image(systemName: agreedToTerms ? "checkmark.square.fill" : "square")
                                    .font(.title2)
                                    .foregroundColor(agreedToTerms ? .blue : .gray)
                            }

                            VStack(alignment: .leading, spacing: 4) {
                                Text("I agree to the Terms of Service and Privacy Policy")
                                    .font(.caption)
                                    .foregroundColor(.secondary)

                                HStack {
                                    Button("Terms of Service") {
                                        // Handle terms of service
                                    }
                                    .font(.caption)
                                    .foregroundColor(.blue)

                                    Text("and")
                                        .font(.caption)
                                        .foregroundColor(.secondary)

                                    Button("Privacy Policy") {
                                        // Handle privacy policy
                                    }
                                    .font(.caption)
                                    .foregroundColor(.blue)
                                }
                            }

                            Spacer()
                        }

                        // Register button
                        Button(action: {
                            Task {
                                await viewModel.register()
                            }
                        }) {
                            HStack {
                                if viewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text("Create Account")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                Color.blue
                                    .opacity(viewModel.isFormValid && agreedToTerms ? 1.0 : 0.6)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!viewModel.isFormValid || !agreedToTerms || viewModel.isLoading)

                        // Login link
                        HStack {
                            Text("Already have an account?")
                                .foregroundColor(.secondary)
                            Button("Sign In") {
                                showingLogin = true
                            }
                            .fontWeight(.medium)
                            .foregroundColor(.blue)
                        }
                        .font(.subheadline)
                        .padding(.top, 20)
                    }
                    .padding(.horizontal, 24)

                    Spacer()
                }
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .background(Color(.systemGroupedBackground))
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .sheet(isPresented: $showingLogin) {
            LoginView()
        }
        .onChange(of: viewModel.isRegistered) { isRegistered in
            if isRegistered {
                dismiss()
            }
        }
        .onAppear {
            viewModel.clearForm()
        }
    }
}

// Password strength enum
enum PasswordStrength: String, CaseIterable {
    case weak = "Weak"
    case fair = "Fair"
    case good = "Good"
    case strong = "Strong"

    var color: Color {
        switch self {
        case .weak:
            return .red
        case .fair:
            return .orange
        case .good:
            return .yellow
        case .strong:
            return .green
        }
    }

    var value: Double {
        switch self {
        case .weak:
            return 0.25
        case .fair:
            return 0.5
        case .good:
            return 0.75
        case .strong:
            return 1.0
        }
    }
}

#Preview {
    RegisterView()
}
