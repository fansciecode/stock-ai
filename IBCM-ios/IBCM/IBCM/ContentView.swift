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
    @State private var showingLogin = true
    
    var body: some View {
        NavigationView {
            VStack {
                if showingLogin {
                    LoginView(showingLogin: $showingLogin)
                } else {
                    SignupView(showingLogin: $showingLogin)
                }
            }
        }
    }
}

// MARK: - Login View
struct LoginView: View {
    @Binding var showingLogin: Bool
    @State private var email = ""
    @State private var password = ""
    @State private var showingForgotPassword = false
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        VStack(spacing: 20) {
            // Logo and Title
            VStack(spacing: 10) {
                Image(systemName: "building.2")
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
            
            // Login Form
            VStack(spacing: 15) {
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: {
                    showingForgotPassword = true
                }) {
                    Text("Forgot Password?")
                        .font(.subheadline)
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }
                .padding(.bottom, 10)
                
                Button(action: {
                    login()
                }) {
                    if appState.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .tint(.white)
                    } else {
                        Text("Sign In")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .disabled(appState.isLoading)
            }
            
            Spacer()
            
            // Sign Up Link
            Button(action: {
                withAnimation {
                    showingLogin = false
                }
            }) {
                HStack {
                    Text("Don't have an account?")
                        .foregroundColor(.secondary)
                    Text("Sign Up")
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
            }
            .padding(.bottom)
        }
        .padding(.horizontal, 30)
        .sheet(isPresented: $showingForgotPassword) {
            ForgotPasswordView(isPresented: $showingForgotPassword)
        }
        .alert(isPresented: $showingAlert) {
            Alert(
                title: Text("Error"),
                message: Text(alertMessage),
                dismissButton: .default(Text("OK"))
            )
        }
    }
    
    private func login() {
        appState.signIn(email: email, password: password) { success, hasCategories, error in
            if !success {
                alertMessage = error ?? "An unknown error occurred"
                showingAlert = true
            }
        }
    }
}

// MARK: - Signup View
struct SignupView: View {
    @Binding var showingLogin: Bool
    @State private var name = ""
    @State private var email = ""
    @State private var password = ""
    @State private var confirmPassword = ""
    @State private var showingAlert = false
    @State private var alertMessage = ""
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        VStack(spacing: 20) {
            // Logo and Title
            VStack(spacing: 10) {
                Image(systemName: "building.2")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 80, height: 80)
                    .foregroundColor(.blue)
                
                Text("IBCM")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                
                Text("Create an account")
                    .font(.headline)
                    .foregroundColor(.secondary)
            }
            .padding(.bottom, 30)
            
            // Signup Form
            VStack(spacing: 15) {
                TextField("Full Name", text: $name)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                
                SecureField("Password", text: $password)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                SecureField("Confirm Password", text: $confirmPassword)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                
                Button(action: {
                    signup()
                }) {
                    if appState.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .tint(.white)
                    } else {
                        Text("Sign Up")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .disabled(appState.isLoading)
            }
            
            Spacer()
            
            // Login Link
            Button(action: {
                withAnimation {
                    showingLogin = true
                }
            }) {
                HStack {
                    Text("Already have an account?")
                        .foregroundColor(.secondary)
                    Text("Sign In")
                        .fontWeight(.semibold)
                        .foregroundColor(.blue)
                }
            }
            .padding(.bottom)
        }
        .padding(.horizontal, 30)
        .alert(isPresented: $showingAlert) {
            Alert(
                title: Text("Error"),
                message: Text(alertMessage),
                dismissButton: .default(Text("OK"))
            )
        }
    }
    
    private func signup() {
        // Validate inputs
        if name.isEmpty || email.isEmpty || password.isEmpty {
            alertMessage = "Please fill in all fields"
            showingAlert = true
            return
        }
        
        if password != confirmPassword {
            alertMessage = "Passwords do not match"
            showingAlert = true
            return
        }
        
        appState.signUp(email: email, password: password, name: name) { success, hasCategories, error in
            if !success {
                alertMessage = error ?? "An unknown error occurred"
                showingAlert = true
            }
        }
    }
}

