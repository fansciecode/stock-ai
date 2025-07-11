//
//  SecurityView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine
import LocalAuthentication

struct SecurityView: View {
    @StateObject private var viewModel = SecurityViewModel()
    @State private var showingChangePassword = false
    @State private var showingTwoFactorAuth = false
    @State private var showingSessionsView = false
    @State private var showingPrivacySettings = false
    @State private var showingDataExport = false
    @State private var showingAccountDeletion = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                // Security Status Section
                Section {
                    SecurityStatusCard(
                        securityScore: viewModel.securityScore,
                        recommendations: viewModel.securityRecommendations
                    )
                }

                // Authentication Section
                Section("Authentication") {
                    SecurityOptionRow(
                        icon: "key.fill",
                        title: "Change Password",
                        subtitle: "Last changed \(viewModel.passwordLastChanged)",
                        action: { showingChangePassword = true }
                    )

                    SecurityOptionRow(
                        icon: "shield.fill",
                        title: "Two-Factor Authentication",
                        subtitle: viewModel.twoFactorEnabled ? "Enabled" : "Disabled",
                        action: { showingTwoFactorAuth = true }
                    )

                    SecurityToggleRow(
                        icon: "touchid",
                        title: "Biometric Authentication",
                        subtitle: "Use Face ID or Touch ID to sign in",
                        isEnabled: $viewModel.biometricEnabled
                    )
                }

                // Session Management Section
                Section("Session Management") {
                    SecurityOptionRow(
                        icon: "desktopcomputer",
                        title: "Active Sessions",
                        subtitle: "\(viewModel.activeSessionsCount) active sessions",
                        action: { showingSessionsView = true }
                    )

                    SecurityToggleRow(
                        icon: "lock.circle",
                        title: "Auto-Lock",
                        subtitle: "Automatically lock app when inactive",
                        isEnabled: $viewModel.autoLockEnabled
                    )

                    if viewModel.autoLockEnabled {
                        Picker("Auto-Lock Timeout", selection: $viewModel.autoLockTimeout) {
                            ForEach(AutoLockTimeout.allCases, id: \.self) { timeout in
                                Text(timeout.displayName).tag(timeout)
                            }
                        }
                        .pickerStyle(SegmentedPickerStyle())
                        .padding(.horizontal)
                    }
                }

                // Privacy Section
                Section("Privacy & Data") {
                    SecurityOptionRow(
                        icon: "eye.slash.fill",
                        title: "Privacy Settings",
                        subtitle: "Control your data visibility",
                        action: { showingPrivacySettings = true }
                    )

                    SecurityToggleRow(
                        icon: "location.fill",
                        title: "Location Tracking",
                        subtitle: "Allow location-based features",
                        isEnabled: $viewModel.locationTrackingEnabled
                    )

                    SecurityToggleRow(
                        icon: "chart.bar.fill",
                        title: "Analytics",
                        subtitle: "Help improve the app with usage data",
                        isEnabled: $viewModel.analyticsEnabled
                    )

                    SecurityOptionRow(
                        icon: "square.and.arrow.down",
                        title: "Export Data",
                        subtitle: "Download your account data",
                        action: { showingDataExport = true }
                    )
                }

                // Account Security Section
                Section("Account Security") {
                    SecurityOptionRow(
                        icon: "exclamationmark.triangle.fill",
                        title: "Security Alerts",
                        subtitle: viewModel.securityAlertsEnabled ? "Enabled" : "Disabled",
                        action: { viewModel.toggleSecurityAlerts() }
                    )

                    SecurityOptionRow(
                        icon: "checkmark.shield.fill",
                        title: "Account Verification",
                        subtitle: viewModel.accountVerified ? "Verified" : "Pending",
                        action: { viewModel.requestAccountVerification() }
                    )

                    SecurityOptionRow(
                        icon: "trash.fill",
                        title: "Delete Account",
                        subtitle: "Permanently delete your account",
                        action: { showingAccountDeletion = true },
                        isDestructive: true
                    )
                }

