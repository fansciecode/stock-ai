//
//  AppNavigation.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import Foundation
import SwiftUI

class AppNavigation: ObservableObject {
    // MARK: - Properties
    @Published var currentScreen: Screen = .splash
    @Published var previousScreen: Screen?
    @Published var showTabBar: Bool = false
    @Published var selectedTab: Tab = .home
    
    // Auth view model reference
    private var authViewModel: AuthViewModel
    
    // MARK: - Initialization
    init(authViewModel: AuthViewModel) {
        self.authViewModel = authViewModel
        
        // Set up observers for auth state changes
        setupAuthObserver()
    }
    
    // MARK: - Navigation Methods
    func navigate(to screen: Screen) {
        previousScreen = currentScreen
        currentScreen = screen
        
        // Show tab bar only for main app screens
        updateTabBarVisibility(for: screen)
    }
    
    func navigateBack() {
        if let previous = previousScreen {
            currentScreen = previous
            previousScreen = nil
            
            // Update tab bar visibility
            updateTabBarVisibility(for: currentScreen)
        }
    }
    
    func selectTab(_ tab: Tab) {
        selectedTab = tab
    }
    
    // MARK: - Private Methods
    private func setupAuthObserver() {
        // In a real app, we would observe auth state changes
        // For now, we'll just simulate this
        
        // Initial navigation based on auth state
        updateNavigationForAuthState()
    }
    
    private func updateNavigationForAuthState() {
        // Navigate based on auth state
        switch authViewModel.authState {
        case .authenticated:
            if authViewModel.hasSelectedCategories {
                navigate(to: .home)
            } else {
                navigate(to: .categories)
            }
        case .notAuthenticated:
            navigate(to: .login)
        case .unknown:
            navigate(to: .splash)
        }
    }
    
    private func updateTabBarVisibility(for screen: Screen) {
        switch screen {
        case .home, .events, .profile, .settings:
            showTabBar = true
        default:
            showTabBar = false
        }
    }
}

// MARK: - Tab Enum
enum Tab: String, CaseIterable {
    case home = "Home"
    case events = "Events"
    case profile = "Profile"
    case settings = "Settings"
    
    var icon: String {
        switch self {
        case .home:
            return "house.fill"
        case .events:
            return "calendar"
        case .profile:
            return "person.fill"
        case .settings:
            return "gear"
        }
    }
}

// MARK: - AppNavigationView
struct AppNavigationView: View {
    @ObservedObject var navigation: AppNavigation
    @ObservedObject var authViewModel: AuthViewModel
    
    var body: some View {
        ZStack {
            // Main content based on current screen
            switch navigation.currentScreen {
            case .splash:
                SplashView()
            case .login:
                LoginView()
            case .signup:
                SignupView()
            case .forgotPassword:
                ForgotPasswordView()
            case .categories:
                Text("Categories View")
            case .home:
                HomeView()
            case .events:
                Text("Events View")
            case .eventDetails:
                Text("Event Details View")
            case .profile:
                Text("Profile View")
            case .settings:
                Text("Settings View")
            }
            
            // Tab bar
            if navigation.showTabBar {
                VStack {
                    Spacer()
                    TabBarView(selectedTab: $navigation.selectedTab)
                }
            }
        }
        .environmentObject(navigation)
        .environmentObject(authViewModel)
    }
}

// MARK: - TabBarView
struct TabBarView: View {
    @Binding var selectedTab: Tab
    
    var body: some View {
        HStack {
            ForEach(Tab.allCases, id: \.self) { tab in
                Spacer()
                TabButton(tab: tab, selectedTab: $selectedTab)
                Spacer()
            }
        }
        .padding(.vertical, 10)
        .background(Color.white)
        .shadow(radius: 2)
    }
}

struct TabButton: View {
    let tab: Tab
    @Binding var selectedTab: Tab
    
    var body: some View {
        Button(action: {
            selectedTab = tab
        }) {
            VStack {
                Image(systemName: tab.icon)
                    .font(.system(size: 22))
                    .foregroundColor(selectedTab == tab ? .blue : .gray)
                
                Text(tab.rawValue)
                    .font(.caption)
                    .foregroundColor(selectedTab == tab ? .blue : .gray)
            }
        }
    }
}

// MARK: - SplashView
struct SplashView: View {
    var body: some View {
        VStack {
            Text("IBCM")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            ProgressView()
                .padding()
        }
    }
} 