// MARK: - Forgot Password View
struct ForgotPasswordView: View {
    @Binding var isPresented: Bool
    @State private var email = ""
    @State private var showingAlert = false
    @State private var alertTitle = ""
    @State private var alertMessage = ""
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Reset Password")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding(.top, 30)
                
                Text("Enter your email address and we'll send you instructions to reset your password.")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                TextField("Email", text: $email)
                    .textFieldStyle(RoundedBorderTextFieldStyle())
                    .autocapitalization(.none)
                    .keyboardType(.emailAddress)
                    .padding(.horizontal)
                
                Button(action: {
                    resetPassword()
                }) {
                    if appState.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .tint(.white)
                    } else {
                        Text("Send Reset Link")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color.blue)
                .foregroundColor(.white)
                .cornerRadius(10)
                .padding(.horizontal)
                .disabled(appState.isLoading)
                
                Spacer()
            }
            .navigationBarItems(leading: Button("Cancel") {
                isPresented = false
            })
            .alert(isPresented: $showingAlert) {
                Alert(
                    title: Text(alertTitle),
                    message: Text(alertMessage),
                    dismissButton: .default(Text("OK")) {
                        if alertTitle == "Success" {
                            isPresented = false
                        }
                    }
                )
            }
        }
    }
    
    private func resetPassword() {
        if email.isEmpty {
            alertTitle = "Error"
            alertMessage = "Please enter your email address"
            showingAlert = true
            return
        }
        
        appState.resetPassword(email: email) { success, error in
            if success {
                alertTitle = "Success"
                alertMessage = "Password reset instructions have been sent to your email"
            } else {
                alertTitle = "Error"
                alertMessage = error ?? "An unknown error occurred"
            }
            showingAlert = true
        }
    }
}

// MARK: - Category Selection View
struct CategorySelectionView: View {
    @State private var selectedCategories = Set<String>()
    @EnvironmentObject private var appState: AppState
    
    private let categories = [
        "Music", "Sports", "Food", "Art", "Technology", 
        "Business", "Education", "Health", "Travel", "Entertainment"
    ]
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Select your interests")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding(.top)
                
                Text("Choose at least 3 categories that interest you")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                        ForEach(categories, id: \.self) { category in
                            CategoryCard(
                                category: category,
                                isSelected: selectedCategories.contains(category),
                                action: {
                                    toggleCategory(category)
                                }
                            )
                        }
                    }
                    .padding()
                }
                
                Button(action: {
                    saveCategories()
                }) {
                    if appState.isLoading {
                        ProgressView()
                            .progressViewStyle(CircularProgressViewStyle())
                            .tint(.white)
                    } else {
                        Text("Continue")
                            .fontWeight(.semibold)
                    }
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(selectedCategories.count >= 3 ? Color.blue : Color.gray)
                .foregroundColor(.white)
                .cornerRadius(10)
                .padding(.horizontal)
                .disabled(selectedCategories.count < 3 || appState.isLoading)
            }
            .navigationBarItems(trailing: Button("Skip") {
                appState.hasSelectedCategories = true
            })
        }
    }
    
    private func toggleCategory(_ category: String) {
        if selectedCategories.contains(category) {
            selectedCategories.remove(category)
        } else {
            selectedCategories.insert(category)
        }
    }
    
    private func saveCategories() {
        appState.updateCategories(categories: Array(selectedCategories)) { success in
            // Categories updated in AppState
        }
    }
}

struct CategoryCard: View {
    let category: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 15) {
                Image(systemName: getCategoryIcon(category))
                    .font(.system(size: 30))
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(category)
                    .font(.headline)
                    .foregroundColor(isSelected ? .white : .primary)
            }
            .frame(maxWidth: .infinity)
            .frame(height: 120)
            .background(isSelected ? Color.blue : Color.gray.opacity(0.1))
            .cornerRadius(12)
        }
    }
    
    private func getCategoryIcon(_ category: String) -> String {
        switch category.lowercased() {
        case "music": return "music.note"
        case "sports": return "sportscourt"
        case "food": return "fork.knife"
        case "art": return "paintbrush"
        case "technology": return "laptop"
        case "business": return "briefcase"
        case "education": return "book"
        case "health": return "heart"
        case "travel": return "airplane"
        case "entertainment": return "tv"
        default: return "star"
        }
    }
}

