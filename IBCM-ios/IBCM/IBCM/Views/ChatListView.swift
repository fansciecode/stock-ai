import SwiftUI

struct ChatListView: View {
    @State private var searchText = ""
    
    // Sample data
    private let chats = [
        Chat(id: "1", name: "John Doe", lastMessage: "Hey, how are you?", time: "10:30 AM", unreadCount: 2),
        Chat(id: "2", name: "Jane Smith", lastMessage: "Are we still meeting tomorrow?", time: "9:15 AM", unreadCount: 0),
        Chat(id: "3", name: "Mike Johnson", lastMessage: "Thanks for your help!", time: "Yesterday", unreadCount: 0),
        Chat(id: "4", name: "Sarah Williams", lastMessage: "I'll send you the documents later", time: "Yesterday", unreadCount: 1),
        Chat(id: "5", name: "David Brown", lastMessage: "Let me know when you're free", time: "Monday", unreadCount: 0)
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

struct ChatListView_Previews: PreviewProvider {
    static var previews: some View {
        ChatListView()
    }
} 