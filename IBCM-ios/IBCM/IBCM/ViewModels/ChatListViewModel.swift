import Foundation

@MainActor
class ChatListViewModel: ObservableObject {
    @Published var chats: [Chat] = []
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var showNewChat = false
    
    private var webSocketTask: URLSessionWebSocketTask?
    private let chatService = ChatService.shared
    
    func fetchChats() async {
        isLoading = true
        errorMessage = ""
        
        do {
            chats = try await chatService.getChats()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func startNewChat(with user: User) {
        Task {
            do {
                let request = CreateChatRequest(
                    participantIds: [user.id],
                    isGroup: false,
                    chatName: nil,
                    initialMessage: nil
                )
                
                let chat = try await chatService.createChat(request: request)
                chats.insert(chat, at: 0)
                showNewChat = false
            } catch {
                errorMessage = error.localizedDescription
                showError = true
            }
        }
    }
    
    func setupWebSocket() {
        guard let url = URL(string: "\(NetworkService.shared.baseURL)/ws/chats".replacingOccurrences(of: "http", with: "ws")) else { return }
        
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
                       let update = try? JSONDecoder().decode(ChatUpdate.self, from: data) {
                        Task { @MainActor in
                            self.handleChatUpdate(update)
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
                    
                    // Attempt to reconnect after a delay
                    try? await Task.sleep(nanoseconds: 5_000_000_000)
                    self.setupWebSocket()
                }
            }
        }
    }
    
    private func handleChatUpdate(_ update: ChatUpdate) {
        switch update.type {
        case .newMessage:
            if let chatId = update.chatId,
               let message = update.message,
               let index = chats.firstIndex(where: { $0.id == chatId }) {
                var updatedChat = chats[index]
                updatedChat.lastMessage = message
                updatedChat.unreadCount += 1
                chats.remove(at: index)
                chats.insert(updatedChat, at: 0)
            }
            
        case .messageRead:
            if let chatId = update.chatId,
               let index = chats.firstIndex(where: { $0.id == chatId }) {
                var updatedChat = chats[index]
                updatedChat.unreadCount = 0
                chats[index] = updatedChat
            }
            
        case .typing, .online:
            // These updates are handled in the chat detail view
            break
        }
    }
    
    deinit {
        webSocketTask?.cancel()
    }
} 