// MARK: - Main Tab View
struct MainTabView: View {
    var body: some View {
        TabView {
            HomeView()
                .tabItem {
                    Label("Home", systemImage: "house.fill")
                }

            ExploreView()
                .tabItem {
                    Label("Explore", systemImage: "magnifyingglass")
                }

            ChatListView()
                .tabItem {
                    Label("Messages", systemImage: "message.fill")
                }

            ProfileView()
                .tabItem {
                    Label("Profile", systemImage: "person.fill")
                }
        }
    }
}

// MARK: - Home View
struct HomeView: View {
    @State private var searchText = ""
    @State private var selectedCategory: String? = nil
    @State private var showingCreateEvent = false
    @EnvironmentObject private var appState: AppState
    
    // Sample data
    private let categories = [
        "Music", "Sports", "Food", "Art", "Technology", 
        "Business", "Education", "Health", "Travel", "Entertainment"
    ]
    
    private let events = [
        Event(id: "1", title: "Summer Music Festival", description: "A weekend of amazing live music performances", date: Date().addingTimeInterval(86400 * 7), location: "Central Park", imageColor: .blue, price: 49.99),
        Event(id: "2", title: "Tech Conference", description: "Learn about the latest technologies", date: Date().addingTimeInterval(86400 * 14), location: "Convention Center", imageColor: .purple, price: 199.99),
        Event(id: "3", title: "Food & Wine Festival", description: "Taste amazing food and wine from local vendors", date: Date().addingTimeInterval(86400 * 21), location: "Downtown Square", imageColor: .red, price: 29.99),
        Event(id: "4", title: "Charity Run", description: "5K run to raise money for local charities", date: Date().addingTimeInterval(86400 * 5), location: "City Park", imageColor: .green, price: 15.00),
        Event(id: "5", title: "Art Exhibition", description: "Featuring works from local artists", date: Date().addingTimeInterval(86400 * 10), location: "Art Gallery", imageColor: .orange, price: nil)
    ]
    
