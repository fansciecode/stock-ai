//
//  IBCMApp.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI
// import Firebase
import Foundation

// MARK: - AppState
class AppState: ObservableObject {
    // MARK: - Properties
    @Published var isAuthenticated = false
    @Published var isLoading = false
    @Published var currentUser: User?
    @Published var error: String?
    @Published var currentScreen: Screen = .splash
    @Published var hasSelectedCategories = false
    
    // MARK: - Methods
    func signIn(email: String, password: String, completion: @escaping (Bool, Bool, String?) -> Void) {
        isLoading = true
        
        // Simulate authentication
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            if !email.isEmpty && !password.isEmpty {
                self.isAuthenticated = true
                self.currentUser = User.mockUser()
                self.hasSelectedCategories = true // Assume user has already selected categories
                self.currentScreen = .home
                completion(true, self.hasSelectedCategories, nil)
            } else {
                self.error = "Invalid email or password"
                completion(false, false, "Invalid email or password")
            }
        }
    }
    
    func signUp(name: String, email: String, password: String, completion: @escaping (Bool, String?) -> Void) {
        isLoading = true
        
        // Simulate sign up
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            if !name.isEmpty && !email.isEmpty && !password.isEmpty {
                self.isAuthenticated = true
                self.currentUser = User.mockUser()
                self.hasSelectedCategories = false // New users need to select categories
                self.currentScreen = .categories
                completion(true, nil)
            } else {
                self.error = "Please fill in all required fields"
                completion(false, "Please fill in all required fields")
            }
        }
    }
    
    func resetPassword(email: String, completion: @escaping (Bool, String?) -> Void) {
        isLoading = true
        
        // Simulate password reset
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            if !email.isEmpty {
                completion(true, nil)
            } else {
                self.error = "Please enter a valid email address"
                completion(false, "Please enter a valid email address")
            }
        }
    }
    
    func signOut() {
        isLoading = true
        
        // Simulate sign out
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.isAuthenticated = false
            self.currentUser = nil
            self.currentScreen = .login
            self.isLoading = false
        }
    }
    
    func saveCategories(categories: [String], completion: @escaping (Bool) -> Void) {
        isLoading = true
        
        // Simulate saving categories
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.hasSelectedCategories = true
            self.isLoading = false
            completion(true)
        }
    }
    
    func navigateTo(_ screen: Screen) {
        self.currentScreen = screen
    }
}

// MARK: - User Model
struct User {
    let id: String
    let email: String
    let name: String
    var profileImageURL: String?
    var categories: [String]
    
    static func mockUser() -> User {
        return User(
            id: UUID().uuidString,
            email: "user@example.com",
            name: "John Doe",
            profileImageURL: nil,
            categories: ["Sports", "Technology", "Health"]
        )
    }
}

// MARK: - Screen Enum
enum Screen {
    // Auth screens
    case splash
    case login
    case signup
    case forgotPassword
    
    // Onboarding
    case categories
    
    // Main app screens
    case home
    case events
    case eventDetails
    case profile
    case settings
}

@main
struct IBCMApp: App {
    // MARK: - Properties
    @StateObject private var appState = AppState()
    
    // MARK: - Initialization
    init() {
        // Configure Firebase
        // FirebaseApp.configure()
    }
    
    // MARK: - Body
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}
