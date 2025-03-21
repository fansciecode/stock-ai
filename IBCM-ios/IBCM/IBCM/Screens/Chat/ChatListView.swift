import SwiftUI

struct ChatListView: View {
    @StateObject private var viewModel = ChatListViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        List {
            ForEach(viewModel.chats) { chat in
                NavigationLink(destination: ChatDetailView(chat: chat)) {
                    ChatRowView(chat: chat)
                }
            }
        }
        .listStyle(PlainListStyle())
        .refreshable {
            await viewModel.fetchChats()
        }
        .overlay {
            if viewModel.isLoading && viewModel.chats.isEmpty {
                ProgressView()
            } else if viewModel.chats.isEmpty {
                ContentUnavailableView(
                    "No Messages",
                    systemImage: "bubble.left.and.bubble.right",
                    description: Text("Start a conversation by tapping the compose button")
                )
            }
        }
        .navigationTitle("Messages")
        .toolbar {
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: { viewModel.showNewChat = true }) {
                    Image(systemName: "square.and.pencil")
                }
            }
        }
        .sheet(isPresented: $viewModel.showNewChat) {
            NewChatView(onUserSelected: { user in
                viewModel.startNewChat(with: user)
            })
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
        .task {
            await viewModel.fetchChats()
            viewModel.setupWebSocket()
        }
    }
}

struct ChatRowView: View {
    let chat: Chat
    
    var body: some View {
        HStack(spacing: 12) {
            // Profile Picture
            AsyncImage(url: URL(string: chat.participants.first?.profilePictureUrl ?? "")) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Image(systemName: chat.isGroupChat ? "person.3.fill" : "person.circle.fill")
                    .resizable()
                    .foregroundColor(.gray)
            }
            .frame(width: 50, height: 50)
            .clipShape(Circle())
            
            // Chat Info
            VStack(alignment: .leading, spacing: 4) {
                HStack {
                    Text(chat.displayName)
                        .font(.headline)
                    
                    Spacer()
                    
                    if let lastMessage = chat.lastMessage {
                        Text(lastMessage.formattedTime)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                HStack {
                    if let lastMessage = chat.lastMessage {
                        Text(lastMessage.content)
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                    
                    Spacer()
                    
                    if chat.unreadCount > 0 {
                        Text("\(chat.unreadCount)")
                            .font(.caption)
                            .foregroundColor(.white)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color.blue)
                            .clipShape(Capsule())
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
}

struct NewChatView: View {
    @Environment(\.dismiss) private var dismiss
    @StateObject private var searchViewModel = UserSearchViewModel()
    let onUserSelected: (User) -> Void
    
    var body: some View {
        NavigationView {
            List {
                ForEach(searchViewModel.users) { user in
                    Button {
                        onUserSelected(user)
                        dismiss()
                    } label: {
                        UserRowView(user: user)
                    }
                }
            }
            .listStyle(PlainListStyle())
            .searchable(
                text: $searchViewModel.searchQuery,
                prompt: "Search users"
            )
            .overlay {
                if searchViewModel.isLoading {
                    ProgressView()
                } else if searchViewModel.users.isEmpty && !searchViewModel.searchQuery.isEmpty {
                    ContentUnavailableView(
                        "No Users Found",
                        systemImage: "person.slash",
                        description: Text("Try a different search term")
                    )
                }
            }
            .navigationTitle("New Chat")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .alert("Error", isPresented: $searchViewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(searchViewModel.errorMessage)
            }
        }
    }
}

struct UserRowView: View {
    let user: User
    
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: user.profilePictureUrl ?? "")) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Image(systemName: "person.circle.fill")
                    .resizable()
                    .foregroundColor(.gray)
            }
            .frame(width: 40, height: 40)
            .clipShape(Circle())
            
            VStack(alignment: .leading, spacing: 4) {
                Text(user.name)
                    .font(.headline)
                
                if let bio = user.bio {
                    Text(bio)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
        }
        .padding(.vertical, 4)
    }
}

#Preview {
    NavigationView {
        ChatListView()
            .environmentObject(AppState())
    }
} 