    private var filteredEvents: [Event] {
        events.filter { event in
            (selectedCategory == nil || event.categories.contains(selectedCategory!)) &&
            (searchText.isEmpty || event.title.localizedCaseInsensitiveContains(searchText))
        }
    }
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 0) {
                    // Header
                    HStack {
                        VStack(alignment: .leading, spacing: 4) {
                            Text("Welcome Back!")
                                .font(.title2)
                                .fontWeight(.semibold)
                            
                            Text(getGreeting())
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                        
                        Spacer()
                        
                        HStack(spacing: 12) {
                            Button(action: {
                                // Navigate to notifications
                            }) {
                                ZStack {
                                    Circle()
                                        .fill(Color.gray.opacity(0.1))
                                        .frame(width: 40, height: 40)
                                    
                                    Image(systemName: "bell")
                                        .foregroundColor(.primary)
                                    
                                    // Notification badge
                                    Circle()
                                        .fill(Color.red)
                                        .frame(width: 8, height: 8)
                                        .offset(x: 12, y: -12)
                                }
                            }
                            
                            Button(action: {
                                // Navigate to profile
                            }) {
                                Circle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(width: 40, height: 40)
                                    .overlay(
                                        Image(systemName: "person.fill")
                                            .foregroundColor(.gray)
                                    )
                            }
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 8)
                    
                    // Search Bar
                    HStack {
                        HStack {
                            Image(systemName: "magnifyingglass")
                                .foregroundColor(.gray)
                            
                            TextField("Search events, categories...", text: $searchText)
                                .textFieldStyle(PlainTextFieldStyle())
                            
                            if !searchText.isEmpty {
                                Button(action: {
                                    searchText = ""
                                }) {
                                    Image(systemName: "xmark.circle.fill")
                                        .foregroundColor(.gray)
                                }
                            }
                        }
                        .padding(.horizontal, 12)
                        .padding(.vertical, 10)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(12)
                        
                        Button(action: {
                            // Show filters
                        }) {
                            Image(systemName: "slider.horizontal.3")
                                .foregroundColor(.primary)
                                .padding(10)
                                .background(Color.blue.opacity(0.1))
                                .cornerRadius(12)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.top, 16)
                    
                    // Quick Actions
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Quick Actions")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .padding(.horizontal)
                        
                        LazyVGrid(columns: Array(repeating: GridItem(.flexible(), spacing: 12), count: 4), spacing: 12) {
                            QuickActionButton(
                                icon: "plus.circle.fill",
                                title: "Create Event",
                                color: .blue,
                                action: { showingCreateEvent = true }
                            )
                            
                            QuickActionButton(
                                icon: "calendar",
                                title: "My Events",
                                color: .green,
                                action: { /* Navigate to my events */ }
                            )
                            
                            QuickActionButton(
                                icon: "ticket",
                                title: "Tickets",
                                color: .orange,
                                action: { /* Navigate to tickets */ }
                            )
                            
                            QuickActionButton(
                                icon: "heart.fill",
                                title: "Favorites",
                                color: .red,
                                action: { /* Navigate to favorites */ }
                            )
                        }
                        .padding(.horizontal)
                    }
                    .padding(.top, 20)
                    
                    // Categories
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Categories")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Button("See All") {
                                // Navigate to all categories
                            }
                            .font(.subheadline)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 12) {
                                ForEach(categories, id: \.self) { category in
                                    HomeCategoryCard(
                                        category: category,
                                        isSelected: selectedCategory == category,
                                        action: {
                                            selectedCategory = selectedCategory == category ? nil : category
                                        }
                                    )
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.top, 20)
                    
                    // Nearby Events
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Nearby Events")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Button(action: {
                                // Toggle map/list view
                            }) {
                                Image(systemName: "map")
                                    .foregroundColor(.blue)
                            }
                        }
                        .padding(.horizontal)
                        
                        if filteredEvents.isEmpty {
                            VStack(spacing: 10) {
                                Image(systemName: "calendar.badge.exclamationmark")
                                    .font(.system(size: 50))
                                    .foregroundColor(.gray)
                                
                                Text("No events found")
                                    .font(.headline)
                                
                                Text("Try adjusting your search or filters")
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 50)
                        } else {
                            VStack(spacing: 12) {
                                ForEach(filteredEvents) { event in
                                    EventCard(event: event) {
                                        // Navigate to event details
                                    }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                    .padding(.top, 20)
                }
                .padding(.bottom, 20)
            }
            .navigationTitle("")
            .navigationBarHidden(true)
            .sheet(isPresented: $showingCreateEvent) {
                CreateEventView(isPresented: $showingCreateEvent)
            }
        }
    }
    
    private func getGreeting() -> String {
        let hour = Calendar.current.component(.hour, from: Date())
        if hour < 12 {
            return "Good morning"
        } else if hour < 18 {
            return "Good afternoon"
        } else {
            return "Good evening"
        }
    }
}

struct Event: Identifiable {
    let id: String
    let title: String
    let description: String
    let date: Date
    let location: String
    let imageColor: Color
    let price: Double?
    var categories: [String] = ["Music", "Entertainment"] // Default categories for sample data
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let color: Color
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(color)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
                    .multilineTextAlignment(.center)
            }
            .frame(maxWidth: .infinity)
            .padding(.vertical, 16)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct HomeCategoryCard: View {
    let category: String
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: getCategoryIcon(category))
                    .font(.system(size: 24))
                    .foregroundColor(isSelected ? .white : .primary)
                
                Text(category)
                    .font(.caption)
                    .foregroundColor(isSelected ? .white : .primary)
                    .multilineTextAlignment(.center)
            }
            .frame(width: 80, height: 80)
            .background(isSelected ? Color.blue : Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
    
    private func getCategoryIcon(_ category: String) -> String {
        switch category.lowercased() {
        case "music": return "music.note"
        case "sports": return "sportscourt"
        case "food": return "fork.knife"
        case "art": return "paintbrush"
        case "technology": return "laptop"
        case "business": return "briefcase"
        case "education": return "book"
        case "health": return "heart"
        case "travel": return "airplane"
        case "entertainment": return "tv"
        default: return "star"
        }
    }
}

