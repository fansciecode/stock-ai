import SwiftUI

struct NotificationsView: View {
    @StateObject private var viewModel = NotificationsViewModel()
    @State private var showPreferences = false
    
    var body: some View {
        List {
            if viewModel.notifications.isEmpty {
                if viewModel.isLoading {
                    ProgressView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ContentUnavailableView {
                        Label("No Notifications", systemImage: "bell.slash")
                    } description: {
                        Text("You don't have any notifications yet")
                    }
                }
            } else {
                ForEach(viewModel.notifications) { notification in
                    NotificationRow(notification: notification)
                        .contentShape(Rectangle())
                        .onTapGesture {
                            viewModel.handleNotificationTap(notification: notification)
                        }
                        .swipeActions(edge: .trailing) {
                            Button(role: .destructive) {
                                Task {
                                    await viewModel.deleteNotification(notificationId: notification.id)
                                }
                            } label: {
                                Label("Delete", systemImage: "trash")
                            }
                            
                            if !notification.isRead {
                                Button {
                                    Task {
                                        await viewModel.markAsRead(notificationId: notification.id)
                                    }
                                } label: {
                                    Label("Mark as Read", systemImage: "checkmark.circle")
                                }
                                .tint(.blue)
                            }
                        }
                }
            }
        }
        .navigationTitle("Notifications")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Menu {
                    Button {
                        Task {
                            await viewModel.markAllAsRead()
                        }
                    } label: {
                        Label("Mark All as Read", systemImage: "checkmark.circle")
                    }
                    
                    Button {
                        showPreferences = true
                    } label: {
                        Label("Preferences", systemImage: "gear")
                    }
                } label: {
                    Image(systemName: "ellipsis.circle")
                }
            }
        }
        .sheet(isPresented: $showPreferences) {
            NotificationPreferencesView(preferences: $viewModel.preferences)
        }
        .refreshable {
            await viewModel.loadNotifications()
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
        .task {
            await viewModel.loadNotifications()
        }
    }
}

struct NotificationRow: View {
    let notification: Notification
    
    var body: some View {
        HStack(spacing: 16) {
            NotificationIcon(type: notification.type)
            
            VStack(alignment: .leading, spacing: 4) {
                Text(notification.title)
                    .font(.headline)
                    .foregroundColor(notification.isRead ? .primary : .blue)
                
                Text(notification.message)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                Text(notification.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !notification.isRead {
                Circle()
                    .fill(.blue)
                    .frame(width: 8, height: 8)
            }
        }
        .padding(.vertical, 8)
    }
}

struct NotificationIcon: View {
    let type: NotificationType
    
    var body: some View {
        ZStack {
            Circle()
                .fill(iconColor.opacity(0.2))
                .frame(width: 40, height: 40)
            
            Image(systemName: iconName)
                .foregroundColor(iconColor)
        }
    }
    
    private var iconName: String {
        switch type {
        case .eventInvitation:
            return "calendar.badge.plus"
        case .eventUpdate:
            return "calendar.badge.exclamationmark"
        case .eventReminder:
            return "bell.badge"
        case .chatMessage:
            return "bubble.left.fill"
        case .friendRequest:
            return "person.badge.plus"
        case .system:
            return "gear"
        }
    }
    
    private var iconColor: Color {
        switch type {
        case .eventInvitation, .eventUpdate, .eventReminder:
            return .blue
        case .chatMessage:
            return .green
        case .friendRequest:
            return .purple
        case .system:
            return .gray
        }
    }
}

struct NotificationPreferencesView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var preferences: NotificationPreferences
    @StateObject private var viewModel = NotificationsViewModel()
    
    var body: some View {
        NavigationView {
            Form {
                Section("Push Notifications") {
                    Toggle("Event Invitations", isOn: $preferences.eventInvitations)
                    Toggle("Event Updates", isOn: $preferences.eventUpdates)
                    Toggle("Event Reminders", isOn: $preferences.eventReminders)
                    Toggle("Chat Messages", isOn: $preferences.chatMessages)
                    Toggle("Friend Requests", isOn: $preferences.friendRequests)
                    Toggle("System Notifications", isOn: $preferences.systemNotifications)
                }
                
                Section("Notification Channels") {
                    Toggle("Email Notifications", isOn: $preferences.emailNotifications)
                    Toggle("Push Notifications", isOn: $preferences.pushNotifications)
                }
            }
            .navigationTitle("Notification Settings")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Save") {
                        Task {
                            await viewModel.updatePreferences()
                            dismiss()
                        }
                    }
                }
            }
            .task {
                await viewModel.loadPreferences()
            }
        }
    }
}

#Preview {
    NavigationView {
        NotificationsView()
    }
} 