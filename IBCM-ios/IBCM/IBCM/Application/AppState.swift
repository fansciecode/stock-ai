import SwiftUI

class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var isLoading = true
    
    init() {
        // Simulate checking authentication status
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            // In a real app, this would check for a stored token or other auth method
            self.isAuthenticated = false
            self.isLoading = false
        }
    }
    
    func signIn(email: String, password: String, completion: @escaping (Bool, String?) -> Void) {
        // Simulate authentication
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            // Simple validation
            if !email.isEmpty && !password.isEmpty {
                self.isAuthenticated = true
                completion(true, nil)
            } else {
                completion(false, "Invalid email or password")
            }
        }
    }
    
    func signOut() {
        // Simulate sign out
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.isAuthenticated = false
            self.isLoading = false
        }
    }
} 