struct EventCard: View {
    let event: Event
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            HStack(spacing: 12) {
                Rectangle()
                    .fill(event.imageColor)
                    .frame(width: 80, height: 80)
                    .cornerRadius(12)
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                        .lineLimit(2)
                    
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.secondary)
                            .font(.caption)
                        
                        Text(event.formattedDate)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    HStack {
                        Image(systemName: "location")
                            .foregroundColor(.secondary)
                            .font(.caption)
                        
                        Text(event.location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    if let price = event.price {
                        Text("$\(price, specifier: "%.2f")")
                            .font(.subheadline)
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)
                    }
                }
                
                Spacer()
            }
            .padding(12)
            .background(Color.white)
            .cornerRadius(12)
            .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

struct CreateEventView: View {
    @Binding var isPresented: Bool
    @State private var eventTitle = ""
    @State private var eventDescription = ""
    @State private var eventDate = Date()
    @State private var eventLocation = ""
    @State private var eventPrice = ""
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Event Details")) {
                    TextField("Title", text: $eventTitle)
                    
                    TextField("Description", text: $eventDescription)
                        .frame(height: 100)
                    
                    DatePicker("Date & Time", selection: $eventDate, displayedComponents: [.date, .hourAndMinute])
                    
                    TextField("Location", text: $eventLocation)
                    
                    TextField("Price (optional)", text: $eventPrice)
                        .keyboardType(.decimalPad)
                }
                
                Section(header: Text("Categories")) {
                    Text("Category selection will be added here")
                        .foregroundColor(.secondary)
                }
            }
            .navigationTitle("Create Event")
            .navigationBarItems(
                leading: Button("Cancel") {
                    isPresented = false
                },
                trailing: Button("Create") {
                    // Save event
                    isPresented = false
                }
                .disabled(eventTitle.isEmpty || eventDescription.isEmpty || eventLocation.isEmpty)
            )
        }
    }
}

// MARK: - Explore View
struct ExploreView: View {
    @State private var searchText = ""
    @State private var selectedCategory: Category? = nil
    
    // Sample data
    private let categories = [
        Category(id: "1", name: "Food", icon: "fork.knife"),
        Category(id: "2", name: "Shopping", icon: "bag"),
        Category(id: "3", name: "Services", icon: "wrench.and.screwdriver"),
        Category(id: "4", name: "Entertainment", icon: "film")
    ]
    
    private let items = [
        ExploreItem(id: "1", name: "Italian Restaurant", category: "Food", rating: 4.5, imageColor: .red),
        ExploreItem(id: "2", name: "Clothing Store", category: "Shopping", rating: 4.2, imageColor: .blue),
        ExploreItem(id: "3", name: "Plumbing Service", category: "Services", rating: 4.8, imageColor: .green),
        ExploreItem(id: "4", name: "Movie Theater", category: "Entertainment", rating: 4.0, imageColor: .purple)
    ]
    
    var filteredItems: [ExploreItem] {
        items.filter { item in
            (selectedCategory == nil || item.category == selectedCategory?.name) &&
            (searchText.isEmpty || item.name.localizedCaseInsensitiveContains(searchText))
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                .padding(.horizontal)
                
                // Categories
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 15) {
                        ForEach(categories) { category in
                            CategoryButton(
                                category: category,
                                isSelected: selectedCategory?.id == category.id,
                                action: {
                                    if selectedCategory?.id == category.id {
                                        selectedCategory = nil
                                    } else {
                                        selectedCategory = category
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Results
                ScrollView {
                    LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                        ForEach(filteredItems) { item in
                            ExploreItemView(item: item)
                        }
                    }
                    .padding()
                }
            }
            .navigationTitle("Explore")
        }
    }
}

struct Category: Identifiable {
    let id: String
    let name: String
    let icon: String
}

struct ExploreItem: Identifiable {
    let id: String
    let name: String
    let category: String
    let rating: Double
    let imageColor: Color
}

struct CategoryButton: View {
    let category: Category
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(width: 40, height: 40)
                    .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
                    .clipShape(Circle())
                
                Text(category.name)
                    .font(.caption)
                    .foregroundColor(isSelected ? .blue : .primary)
            }
        }
    }
}