                // Recent Activity Section
                Section("Recent Security Activity") {
                    ForEach(viewModel.recentSecurityEvents, id: \.id) { event in
                        SecurityEventRow(event: event)
                    }
                }
            }
            .navigationTitle("Security")
            .navigationBarItems(trailing: Button("Done") { dismiss() })
            .onAppear {
                viewModel.loadSecurityData()
            }
            .sheet(isPresented: $showingChangePassword) {
                ChangePasswordView()
            }
            .sheet(isPresented: $showingTwoFactorAuth) {
                TwoFactorAuthView(isEnabled: viewModel.twoFactorEnabled)
            }
            .sheet(isPresented: $showingSessionsView) {
                ActiveSessionsView()
            }
            .sheet(isPresented: $showingPrivacySettings) {
                PrivacySettingsView()
            }
            .sheet(isPresented: $showingDataExport) {
                DataExportView()
            }
            .alert("Delete Account", isPresented: $showingAccountDeletion) {
                Button("Cancel", role: .cancel) { }
                Button("Delete", role: .destructive) {
                    viewModel.deleteAccount()
                }
            } message: {
                Text("This action cannot be undone. All your data will be permanently deleted.")
            }
        }
    }
}

// MARK: - Security Status Card
struct SecurityStatusCard: View {
    let securityScore: Int
    let recommendations: [String]

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Security Score")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    Text("\(securityScore)/100")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(securityScoreColor)
                }

                Spacer()

                CircularProgressView(
                    progress: Double(securityScore) / 100.0,
                    color: securityScoreColor
                )
                .frame(width: 60, height: 60)
            }

            if !recommendations.isEmpty {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Recommendations")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    ForEach(recommendations.prefix(3), id: \.self) { recommendation in
                        HStack {
                            Image(systemName: "exclamationmark.circle.fill")
                                .foregroundColor(.orange)
                                .font(.caption)

                            Text(recommendation)
                                .font(.caption)
                                .foregroundColor(.primary)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }

    private var securityScoreColor: Color {
        switch securityScore {
        case 0..<50:
            return .red
        case 50..<75:
            return .orange
        case 75..<90:
            return .yellow
        default:
            return .green
        }
    }
}

// MARK: - Security Option Row
struct SecurityOptionRow: View {
    let icon: String
    let title: String
    let subtitle: String
    let action: () -> Void
    let isDestructive: Bool

    init(icon: String, title: String, subtitle: String, action: @escaping () -> Void, isDestructive: Bool = false) {
        self.icon = icon
        self.title = title
        self.subtitle = subtitle
        self.action = action
        self.isDestructive = isDestructive
    }

    var body: some View {
        Button(action: action) {
            HStack {
                Image(systemName: icon)
                    .foregroundColor(isDestructive ? .red : .blue)
                    .font(.title2)
                    .frame(width: 24, height: 24)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.body)
                        .foregroundColor(isDestructive ? .red : .primary)

                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: "chevron.right")
                    .foregroundColor(.secondary)
                    .font(.caption)
            }
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Security Toggle Row
struct SecurityToggleRow: View {
    let icon: String
    let title: String
    let subtitle: String
    @Binding var isEnabled: Bool

    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
                .font(.title2)
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.body)
                    .foregroundColor(.primary)

                Text(subtitle)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Toggle("", isOn: $isEnabled)
                .labelsHidden()
        }
    }
}

// MARK: - Security Event Row
struct SecurityEventRow: View {
    let event: SecurityEvent

    var body: some View {
        HStack {
            Image(systemName: event.icon)
                .foregroundColor(event.color)
                .font(.title3)
                .frame(width: 24, height: 24)

            VStack(alignment: .leading, spacing: 2) {
                Text(event.title)
                    .font(.body)
                    .foregroundColor(.primary)

                Text(event.description)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            Text(event.timestamp, style: .relative)
                .font(.caption)
                .foregroundColor(.secondary)
        }
    }
}

// MARK: - Circular Progress View
struct CircularProgressView: View {
    let progress: Double
    let color: Color

