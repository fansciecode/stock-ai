import SwiftUI

struct SettingsView: View {
    @StateObject private var viewModel = SettingsViewModel()
    @State private var showingLogoutAlert = false
    var onNavigateBack: () -> Void
    var onLogout: () -> Void
    var authViewModel: AuthViewModel
    
    var body: some View {
        NavigationView {
            List {
                // Appearance Section
                Section(header: Text("Appearance")) {
                    NavigationLink(destination: AppearanceSettingsView(viewModel: viewModel)) {
                        SettingsRow(
                            icon: "paintbrush",
                            title: "Appearance",
                            subtitle: "Theme, font size, and colors"
                        )
                    }
                }
                
                // Notifications Section
                Section(header: Text("Notifications")) {
                    NavigationLink(destination: NotificationSettingsView(viewModel: viewModel)) {
                        SettingsRow(
                            icon: "bell",
                            title: "Notifications",
                            subtitle: "Events, messages, and updates"
                        )
                    }
                }
                
                // Privacy Section
                Section(header: Text("Privacy")) {
                    NavigationLink(destination: PrivacySettingsView(viewModel: viewModel)) {
                        SettingsRow(
                            icon: "lock",
                            title: "Privacy",
                            subtitle: "Profile visibility and permissions"
                        )
                    }
                }
                
                // Location Section
                Section(header: Text("Location")) {
                    NavigationLink(destination: LocationSettingsView(viewModel: viewModel)) {
                        SettingsRow(
                            icon: "location",
                            title: "Location",
                            subtitle: "Location sharing and units"
                        )
                    }
                }
                
                // Language Section
                Section(header: Text("Language")) {
                    NavigationLink(destination: LanguageSettingsView(viewModel: viewModel)) {
                        SettingsRow(
                            icon: "globe",
                            title: "Language",
                            subtitle: "App language preferences"
                        )
                    }
                }
                
                // Account Section
                Section {
                    Button(action: { showingLogoutAlert = true }) {
                        SettingsRow(
                            icon: "rectangle.portrait.and.arrow.right",
                            title: "Log Out",
                            subtitle: "Sign out of your account",
                            showDisclosure: false,
                            destructive: true
                        )
                    }
                }
            }
            .navigationTitle("Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button(action: onNavigateBack) {
                        Image(systemName: "arrow.left")
                            .foregroundColor(.primary)
                    }
                }
            }
            .refreshable {
                await viewModel.loadSettings()
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
            .alert("Log Out", isPresented: $showingLogoutAlert) {
                Button("Cancel", role: .cancel) {}
                Button("Log Out", role: .destructive) {
                    logout()
                }
            } message: {
                Text("Are you sure you want to log out?")
            }
        }
        .navigationBarHidden(true)
    }
    
    private func logout() {
        Task {
            do {
                try await authViewModel.logout()
                onLogout()
            } catch {
                viewModel.showError = true
                viewModel.errorMessage = "Failed to log out: \(error.localizedDescription)"
            }
        }
    }
}

struct SettingsRow: View {
    let icon: String
    let title: String
    let subtitle: String
    var showDisclosure: Bool = true
    var destructive: Bool = false
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(destructive ? .red : .accentColor)
                .frame(width: 24, height: 24)
            
            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .foregroundColor(destructive ? .red : .primary)
                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if showDisclosure {
                Spacer()
                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .padding(.vertical, 4)
    }
}

struct AppearanceSettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            Section(header: Text("Theme")) {
                Toggle("Dark Theme", isOn: Binding(
                    get: { viewModel.settings.appearance.darkThemeEnabled },
                    set: { _ in viewModel.toggleDarkTheme() }
                ))
                
                Picker("Color Scheme", selection: Binding(
                    get: { viewModel.settings.appearance.colorScheme },
                    set: { viewModel.setColorScheme($0) }
                )) {
                    ForEach(AppearanceSettings.ColorScheme.allCases, id: \.self) { scheme in
                        Text(scheme.rawValue.capitalized).tag(scheme)
                    }
                }
            }
            
            Section(header: Text("Text Size")) {
                Picker("Font Size", selection: Binding(
                    get: { viewModel.settings.appearance.fontSize },
                    set: { viewModel.setFontSize($0) }
                )) {
                    ForEach(AppearanceSettings.FontSize.allCases, id: \.self) { size in
                        Text(size.rawValue.capitalized).tag(size)
                    }
                }
            }
        }
        .navigationTitle("Appearance")
    }
}

