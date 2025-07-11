import SwiftUI
import PhotosUI

struct ProfileView: View {
    @StateObject private var viewModel = ProfileViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(spacing: 20) {
                    // Profile header
                    VStack(spacing: 15) {
                        // Profile image
                        Circle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(width: 120, height: 120)
                            .overlay(
                                Image(systemName: "person.fill")
                                    .resizable()
                                    .scaledToFit()
                                    .frame(width: 60, height: 60)
                                    .foregroundColor(.white)
                            )
                        
                        Text(viewModel.user?.name ?? "")
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(viewModel.user?.email ?? "")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        
                        if let location = viewModel.user?.location {
                            HStack {
                                Image(systemName: "location.fill")
                                    .foregroundColor(.secondary)
                                Text(location)
                                    .font(.subheadline)
                                    .foregroundColor(.secondary)
                            }
                        }
                        
                        if let bio = viewModel.user?.bio {
                            Text(bio)
                                .font(.body)
                                .multilineTextAlignment(.center)
                                .padding(.horizontal)
                                .padding(.top, 5)
                        }
                    }
                    .padding()
                    
                    // Profile options
                    VStack(spacing: 0) {
                        ProfileOptionRow(icon: "person.fill", title: "Edit Profile")
                        ProfileOptionRow(icon: "gear", title: "Settings")
                        ProfileOptionRow(icon: "bell.fill", title: "Notifications")
                        ProfileOptionRow(icon: "lock.fill", title: "Privacy")
                        ProfileOptionRow(icon: "questionmark.circle.fill", title: "Help & Support")
                        ProfileOptionRow(icon: "arrow.right.square.fill", title: "Logout", showDivider: false)
                    }
                    .background(Color.white)
                    .cornerRadius(10)
                    .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
                    .padding(.horizontal)
                }
                .padding(.vertical)
            }
            .navigationTitle("Profile")
            .navigationBarTitleDisplayMode(.inline)
        }
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

struct User {
    let name: String
    let email: String
    let bio: String?
    let location: String?
}

struct ProfileOptionRow: View {
    let icon: String
    let title: String
    var showDivider: Bool = true
    
    var body: some View {
        VStack(alignment: .leading) {
            Button(action: {
                // Handle option tap
            }) {
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

struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        ProfileView()
    }
} 