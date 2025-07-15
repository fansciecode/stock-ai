//
//  LoginView.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI

struct LoginView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @EnvironmentObject private var navigation: AppNavigation
    
    @State private var email = ""
    @State private var password = ""
    @State private var showPassword = false
    
    var body: some View {
        VStack(spacing: 20) {
            // Logo and title
            VStack {
                Image(systemName: "globe")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .foregroundColor(.blue)
                
                Text("IBCM")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Login to your account")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 30)
            
            // Email field
            TextField("Email", text: $email)
                .padding()
                .background(Color(.systemGray6))
                .cornerRadius(8)
                .keyboardType(.emailAddress)
                .autocapitalization(.none)
            
            // Password field
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
            
            // Forgot password
            HStack {
                Spacer()
                Button(action: {
                    navigation.navigate(to: .forgotPassword)
                }) {
                    Text("Forgot Password?")
                        .foregroundColor(.blue)
                        .font(.subheadline)
                }
            }
            
            // Login button
            Button(action: {
                login()
            }) {
                if authViewModel.isLoading {
                    ProgressView()
                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                } else {
                    Text("Login")
                        .fontWeight(.bold)
                }
            }
            .frame(maxWidth: .infinity)
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(8)
            .disabled(authViewModel.isLoading)
            
            // Error message
            if let error = authViewModel.error {
                Text(error)
                    .foregroundColor(.red)
                    .font(.caption)
            }
            
            // Sign up option
            HStack {
                Text("Don't have an account?")
                    .foregroundColor(.secondary)
                
                Button(action: {
                    navigation.navigate(to: .signup)
                }) {
                    Text("Sign Up")
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
            .padding(.top)
        }
        .padding()
    }
    
    private func login() {
        authViewModel.signIn(email: email, password: password) { success, hasCategories, error in
            if success {
                if hasCategories {
                    navigation.navigate(to: .home)
                } else {
                    navigation.navigate(to: .categories)
                }
            }
        }
    }
}
