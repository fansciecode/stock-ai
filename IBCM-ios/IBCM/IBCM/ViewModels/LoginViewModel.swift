import Foundation
import FirebaseAuth

@MainActor
class LoginViewModel: ObservableObject {
    @Published var email = ""
    @Published var password = ""
    @Published var errorMessage = ""
    @Published var isLoading = false
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    
    func login() async {
        guard !email.isEmpty, !password.isEmpty else {
            errorMessage = "Please fill in all fields"
            return
        }
        
        isLoading = true
        errorMessage = ""
        
        do {
            // Firebase authentication
            let result = try await Auth.auth().signIn(withEmail: email, password: password)
            let token = try await result.user.getIDToken()
            
            // Backend authentication
            let loginData = try JSONEncoder().encode([
                "email": email,
                "firebaseToken": token
            ])
            
            let response: UserResponse = try await NetworkService.shared.request(
                endpoint: "/auth/login",
                method: "POST",
                body: loginData
            )
            
            currentUser = response.data
            isAuthenticated = true
            
        } catch {
            errorMessage = error.localizedDescription
        }
        
        isLoading = false
    }
} 