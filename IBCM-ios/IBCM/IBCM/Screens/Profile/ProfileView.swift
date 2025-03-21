import SwiftUI
import PhotosUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Profile Header
                ProfileHeaderView(
                    user: appState.currentUser,
                    isEditing: viewModel.isEditing,
                    selectedImage: viewModel.selectedImage,
                    onEditTap: { viewModel.isEditing.toggle() },
                    onImageSelected: viewModel.updateProfileImage
                )
                
                // Profile Info
                if viewModel.isEditing {
                    ProfileEditForm(viewModel: viewModel)
                } else {
                    ProfileInfoView(user: appState.currentUser)
                }
                
                Divider()
                
                // Stats Section
                if appState.currentUser?.role == .business {
                    BusinessProfileStats(stats: viewModel.businessStats)
                } else {
                    UserProfileStats(stats: viewModel.userStats)
                }
                
                Divider()
                
                // Action Buttons
                ProfileActionButtons(
                    role: appState.currentUser?.role ?? .user,
                    onActionTap: viewModel.handleAction
                )
                
                // Settings
                ProfileSettingsSection()
                
                // Logout Button
                Button(action: {
                    Task {
                        await viewModel.logout()
                    }
                }) {
                    Text("Log Out")
                        .foregroundColor(.red)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.red.opacity(0.1))
                        .cornerRadius(10)
                }
                .padding(.horizontal)
            }
        }
        .navigationTitle("Profile")
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
        .onChange(of: viewModel.isLoggedOut) { isLoggedOut in
            if isLoggedOut {
                appState.isAuthenticated = false
                appState.currentUser = nil
            }
        }
    }
}

// MARK: - Profile Header View
struct ProfileHeaderView: View {
    let user: User?
    let isEditing: Bool
    let selectedImage: UIImage?
    let onEditTap: () -> Void
    let onImageSelected: (UIImage) -> Void
    
    @State private var showingImagePicker = false
    
    var body: some View {
        VStack {
            ZStack(alignment: .bottomTrailing) {
                if let selectedImage = selectedImage {
                    Image(uiImage: selectedImage)
                        .resizable()
                        .scaledToFill()
                        .frame(width: 120, height: 120)
                        .clipShape(Circle())
                } else {
                    AsyncImage(url: URL(string: user?.profileImage ?? "")) { image in
                        image
                            .resizable()
                            .scaledToFill()
                    } placeholder: {
                        Image(systemName: "person.circle.fill")
                            .resizable()
                            .foregroundColor(.gray)
                    }
                    .frame(width: 120, height: 120)
                    .clipShape(Circle())
                }
                
                if isEditing {
                    Button(action: { showingImagePicker = true }) {
                        Image(systemName: "camera.fill")
                            .foregroundColor(.white)
                            .padding(8)
                            .background(Color.blue)
                            .clipShape(Circle())
                    }
                }
            }
            
            HStack {
                Text(user?.fullName ?? "")
                    .font(.title2)
                    .fontWeight(.bold)
                
                Button(action: onEditTap) {
                    Image(systemName: isEditing ? "checkmark.circle.fill" : "pencil.circle.fill")
                        .foregroundColor(.blue)
                        .font(.title2)
                }
            }
            
            Text(user?.email ?? "")
                .foregroundColor(.secondary)
        }
        .sheet(isPresented: $showingImagePicker) {
            ImagePicker(image: Binding(
                get: { selectedImage },
                set: { if let image = $0 { onImageSelected(image) } }
            ))
        }
    }
}

// MARK: - Profile Edit Form
struct ProfileEditForm: View {
    @ObservedObject var viewModel: ProfileViewModel
    
