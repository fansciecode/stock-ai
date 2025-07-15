import SwiftUI

struct ForgotPasswordView: View {
    // MARK: - Properties
    var onNavigateBack: () -> Void
    var authViewModel: AuthViewModel
    
    @State private var email = ""
    @State private var isLoading = false
    @State private var showError = false
    @State private var errorMessage = ""
    @State private var showSuccess = false
    
    // MARK: - Body
    var body: some View {
        VStack(spacing: 24) {
            // Header
            Text("Reset Password")
                .font(.largeTitle)
                .fontWeight(.bold)
                .padding(.top, 40)
            
            Text("Enter your email address and we'll send you a link to reset your password.")
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
                .padding(.horizontal, 32)
            
            // Form
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
                .disableAutocorrection(true)
                .padding(.horizontal, 32)
                .padding(.top, 16)
            
            // Reset button
            Button(action: resetPassword) {
                if isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Send Reset Link")
                        .fontWeight(.semibold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
            .padding(.horizontal, 32)
            .disabled(isLoading)
            
            // Back to login
            Button(action: onNavigateBack) {
                Text("Back to Login")
                    .fontWeight(.medium)
                    .foregroundColor(.blue)
            }
            .padding(.top, 8)
            
            Spacer()
        }
        .padding()
        .navigationBarBackButtonHidden(true)
        .navigationBarItems(leading: Button(action: onNavigateBack) {
            Image(systemName: "arrow.left")
                .foregroundColor(.primary)
        })
        .alert("Error", isPresented: $showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(errorMessage)
        }
        .alert("Password Reset", isPresented: $showSuccess) {
            Button("OK", role: .cancel) {
                onNavigateBack()
            }
        } message: {
            Text("A password reset link has been sent to your email address.")
        }
    }
    
    // MARK: - Actions
    
    private func resetPassword() {
        guard !email.isEmpty else {
            showError = true
            errorMessage = "Please enter your email address"
            return
        }
        
        isLoading = true
        
        Task {
            do {
                try await authViewModel.forgotPassword(email: email)
                isLoading = false
                showSuccess = true
            } catch {
                isLoading = false
                showError = true
                errorMessage = error.localizedDescription
            }
        }
    }
}

#Preview {
    ForgotPasswordView(
        onNavigateBack: {},
        authViewModel: AuthViewModel()
    )
} 