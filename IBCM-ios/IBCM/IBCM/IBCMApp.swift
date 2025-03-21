//
//  IBCMApp.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI
import Firebase

@main
struct IBCMApp: App {
    @StateObject private var appState = AppState()
    
    init() {
        FirebaseApp.configure()
    }
    
    var body: some Scene {
        WindowGroup {
            ContentView()
                .environmentObject(appState)
        }
    }
}

class AppState: ObservableObject {
    @Published var isAuthenticated = false
    @Published var currentUser: User?
    @Published var isLoading = false
    
    // Add more app-wide state as needed
}
