//
//  AuthViewModel.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import Foundation
import SwiftUI
import Firebase

class AuthViewModel: ObservableObject {
    // MARK: - Auth State
    enum AuthState {
        case unknown
        case authenticated
        case notAuthenticated
    }
    
    // MARK: - Properties
    @Published var authState: AuthState = .unknown
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = true
    @Published var error: String?
    @Published var hasSelectedCategories = false
    
    init() {
        // Simulate checking authentication status
        checkAuthStatus()
    }
    
    func checkAuthStatus() {
        isLoading = true
        
        // In a real app, check Firebase auth status
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            // Simulate checking auth status
            self.isLoading = false
            self.isAuthenticated = false
            self.authState = .notAuthenticated
        }
    }
    
    func signIn(email: String, password: String, completion: @escaping (Bool, Bool, String?) -> Void) {
        // Simulate authentication
        isLoading = true
        error = nil
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            // Simple validation
            if !email.isEmpty && !password.isEmpty {
                // Create mock user
                self.currentUser = User.mockUser()
                
                self.isAuthenticated = true
                self.authState = .authenticated
                self.hasSelectedCategories = true // Assume user has categories
                completion(true, true, nil)
            } else {
                self.error = "Invalid email or password"
                completion(false, false, "Invalid email or password")
            }
        }
    }
    
    func signUp(email: String, password: String, name: String, completion: @escaping (Bool, Bool, String?) -> Void) {
        // Simulate sign up
        isLoading = true
        error = nil
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1.5) {
            self.isLoading = false
            
            // Simple validation
            if !email.isEmpty && !password.isEmpty && !name.isEmpty {
                // Create mock user
                self.currentUser = User.mockUser()
                
                self.isAuthenticated = true
                self.authState = .authenticated
                self.hasSelectedCategories = false // New users need to select categories
                completion(true, false, nil)
            } else {
                self.error = "Please fill in all required fields"
                completion(false, false, "Please fill in all required fields")
            }
        }
    }
    
    func resetPassword(email: String, completion: @escaping (Bool, String?) -> Void) {
        // Simulate password reset
        isLoading = true
        error = nil
        
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
        // Simulate sign out
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.currentUser = nil
            self.isAuthenticated = false
            self.authState = .notAuthenticated
            self.isLoading = false
        }
    }
    
    func updateCategories(categories: [String], completion: @escaping (Bool) -> Void) {
        // Simulate updating categories
        isLoading = true
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            if let user = self.currentUser {
                // Update user with new categories
                self.currentUser = user
                self.hasSelectedCategories = true
                self.isLoading = false
                completion(true)
            } else {
                self.isLoading = false
                completion(false)
            }
        }
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