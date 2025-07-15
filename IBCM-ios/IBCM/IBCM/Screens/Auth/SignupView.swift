//
//  SignupView.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI

struct SignupView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @EnvironmentObject private var navigation: AppNavigation
    
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showPassword = false
    @State private var showConfirmPassword = false
    @State private var passwordsMatch = true
    
    var body: some View {
        VStack(spacing: 20) {
            // Title
            VStack {
                Text("Create Account")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Join IBCM today")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 20)
            
            // Form fields
            ScrollView {
                VStack(spacing: 15) {
                    // Name
                    TextField("Full Name", text: $name)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        .autocapitalization(.words)
                    
                    // Email
                    TextField("Email", text: $email)
                        .padding()
                        .background(Color(.systemGray6))
                        .cornerRadius(8)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                    
                    // Password
                    HStack {
                        if showPassword {
                            TextField("Password", text: $password)
                        } else {
                            SecureField("Password", text: $password)
                        }
                        
                        Button(action: {
                            showPassword.toggle()
                        }) {
                            Image(systemName: showPassword ? "eye.slash" : "eye")
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    
                    // Confirm Password
                    HStack {
                        if showConfirmPassword {
                            TextField("Confirm Password", text: $confirmPassword)
                                .onChange(of: confirmPassword) { _ in
                                    checkPasswordsMatch()
                                }
                        } else {
                            SecureField("Confirm Password", text: $confirmPassword)
                                .onChange(of: confirmPassword) { _ in
                                    checkPasswordsMatch()
                                }
                        }
                        
                        Button(action: {
                            showConfirmPassword.toggle()
                        }) {
                            Image(systemName: showConfirmPassword ? "eye.slash" : "eye")
                                .foregroundColor(.gray)
                        }
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(8)
                    
                    // Password match error
                    if !passwordsMatch {
                        Text("Passwords do not match")
                            .foregroundColor(.red)
                            .font(.caption)
                            .frame(maxWidth: .infinity, alignment: .leading)
                    }
                    
                    // Error message
                    if let error = authViewModel.error {
                        Text(error)
                            .foregroundColor(.red)
                            .font(.caption)
                    }
                    
                    // Sign up button
                    Button(action: {
                        signup()
                    }) {
                        if authViewModel.isLoading {
                            ProgressView()
                                .progressViewStyle(CircularProgressViewStyle(tint: .white))
                        } else {
                            Text("Sign Up")
                                .fontWeight(.bold)
                        }
                    }
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(8)
                    .disabled(authViewModel.isLoading || !passwordsMatch || password.isEmpty || confirmPassword.isEmpty)
                    .padding(.top, 10)
                    
                    // Login option
                    HStack {
                        Text("Already have an account?")
                            .foregroundColor(.secondary)
                        
                        Button(action: {
                            navigation.navigate(to: .login)
                        }) {
                            Text("Login")
                                .fontWeight(.bold)
                                .foregroundColor(.blue)
                        }
                    }
                    .padding(.top)
                }
            }
        }
        .padding()
    }
    
    private func checkPasswordsMatch() {
        if !confirmPassword.isEmpty {
            passwordsMatch = password == confirmPassword
        } else {
            passwordsMatch = true
        }
    }
    
    private func signup() {
        guard passwordsMatch else { return }
        
        authViewModel.signUp(email: email, password: password, name: name) { success, hasCategories, error in
            if success {
                navigation.navigate(to: .categories)
            }
        }
    }
} 