struct ExploreItemView: View {
    let item: ExploreItem
    
    var body: some View {
        VStack(alignment: .leading) {
            Rectangle()
                .fill(item.imageColor)
                .frame(height: 120)
                .cornerRadius(10)
            
            Text(item.name)
                .font(.headline)
                .lineLimit(1)
            
            Text(item.category)
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack {
                ForEach(1...5, id: \.self) { index in
                    Image(systemName: index <= Int(item.rating) ? "star.fill" : "star")
                        .font(.caption)
                        .foregroundColor(.yellow)
                }
                
                Text(String(format: "%.1f", item.rating))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(10)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

// MARK: - Chat List View
struct ChatListView: View {
    @State private var searchText = ""
    
    // Sample data
    private let chats = [
        Chat(id: "1", name: "John Doe", lastMessage: "Hey, how are you?", time: "10:30 AM", unreadCount: 2),
        Chat(id: "2", name: "Jane Smith", lastMessage: "Are we still meeting tomorrow?", time: "9:15 AM", unreadCount: 0),
        Chat(id: "3", name: "Mike Johnson", lastMessage: "Thanks for your help!", time: "Yesterday", unreadCount: 0)
    ]
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                .padding(.horizontal)
                
                // Chat list
                List {
                    ForEach(chats.filter { 
                        searchText.isEmpty || 
                        $0.name.localizedCaseInsensitiveContains(searchText) ||
                        $0.lastMessage.localizedCaseInsensitiveContains(searchText)
                    }) { chat in
                        ChatRow(chat: chat)
                    }
                }
                .listStyle(PlainListStyle())
            }
            .navigationTitle("Messages")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        // Action for new message
                    }) {
                        Image(systemName: "square.and.pencil")
                    }
                }
            }
        }
    }
}

struct Chat: Identifiable {
    let id: String
    let name: String
    let lastMessage: String
    let time: String
    let unreadCount: Int
}

struct ChatRow: View {
    let chat: Chat
    
    var body: some View {
        HStack(spacing: 12) {
            // Profile image
            Circle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 50, height: 50)
            
            // Chat details
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(chat.name)
                        .font(.headline)
                        .fontWeight(chat.unreadCount > 0 ? .bold : .regular)
                    
                    Spacer()
                    
                    Text(chat.time)
                        .font(.caption)
                        .foregroundColor(.gray)
                }
                
