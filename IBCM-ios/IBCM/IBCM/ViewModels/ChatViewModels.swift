import SwiftUI

// MARK: - Chat List View Model
@MainActor
class ChatListViewModel: ObservableObject {
    @Published var conversations: [Conversation] = []
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var showNewChat = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    
    func fetchConversations() async {
        do {
            isLoading = true
            let response: ConversationsResponse = try await NetworkService.shared.request(
                endpoint: "/chat/conversations",
                method: "GET"
            )
            conversations = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    func setupWebSocket() {
        guard let url = URL(string: "wss://your-backend-url/chat") else { return }
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let chatUpdate = try? JSONDecoder().decode(ChatUpdate.self, from: data) {
                        Task { @MainActor in
                            self.handleChatUpdate(chatUpdate)
                        }
                    }
                default:
                    break
                }
                self.receiveMessage()
                
            case .failure(let error):
                Task { @MainActor in
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
    
    private func handleChatUpdate(_ update: ChatUpdate) {
        switch update.type {
        case .newMessage:
            if let conversationId = update.conversationId,
               let index = conversations.firstIndex(where: { $0.id == conversationId }) {
                conversations[index].lastMessage = update.message
                conversations[index].unreadCount += 1
                
                // Move conversation to top
                let conversation = conversations.remove(at: index)
                conversations.insert(conversation, at: 0)
            }
        case .read:
            if let conversationId = update.conversationId,
               let index = conversations.firstIndex(where: { $0.id == conversationId }) {
                conversations[index].unreadCount = 0
            }
        }
    }
    
    func startNewChat(with user: User) {
        Task {
            do {
                let response: ConversationResponse = try await NetworkService.shared.request(
                    endpoint: "/chat/conversations",
                    method: "POST",
                    body: try JSONEncoder().encode(["userId": user.id])
                )
                
                if let index = conversations.firstIndex(where: { $0.id == response.data.id }) {
                    conversations[index] = response.data
                } else {
                    conversations.insert(response.data, at: 0)
                }
                
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
}

// MARK: - New Chat View Model
@MainActor
class NewChatViewModel: ObservableObject {
    @Published var searchText = ""
    @Published var searchResults: [User] = []
    @Published var recentUsers: [User] = []
    
    var searchTask: Task<Void, Never>?
    
    init() {
        fetchRecentUsers()
        setupSearchSubscription()
    }
    
    private func setupSearchSubscription() {
        Task {
            for await text in $searchText.values {
                searchTask?.cancel()
                
                if text.isEmpty {
                    searchResults = []
                    continue
                }
                
                searchTask = Task {
                    await searchUsers(query: text)
                }
            }
        }
    }
    
    private func searchUsers(query: String) async {
        do {
            let response: UsersResponse = try await NetworkService.shared.request(
                endpoint: "/users/search?q=\(query)",
                method: "GET"
            )
            searchResults = response.data
        } catch {
            // Handle error
        }
    }
    
    private func fetchRecentUsers() {
        Task {
            do {
                let response: UsersResponse = try await NetworkService.shared.request(
                    endpoint: "/chat/recent-users",
                    method: "GET"
                )
                recentUsers = response.data
            } catch {
                // Handle error
            }
        }
    }
}

// MARK: - Chat Detail View Model
@MainActor
class ChatDetailViewModel: ObservableObject {
    let conversation: Conversation
    
    @Published var messages: [Message] = []
    @Published var messageText = ""
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var showAttachmentOptions = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    
    var canSendMessage: Bool {
        !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty
    }
    
    init(conversation: Conversation) {
        self.conversation = conversation
    }
    
    func loadMessages() async {
        do {
            isLoading = true
            let response: MessagesResponse = try await NetworkService.shared.request(
                endpoint: "/chat/\(conversation.id)/messages",
                method: "GET"
            )
            messages = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        isLoading = false
    }
    
    func sendMessage() async {
        guard canSendMessage else { return }
        
        let text = messageText
        messageText = ""
        
        do {
            let message = Message(
                id: UUID().uuidString,
                conversationId: conversation.id,
                senderId: conversation.otherUser.id,
                content: text,
                type: .text,
                createdAt: Date()
            )
            
            messages.append(message)
            
            let _: MessageResponse = try await NetworkService.shared.request(
                endpoint: "/chat/\(conversation.id)/messages",
                method: "POST",
                body: try JSONEncoder().encode([
                    "content": text,
                    "type": "text"
                ])
            )
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func handleAttachment(_ type: AttachmentType) {
        switch type {
        case .photo:
            // Handle photo selection
            break
        case .camera:
            // Handle camera
            break
        case .file:
            // Handle file selection
            break
        }
    }
    
    func setupWebSocket() {
        guard let url = URL(string: "wss://your-backend-url/chat/\(conversation.id)") else { return }
        let session = URLSession(configuration: .default)
        webSocketTask = session.webSocketTask(with: url)
        webSocketTask?.resume()
        receiveMessage()
    }
    
    private func receiveMessage() {
        webSocketTask?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let chatMessage = try? JSONDecoder().decode(Message.self, from: data) {
                        Task { @MainActor in
                            self.messages.append(chatMessage)
                        }
                    }
                default:
                    break
                }
                self.receiveMessage()
                
            case .failure(let error):
                Task { @MainActor in
                    self.errorMessage = error.localizedDescription
                    self.showError = true
                }
            }
        }
    }
}

// MARK: - Chat Info View Model
@MainActor
class ChatInfoViewModel: ObservableObject {
    let conversation: Conversation
    
    @Published var sharedMedia: [SharedMedia] = []
    @Published var errorMessage = ""
    @Published var showError = false
    
    init(conversation: Conversation) {
        self.conversation = conversation
        loadSharedMedia()
    }
    
    private func loadSharedMedia() {
        Task {
            do {
                let response: SharedMediaResponse = try await NetworkService.shared.request(
                    endpoint: "/chat/\(conversation.id)/media",
                    method: "GET"
                )
                sharedMedia = response.data
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
    
    func clearChat() {
        Task {
            do {
                let _: MessageResponse = try await NetworkService.shared.request(
                    endpoint: "/chat/\(conversation.id)",
                    method: "DELETE"
                )
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
    
    func blockUser() {
        Task {
            do {
                let _: MessageResponse = try await NetworkService.shared.request(
                    endpoint: "/users/block/\(conversation.otherUser.id)",
                    method: "POST"
                )
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
}

// MARK: - Models
struct Conversation: Identifiable, Codable {
    let id: String
    let otherUser: User
    var lastMessage: Message?
    var unreadCount: Int
    
    static var preview: Conversation {
        Conversation(
            id: "1",
            otherUser: User.preview,
            lastMessage: Message.preview,
            unreadCount: 2
        )
    }
}

struct Message: Identifiable, Codable {
    let id: String
    let conversationId: String
    let senderId: String
    let content: String
    let type: MessageType
    let createdAt: Date
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
    
    static var preview: Message {
        Message(
            id: "1",
            conversationId: "1",
            senderId: "2",
            content: "Hello!",
            type: .text,
            createdAt: Date()
        )
    }
}

enum MessageType: String, Codable {
    case text
    case image
    case file
}

enum AttachmentType {
    case photo
    case camera
    case file
}

struct SharedMedia: Identifiable, Codable {
    let id: String
    let url: String
    let type: MessageType
    let createdAt: Date
}

struct ChatUpdate: Codable {
    let type: ChatUpdateType
    let conversationId: String?
    let message: Message?
}

enum ChatUpdateType: String, Codable {
    case newMessage
    case read
}

// MARK: - Response Types
struct ConversationsResponse: Codable {
    let success: Bool
    let data: [Conversation]
    let message: String?
}

struct ConversationResponse: Codable {
    let success: Bool
    let data: Conversation
    let message: String?
}

struct MessagesResponse: Codable {
    let success: Bool
    let data: [Message]
    let message: String?
}

struct UsersResponse: Codable {
    let success: Bool
    let data: [User]
    let message: String?
}

struct SharedMediaResponse: Codable {
    let success: Bool
    let data: [SharedMedia]
    let message: String?
}

struct MessageResponse: Codable {
    let success: Bool
    let data: Message
    let message: String?
} 