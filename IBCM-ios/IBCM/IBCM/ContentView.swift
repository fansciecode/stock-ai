//
//  ContentView.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI

// MARK: - Content View
struct ContentView: View {
    @EnvironmentObject private var appState: AppState

    var body: some View {
        Group {
            if appState.isLoading {
                LoadingView()
            } else if !appState.isAuthenticated {
                AuthNavigationView()
            } else if !appState.hasSelectedCategories {
                CategorySelectionView()
            } else {
                MainTabView()
            }
        }
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        ZStack {
            Color.white.edgesIgnoringSafeArea(.all)
            
            VStack(spacing: 20) {
                Image(systemName: "building.2")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 100, height: 100)
                    .foregroundColor(.blue)
                
                Text("IBCM")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                ProgressView()
                    .progressViewStyle(CircularProgressViewStyle())
                    .scaleEffect(2)
                
                Text("Loading...")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
        }
    }
}

// MARK: - Auth Navigation View
struct AuthNavigationView: View {
    var body: some View {
        NavigationView {
            VStack {
                Text("Login Screen")
                    .font(.largeTitle)
                    .padding()
                
                Button("Sign In") {
                    // Placeholder for sign in action
                }
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
            }
        }
    }
}

// MARK: - Category Selection View
struct CategorySelectionView: View {
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        VStack {
            Text("Select Categories")
                .font(.largeTitle)
                .padding()
            
            Button("Save Categories") {
                appState.saveCategories(categories: ["Sports", "Technology"]) { _ in
                    // Placeholder for completion
                }
            }
            .padding()
            .background(Color.blue)
            .foregroundColor(.white)
            .cornerRadius(10)
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    var body: some View {
        TabView {
            Text("Home")
                .tabItem {
                    Image(systemName: "house")
                    Text("Home")
                }
            
            Text("Events")
                .tabItem {
                    Image(systemName: "calendar")
                    Text("Events")
                }
            
            Text("Profile")
                .tabItem {
                    Image(systemName: "person")
                    Text("Profile")
                }
            
            Text("Settings")
                .tabItem {
                    Image(systemName: "gear")
                    Text("Settings")
                }
        }
    }
}