                HStack {
                    Text(chat.lastMessage)
                        .font(.subheadline)
                        .foregroundColor(.gray)
                        .lineLimit(1)
                    
                    Spacer()
                    
                    if chat.unreadCount > 0 {
                        Text("\(chat.unreadCount)")
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding(5)
                            .background(Color.blue)
                            .clipShape(Circle())
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

// MARK: - Profile View
struct ProfileView: View {
    @EnvironmentObject private var appState: AppState
    @State private var showingSettings = false
    @State private var showingLogoutConfirmation = false
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile Header
                    VStack(spacing: 15) {
                        // Profile image
                        ZStack(alignment: .bottomTrailing) {
                            Circle()
                                .fill(Color.gray.opacity(0.3))
                                .frame(width: 100, height: 100)
                                .overlay(
                                    Group {
                                        if let user = appState.currentUser {
                                            if let profileImage = user.profileImage {
                                                // In a real app, load image from URL
                                                Image(systemName: "person.fill")
                                                    .resizable()
                                                    .scaledToFit()
                                                    .frame(width: 50, height: 50)
                                                    .foregroundColor(.white)
                                            } else {
                                                Text(getInitials(from: user.name))
                                                    .font(.system(size: 36))
                                                    .fontWeight(.bold)
                                                    .foregroundColor(.white)
                                            }
                                        } else {
                                            Image(systemName: "person.fill")
                                                .resizable()
                                                .scaledToFit()
                                                .frame(width: 50, height: 50)
                                                .foregroundColor(.white)
                                        }
                                    }
                                )
                            
                            Circle()
                                .fill(Color.blue)
                                .frame(width: 30, height: 30)
                                .overlay(
                                    Image(systemName: "camera.fill")
                                        .font(.system(size: 14))
                                        .foregroundColor(.white)
                                )
                                .offset(x: 5, y: 5)
                        }
                        
                        if let user = appState.currentUser {
                            Text(user.name)
                                .font(.title2)
                                .fontWeight(.bold)
                            
                            Text(user.email)
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                            
                            if let location = user.location {
                                HStack {
                                    Image(systemName: "location.fill")
                                        .foregroundColor(.secondary)
                                        .font(.caption)
                                    
                                    Text(location)
                                        .font(.subheadline)
                                        .foregroundColor(.secondary)
                                }
                            }
                            
                            Text("Member since \(user.formattedJoinDate)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding(.top, 4)
                            
                            if let bio = user.bio, !bio.isEmpty {
                                Text(bio)
                                    .font(.body)
                                    .multilineTextAlignment(.center)
                                    .padding(.horizontal)
                                    .padding(.top, 5)
                            }
                            
                            // Profile stats
                            HStack(spacing: 30) {
                                VStack {
                                    Text("12")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    
                                    Text("Events")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                VStack {
                                    Text("48")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    
                                    Text("Tickets")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                VStack {
                                    Text("156")
                                        .font(.title3)
                                        .fontWeight(.bold)
                                    
                                    Text("Followers")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                            }
                            .padding(.top, 10)
                            
                            // Edit Profile Button
                            Button(action: {
                                // Navigate to edit profile
                            }) {
                                Text("Edit Profile")
                                    .fontWeight(.medium)
                                    .frame(width: 150)
                                    .padding(.vertical, 8)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(20)
                            }
                            .padding(.top, 10)
                        } else {
                            Text("User Profile")
                                .font(.title)
                                .fontWeight(.bold)
                            
                            Text("Please sign in to view your profile")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }
                    }
                    .padding()
                    
                    // My Events Section
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("My Events")
                                .font(.headline)
                                .fontWeight(.semibold)
                            
                            Spacer()
                            
                            Button("See All") {
                                // Navigate to all events
                            }
                            .font(.subheadline)
                            .foregroundColor(.blue)
                        }
                        .padding(.horizontal)
                        
                        if appState.currentUser != nil {
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 15) {
                                    ForEach(0..<3) { i in
                                        MyEventCard(
                                            title: "Event \(i+1)",
                                            date: Date().addingTimeInterval(Double(i) * 86400),
                                            color: [.blue, .purple, .green][i % 3]
                                        )
                                    }
                                }
                                .padding(.horizontal)
                            }
                        } else {
                            Text("Sign in to see your events")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                                .frame(maxWidth: .infinity, alignment: .center)
                                .padding()
                        }
                    }
                    .padding(.top, 10)
                    
                    // Profile options
                    VStack(spacing: 0) {
                        ProfileOptionRow(icon: "ticket", title: "My Tickets", action: {
                            // Navigate to tickets
                        })
                        
                        ProfileOptionRow(icon: "heart", title: "Favorites", action: {
                            // Navigate to favorites
                        })
                        
                        ProfileOptionRow(icon: "creditcard", title: "Payment Methods", action: {
                            // Navigate to payment methods
                        })
                        
                        ProfileOptionRow(icon: "bell", title: "Notifications", action: {
                            // Navigate to notifications
                        })
                        
                        ProfileOptionRow(icon: "gear", title: "Settings", action: {
                            showingSettings = true
                        })
                        
                        ProfileOptionRow(icon: "questionmark.circle", title: "Help & Support", action: {
                            // Navigate to help
                        })
                        
                        ProfileOptionRow(icon: "arrow.right.square", title: "Logout", showDivider: false, action: {
                            showingLogoutConfirmation = true
                        })
                    }
                    .background(Color.white)
                    .cornerRadius(10)
                    .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                    .padding(.top, 10)
                }
                .padding(.vertical)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
            .sheet(isPresented: $showingSettings) {
                SettingsView(isPresented: $showingSettings)
            }
            .alert(isPresented: $showingLogoutConfirmation) {
                Alert(
                    title: Text("Logout"),
                    message: Text("Are you sure you want to logout?"),
                    primaryButton: .destructive(Text("Logout")) {
                        appState.signOut()
                    },
                    secondaryButton: .cancel()
                )
            }
        }
    }
    
