import Foundation
import FirebaseAuth

@MainActor
class SignupViewModel: ObservableObject {
    @Published var fullName = ""
    @Published var username = ""
    @Published var email = ""
    @Published var phoneNumber = ""
    @Published var password = ""
    @Published var confirmPassword = ""
    @Published var errorMessage = ""
    @Published var isLoading = false
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    private func validate() -> Bool {
        guard !fullName.isEmpty,
              !username.isEmpty,
              !email.isEmpty,
              !phoneNumber.isEmpty,
              !password.isEmpty,
              !confirmPassword.isEmpty else {
            errorMessage = "Please fill in all fields"
            return false
        }
        
        guard password == confirmPassword else {
            errorMessage = "Passwords do not match"
            return false
        }
        
        guard password.count >= 6 else {
            errorMessage = "Password must be at least 6 characters"
            return false
        }
        
        return true
    }
    
    func signup() async {
        guard validate() else { return }
        
        isLoading = true
        errorMessage = ""
        
        do {
            // Firebase authentication
            let result = try await Auth.auth().createUser(withEmail: email, password: password)
            let token = try await result.user.getIDToken()
            
            // Backend registration
            let signupData = try JSONEncoder().encode([
                "fullName": fullName,
                "username": username,
                "email": email,
                "phoneNumber": phoneNumber,
                "firebaseToken": token
            ])
            
            let response: UserResponse = try await NetworkService.shared.request(
                endpoint: "/auth/signup",
                method: "POST",
                body: signupData
            )
            
            currentUser = response.data
            isAuthenticated = true
            
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
} 