    var body: some View {
        ZStack {
            Circle()
                .stroke(color.opacity(0.3), lineWidth: 4)

            Circle()
                .trim(from: 0, to: progress)
                .stroke(color, style: StrokeStyle(lineWidth: 4, lineCap: .round))
                .rotationEffect(.degrees(-90))
                .animation(.easeInOut(duration: 1.0), value: progress)

            Text("\(Int(progress * 100))%")
                .font(.caption)
                .fontWeight(.semibold)
                .foregroundColor(color)
        }
    }
}

// MARK: - Change Password View
struct ChangePasswordView: View {
    @State private var currentPassword = ""
    @State private var newPassword = ""
    @State private var confirmPassword = ""
    @State private var isLoading = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Change Password")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.top)

                VStack(spacing: 16) {
                    SecureField("Current Password", text: $currentPassword)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    SecureField("New Password", text: $newPassword)
                        .textFieldStyle(RoundedBorderTextFieldStyle())

                    SecureField("Confirm New Password", text: $confirmPassword)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                }

                Button(action: {
                    changePassword()
                }) {
                    HStack {
                        if isLoading {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        }

                        Text("Change Password")
                            .font(.headline)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .cornerRadius(12)
                }
                .disabled(!isFormValid || isLoading)

                Spacer()
            }
            .padding()
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() }
            )
        }
    }

    private var isFormValid: Bool {
        !currentPassword.isEmpty &&
        !newPassword.isEmpty &&
        !confirmPassword.isEmpty &&
        newPassword == confirmPassword &&
        newPassword.count >= 8
    }

    private func changePassword() {
        isLoading = true

        // Simulate password change
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            isLoading = false
            dismiss()
        }
    }
}

// MARK: - Two Factor Auth View
struct TwoFactorAuthView: View {
    let isEnabled: Bool
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                Text("Two-Factor Authentication")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .multilineTextAlignment(.center)
                    .padding(.top)

                Image(systemName: "shield.checkered")
                    .font(.system(size: 80))
                    .foregroundColor(.blue)
                    .padding()

                Text(isEnabled ? "2FA is currently enabled for your account." : "Secure your account with two-factor authentication.")
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .foregroundColor(.secondary)

                Button(action: {
                    // Toggle 2FA
                    dismiss()
                }) {
                    Text(isEnabled ? "Disable 2FA" : "Enable 2FA")
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isEnabled ? Color.red : Color.blue)
                        .cornerRadius(12)
                }

                Spacer()
            }
            .padding()
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() }
            )
        }
    }
}

// MARK: - Active Sessions View
struct ActiveSessionsView: View {
    @StateObject private var viewModel = ActiveSessionsViewModel()
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.sessions, id: \.id) { session in
                    ActiveSessionRow(session: session) {
                        viewModel.terminateSession(session.id)
                    }
                }
            }
            .navigationTitle("Active Sessions")
            .navigationBarItems(
                leading: Button("Done") { dismiss() },
                trailing: Button("Terminate All") {
                    viewModel.terminateAllSessions()
                }
            )
            .onAppear {
                viewModel.loadSessions()
            }
        }
    }
}

// MARK: - Privacy Settings View
struct PrivacySettingsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack {
                Text("Privacy Settings")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding()

                // Privacy settings content would go here

                Spacer()
            }
            .navigationBarItems(
                leading: Button("Done") { dismiss() }
            )
        }
    }
}

// MARK: - Data Export View
struct DataExportView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack {
                Text("Export Data")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding()

                // Data export content would go here

                Spacer()
            }
            .navigationBarItems(
                leading: Button("Done") { dismiss() }
            )
        }
    }
}

// MARK: - Models and Enums
enum AutoLockTimeout: String, CaseIterable {
    case never = "never"
    case oneMinute = "1min"
    case fiveMinutes = "5min"
    case fifteenMinutes = "15min"
    case oneHour = "1hour"