    private func getInitials(from name: String) -> String {
        let components = name.components(separatedBy: " ")
        if components.count > 1, 
           let first = components.first?.first,
           let last = components.last?.first {
            return String(first) + String(last)
        } else if let first = components.first?.first {
            return String(first)
        }
        return "?"
    }
}

struct MyEventCard: View {
    let title: String
    let date: Date
    let color: Color
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .none
        return formatter.string(from: date)
    }
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Rectangle()
                .fill(color)
                .frame(height: 80)
                .cornerRadius(10, corners: [.topLeft, .topRight])
            
            VStack(alignment: .leading, spacing: 4) {
                Text(title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(1)
                
                Text(formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(.horizontal, 10)
            .padding(.bottom, 10)
        }
        .frame(width: 150)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

struct ProfileOptionRow: View {
    let icon: String
    let title: String
    var showDivider: Bool = true
    let action: () -> Void
    
    var body: some View {
        VStack(alignment: .leading) {
            Button(action: action) {
                HStack {
                    Image(systemName: icon)
                        .frame(width: 24, height: 24)
                        .foregroundColor(.blue)
                    
                    Text(title)
                        .foregroundColor(.primary)
                    
                    Spacer()
                    
                    Image(systemName: "chevron.right")
                        .foregroundColor(.gray)
                }
                .padding(.vertical, 12)
                .padding(.horizontal, 16)
            }
            
            if showDivider {
                Divider()
                    .padding(.leading, 56)
            }
        }
    }
}

struct SettingsView: View {
    @Binding var isPresented: Bool
    @EnvironmentObject private var appState: AppState
    @State private var darkModeEnabled = false
    @State private var notificationsEnabled = true
    @State private var language = "English"
    
    var body: some View {
        NavigationView {
            Form {
                Section(header: Text("Appearance")) {
                    Toggle("Dark Mode", isOn: $darkModeEnabled)
                }
                
                Section(header: Text("Notifications")) {
                    Toggle("Enable Notifications", isOn: $notificationsEnabled)
                }
                
                Section(header: Text("Language")) {
                    Picker("Language", selection: $language) {
                        Text("English").tag("English")
                        Text("Spanish").tag("Spanish")
                        Text("French").tag("French")
                        Text("German").tag("German")
                    }
                }
                
                Section(header: Text("Account")) {
                    Button("Change Password") {
                        // Navigate to change password
                    }
                    .foregroundColor(.primary)
                    
                    Button("Privacy Settings") {
                        // Navigate to privacy settings
                    }
                    .foregroundColor(.primary)
                    
                    Button("Delete Account") {
                        // Show delete account confirmation
                    }
                    .foregroundColor(.red)
                }
                
                Section {
                    Button("Logout") {
                        isPresented = false
                        appState.signOut()
                    }
                    .foregroundColor(.red)
                }
            }
            .navigationTitle("Settings")
            .navigationBarItems(leading: Button("Close") {
                isPresented = false
            })
        }
    }
}

// Helper extension for rounded corners
extension View {
    func cornerRadius(_ radius: CGFloat, corners: UIRectCorner) -> some View {
        clipShape(RoundedCorner(radius: radius, corners: corners))
    }
}

struct RoundedCorner: Shape {
    var radius: CGFloat = .infinity
    var corners: UIRectCorner = .allCorners

    func path(in rect: CGRect) -> Path {
        let path = UIBezierPath(roundedRect: rect, byRoundingCorners: corners, cornerRadii: CGSize(width: radius, height: radius))
        return Path(path.cgPath)
    }
}

// MARK: - Preview Provider
struct ContentView_Previews: PreviewProvider {
    static var previews: some View {
        ContentView()
            .environmentObject(AppState())
    }
}