struct NotificationSettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            Section(header: Text("Event Notifications")) {
                Toggle("Event Reminders", isOn: Binding(
                    get: { viewModel.settings.notifications.eventRemindersEnabled },
                    set: { _ in viewModel.toggleEventReminders() }
                ))
                Toggle("Event Updates", isOn: Binding(
                    get: { viewModel.settings.notifications.eventUpdatesEnabled },
                    set: { _ in viewModel.toggleEventUpdates() }
                ))
            }
            
            Section(header: Text("Social Notifications")) {
                Toggle("Comments", isOn: Binding(
                    get: { viewModel.settings.notifications.commentNotificationsEnabled },
                    set: { _ in viewModel.toggleCommentNotifications() }
                ))
                Toggle("Chat Messages", isOn: Binding(
                    get: { viewModel.settings.notifications.chatNotificationsEnabled },
                    set: { _ in viewModel.toggleChatNotifications() }
                ))
            }
            
            Section(header: Text("Notification Methods")) {
                Toggle("Push Notifications", isOn: Binding(
                    get: { viewModel.settings.notifications.pushNotificationsEnabled },
                    set: { _ in viewModel.togglePushNotifications() }
                ))
                Toggle("Email Notifications", isOn: Binding(
                    get: { viewModel.settings.notifications.emailNotificationsEnabled },
                    set: { _ in viewModel.toggleEmailNotifications() }
                ))
            }
        }
        .navigationTitle("Notifications")
    }
}

struct PrivacySettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            Section(header: Text("Profile Privacy")) {
                Picker("Profile Visibility", selection: Binding(
                    get: { viewModel.settings.privacy.profileVisibility },
                    set: { viewModel.setProfileVisibility($0) }
                )) {
                    ForEach(PrivacySettings.ProfileVisibility.allCases, id: \.self) { visibility in
                        Text(visibility.rawValue.capitalized).tag(visibility)
                    }
                }
                
                Toggle("Show Location", isOn: Binding(
                    get: { viewModel.settings.privacy.showLocation },
                    set: { _ in viewModel.toggleShowLocation() }
                ))
                
                Toggle("Show Online Status", isOn: Binding(
                    get: { viewModel.settings.privacy.showOnlineStatus },
                    set: { _ in viewModel.toggleOnlineStatus() }
                ))
            }
            
            Section(header: Text("Social Privacy")) {
                Toggle("Allow Friend Requests", isOn: Binding(
                    get: { viewModel.settings.privacy.allowFriendRequests },
                    set: { _ in viewModel.toggleFriendRequests() }
                ))
                
                Toggle("Messages from Non-Friends", isOn: Binding(
                    get: { viewModel.settings.privacy.allowMessagesFromNonFriends },
                    set: { _ in viewModel.toggleMessagesFromNonFriends() }
                ))
            }
        }
        .navigationTitle("Privacy")
    }
}

struct LocationSettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    var body: some View {
        Form {
            Section(header: Text("Location Services")) {
                Toggle("Enable Location", isOn: Binding(
                    get: { viewModel.settings.location.locationEnabled },
                    set: { _ in viewModel.toggleLocationEnabled() }
                ))
                
                Toggle("Share Location", isOn: Binding(
                    get: { viewModel.settings.location.shareLocation },
                    set: { _ in viewModel.toggleShareLocation() }
                ))
                .disabled(!viewModel.settings.location.locationEnabled)
            }
            
            Section(header: Text("Display")) {
                Picker("Distance Unit", selection: Binding(
                    get: { viewModel.settings.location.distanceUnit },
                    set: { viewModel.setDistanceUnit($0) }
                )) {
                    ForEach(LocationSettings.DistanceUnit.allCases, id: \.self) { unit in
                        Text(unit.rawValue.capitalized).tag(unit)
                    }
                }
            }
        }
        .navigationTitle("Location")
    }
}

struct LanguageSettingsView: View {
    @ObservedObject var viewModel: SettingsViewModel
    
    let languages = [
        "en": "English",
        "es": "Español",
        "fr": "Français",
        "de": "Deutsch",
        "it": "Italiano",
        "pt": "Português",
        "ja": "日本語",
        "ko": "한국어",
        "zh": "中文"
    ]
    
    var body: some View {
        Form {
            Section(header: Text("App Language")) {
                Picker("Language", selection: Binding(
                    get: { viewModel.settings.language },
                    set: { viewModel.setLanguage($0) }
                )) {
                    ForEach(languages.sorted(by: { $0.value < $1.value }), id: \.key) { key, value in
                        Text(value).tag(key)
                    }
                }
            }
        }
        .navigationTitle("Language")
    }
}

struct SettingsView_Previews: PreviewProvider {
    static var previews: some View {
        SettingsView(
            onNavigateBack: {},
            onLogout: {},
            authViewModel: AuthViewModel()
        )
    }
} 