    var displayName: String {
        switch self {
        case .never: return "Never"
        case .oneMinute: return "1 minute"
        case .fiveMinutes: return "5 minutes"
        case .fifteenMinutes: return "15 minutes"
        case .oneHour: return "1 hour"
        }
    }
}

struct SecurityEvent: Identifiable {
    let id = UUID()
    let title: String
    let description: String
    let timestamp: Date
    let icon: String
    let color: Color
}

struct ActiveSession: Identifiable {
    let id = UUID()
    let deviceName: String
    let location: String
    let lastActive: Date
    let isCurrent: Bool
}

struct ActiveSessionRow: View {
    let session: ActiveSession
    let onTerminate: () -> Void

    var body: some View {
        HStack {
            VStack(alignment: .leading, spacing: 4) {
                Text(session.deviceName)
                    .font(.body)
                    .fontWeight(.medium)

                Text(session.location)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text("Last active: \(session.lastActive, style: .relative)")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }

            Spacer()

            if session.isCurrent {
                Text("Current")
                    .font(.caption)
                    .foregroundColor(.green)
                    .padding(.horizontal, 8)
                    .padding(.vertical, 4)
                    .background(Color.green.opacity(0.2))
                    .cornerRadius(4)
            } else {
                Button("Terminate") {
                    onTerminate()
                }
                .font(.caption)
                .foregroundColor(.red)
            }
        }
    }
}

// MARK: - View Models
class SecurityViewModel: ObservableObject {
    @Published var securityScore = 75
    @Published var securityRecommendations = ["Enable two-factor authentication", "Use a stronger password"]
    @Published var passwordLastChanged = "3 months ago"
    @Published var twoFactorEnabled = false
    @Published var biometricEnabled = true
    @Published var activeSessionsCount = 3
    @Published var autoLockEnabled = true
    @Published var autoLockTimeout: AutoLockTimeout = .fiveMinutes
    @Published var locationTrackingEnabled = true
    @Published var analyticsEnabled = true
    @Published var securityAlertsEnabled = true
    @Published var accountVerified = true
    @Published var recentSecurityEvents: [SecurityEvent] = []

    func loadSecurityData() {
        // Simulate loading security data
        recentSecurityEvents = [
            SecurityEvent(
                title: "Login from new device",
                description: "iPhone 14 Pro • San Francisco, CA",
                timestamp: Date().addingTimeInterval(-3600),
                icon: "iphone",
                color: .blue
            ),
            SecurityEvent(
                title: "Password changed",
                description: "Your password was successfully updated",
                timestamp: Date().addingTimeInterval(-86400),
                icon: "key.fill",
                color: .green
            ),
            SecurityEvent(
                title: "2FA enabled",
                description: "Two-factor authentication was enabled",
                timestamp: Date().addingTimeInterval(-259200),
                icon: "shield.fill",
                color: .green
            )
        ]
    }

    func toggleSecurityAlerts() {
        securityAlertsEnabled.toggle()
    }

    func requestAccountVerification() {
        // Handle account verification request
    }

    func deleteAccount() {
        // Handle account deletion
    }
}

class ActiveSessionsViewModel: ObservableObject {
    @Published var sessions: [ActiveSession] = []

    func loadSessions() {
        sessions = [
            ActiveSession(
                deviceName: "iPhone 14 Pro",
                location: "San Francisco, CA",
                lastActive: Date(),
                isCurrent: true
            ),
            ActiveSession(
                deviceName: "MacBook Pro",
                location: "San Francisco, CA",
                lastActive: Date().addingTimeInterval(-3600),
                isCurrent: false
            ),
            ActiveSession(
                deviceName: "iPad Air",
                location: "Los Angeles, CA",
                lastActive: Date().addingTimeInterval(-86400),
                isCurrent: false
            )
        ]
    }

    func terminateSession(_ sessionId: UUID) {
        sessions.removeAll { $0.id == sessionId }
    }

    func terminateAllSessions() {
        sessions.removeAll { !$0.isCurrent }
    }
}

#Preview {
    SecurityView()
}
