import Foundation

class ChatService {
    static let shared = ChatService()
    private var webSocketTasks: [String: URLSessionWebSocketTask] = [:]
    private let baseURL = NetworkService.shared.baseURL
    
    private init() {}
    
    // MARK: - Chat Management
    func getChats() async throws -> [Chat] {
        let response: ChatsResponse = try await NetworkService.shared.request(
            endpoint: "/chats",
            method: "GET"
        )
        return response.data
    }
    
    func createChat(request: CreateChatRequest) async throws -> Chat {
        let response: ChatResponse = try await NetworkService.shared.request(
            endpoint: "/chats",
            method: "POST",
            body: try JSONEncoder().encode(request)
        )
        return response.data
    }
    
    func getChat(id: String) async throws -> Chat {
        let response: ChatResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(id)",
            method: "GET"
        )
        return response.data
    }
    
    // MARK: - Message Management
    func getMessages(chatId: String) async throws -> [Message] {
        let response: MessagesResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(id)/messages",
            method: "GET"
        )
        return response.data
    }
    
    func sendMessage(chatId: String, request: SendMessageRequest) async throws -> Message {
        let response: MessageResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/messages",
            method: "POST",
            body: try JSONEncoder().encode(request)
        )
        return response.data
    }
    
    func markMessageAsRead(chatId: String, messageId: String) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/messages/\(messageId)/read",
            method: "POST"
        )
    }
    
    func deleteMessage(chatId: String, messageId: String) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/messages/\(messageId)",
            method: "DELETE"
        )
    }
    
    // MARK: - WebSocket Management
    func connectToChat(chatId: String, onReceive: @escaping (Result<ChatUpdate, Error>) -> Void) {
        guard let url = URL(string: "\(baseURL)/ws/chat/\(chatId)".replacingOccurrences(of: "http", with: "ws")) else { return }
        
        let session = URLSession(configuration: .default)
        let webSocketTask = session.webSocketTask(with: url)
        
        webSocketTasks[chatId] = webSocketTask
        webSocketTask.resume()
        
        receiveMessage(chatId: chatId, onReceive: onReceive)
    }
    
    func disconnectFromChat(chatId: String) {
        webSocketTasks[chatId]?.cancel()
        webSocketTasks.removeValue(forKey: chatId)
    }
    
    private func receiveMessage(chatId: String, onReceive: @escaping (Result<ChatUpdate, Error>) -> Void) {
        guard let webSocketTask = webSocketTasks[chatId] else { return }
        
        webSocketTask.receive { [weak self] result in
            switch result {
            case .success(let message):
                switch message {
                case .string(let text):
                    if let data = text.data(using: .utf8),
                       let update = try? JSONDecoder().decode(ChatUpdate.self, from: data) {
                        onReceive(.success(update))
                    }
                default:
                    break
                }
                
                // Continue receiving messages
                self?.receiveMessage(chatId: chatId, onReceive: onReceive)
                
            case .failure(let error):
                onReceive(.failure(error))
                
                // Attempt to reconnect after a delay
                DispatchQueue.main.asyncAfter(deadline: .now() + 5) { [weak self] in
                    self?.connectToChat(chatId: chatId, onReceive: onReceive)
                }
            }
        }
    }
    
    // MARK: - Typing Indicators
    func sendTypingStatus(chatId: String, isTyping: Bool) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/typing",
            method: "POST",
            body: try JSONEncoder().encode(["isTyping": isTyping])
        )
    }
    
    // MARK: - Group Chat Management
    func createGroupChat(name: String, participantIds: [String], initialMessage: String?) async throws -> Chat {
        let request = CreateChatRequest(
            participantIds: participantIds,
            isGroup: true,
            chatName: name,
            initialMessage: initialMessage
        )
        return try await createChat(request: request)
    }
    
    func leaveChat(chatId: String) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/leave",
            method: "POST"
        )
    }
    
    func addParticipants(chatId: String, userIds: [String]) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/participants",
            method: "POST",
            body: try JSONEncoder().encode(["userIds": userIds])
        )
    }
    
    func removeParticipant(chatId: String, userId: String) async throws {
        let _: EmptyResponse = try await NetworkService.shared.request(
            endpoint: "/chats/\(chatId)/participants/\(userId)",
            method: "DELETE"
        )
    }
} 