    var body: some View {
        VStack(spacing: 15) {
            TextField("Full Name", text: $viewModel.fullName)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            TextField("Username", text: $viewModel.username)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            TextField("Phone Number", text: $viewModel.phoneNumber)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .keyboardType(.phonePad)
            
            Button(action: {
                Task {
                    await viewModel.updateProfile()
                }
            }) {
                if viewModel.isLoading {
                    ProgressView()
                } else {
                    Text("Save Changes")
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.blue)
                        .cornerRadius(10)
                }
            }
            .disabled(viewModel.isLoading)
        }
        .padding(.horizontal)
    }
}

// MARK: - Profile Info View
struct ProfileInfoView: View {
    let user: User?
    
    var body: some View {
        VStack(spacing: 15) {
            InfoRow(title: "Username", value: user?.username ?? "")
            InfoRow(title: "Phone", value: user?.phoneNumber ?? "Not provided")
            InfoRow(title: "Role", value: user?.role.rawValue.capitalized ?? "")
            InfoRow(title: "Member Since", value: user?.formattedJoinDate ?? "")
        }
        .padding(.horizontal)
    }
}

struct InfoRow: View {
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Text(title)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .fontWeight(.medium)
        }
    }
}

// MARK: - Profile Stats Views
struct BusinessProfileStats: View {
    let stats: BusinessStats
    
    var body: some View {
        VStack(spacing: 15) {
            Text("Business Statistics")
                .font(.headline)
            
            HStack {
                StatView(title: "Revenue", value: stats.formattedRevenue)
                StatView(title: "Orders", value: "\(stats.totalOrders)")
            }
            
            HStack {
                StatView(title: "Events", value: "\(stats.totalEvents)")
                StatView(title: "Customers", value: "\(stats.totalCustomers)")
            }
        }
        .padding()
    }
}

struct UserProfileStats: View {
    let stats: UserStats
    
    var body: some View {
        HStack {
            StatView(title: "Orders", value: "\(stats.totalOrders)")
            StatView(title: "Events", value: "\(stats.totalEvents)")
            StatView(title: "Reviews", value: "\(stats.totalReviews)")
        }
        .padding()
    }
}

struct StatView: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack(spacing: 5) {
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity)
    }
}

// MARK: - Profile Action Buttons
struct ProfileActionButtons: View {
    let role: UserRole
    let onActionTap: (ProfileAction) -> Void
    
    var body: some View {
        VStack(spacing: 10) {
            ForEach(ProfileAction.actions(for: role)) { action in
                Button(action: { onActionTap(action) }) {
                    HStack {
                        Image(systemName: action.iconName)
                            .foregroundColor(action.color)
                        Text(action.title)
                            .foregroundColor(.primary)
                        Spacer()
                        Image(systemName: "chevron.right")
                            .foregroundColor(.secondary)
                    }
                    .padding()
                    .background(Color.secondary.opacity(0.1))
                    .cornerRadius(10)
                }
            }
        }
        .padding(.horizontal)
    }
}

// MARK: - Profile Settings Section
struct ProfileSettingsSection: View {
    var body: some View {
        VStack(alignment: .leading, spacing: 15) {
            Text("Settings")
                .font(.headline)
                .padding(.horizontal)
            
            NavigationLink(destination: NotificationSettingsView()) {
                SettingsRow(title: "Notifications", icon: "bell.fill")
            }
            
            NavigationLink(destination: PrivacySettingsView()) {
                SettingsRow(title: "Privacy", icon: "lock.fill")
            }
            
            NavigationLink(destination: SecuritySettingsView()) {
                SettingsRow(title: "Security", icon: "shield.fill")
            }
        }
    }
}

struct SettingsRow: View {
    let title: String
    let icon: String
    
    var body: some View {
        HStack {
            Image(systemName: icon)
                .foregroundColor(.blue)
            Text(title)
                .foregroundColor(.primary)
            Spacer()
            Image(systemName: "chevron.right")
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            picker.dismiss(animated: true)
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { image, _ in
                    DispatchQueue.main.async {
                        self.parent.image = image as? UIImage
                    }
                }
            }
        }
    }
}

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ProfileView()
                .environmentObject(AppState())
        }
    }
} 