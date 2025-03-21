import Foundation

protocol ChatRepository {
    func getConversations(page: Int, limit: Int) async throws -> ([Conversation], ListMetadata)
    func getConversation(id: String) async throws -> Conversation
    func createConversation(participants: [String], title: String?) async throws -> Conversation
    func updateConversation(id: String, title: String) async throws -> Conversation
    func deleteConversation(id: String) async throws
    func leaveConversation(id: String) async throws
    func addParticipants(conversationId: String, userIds: [String]) async throws -> Conversation
    func removeParticipant(conversationId: String, userId: String) async throws -> Conversation
    func getMessages(conversationId: String, page: Int, limit: Int) async throws -> ([Message], ListMetadata)
    func sendMessage(conversationId: String, message: Message) async throws -> Message
    func editMessage(conversationId: String, messageId: String, newText: String) async throws -> Message
    func deleteMessage(conversationId: String, messageId: String) async throws
    func markAsRead(conversationId: String, messageId: String) async throws
    func markConversationAsRead(conversationId: String) async throws
    func getUnreadCount() async throws -> Int
    func searchMessages(query: String) async throws -> [Message]
    func pinMessage(conversationId: String, messageId: String) async throws -> Message
    func unpinMessage(conversationId: String, messageId: String) async throws -> Message
    func getPinnedMessages(conversationId: String) async throws -> [Message]
    func reactToMessage(conversationId: String, messageId: String, reaction: String) async throws -> Message
    func removeReaction(conversationId: String, messageId: String, reaction: String) async throws -> Message
    func getReactions(conversationId: String, messageId: String) async throws -> [MessageReaction]
    func observeConversation(id: String) -> AsyncStream<Conversation>
    func observeMessages(conversationId: String) -> AsyncStream<Message>
    func observeTyping(conversationId: String) -> AsyncStream<TypingEvent>
    func setTyping(conversationId: String, isTyping: Bool) async throws
    func uploadAttachment(conversationId: String, data: Data, type: AttachmentType) async throws -> String
    func downloadAttachment(url: String) async throws -> Data
}

class ChatRepositoryImpl: ChatRepository {
    private let apiService: APIService
    private let webSocket: WebSocketService
    private let cache: NSCache<NSString, CachedChat>
    private var conversationObservers: [String: AsyncStream<Conversation>] = [:]
    private var messageObservers: [String: AsyncStream<Message>] = [:]
    private var typingObservers: [String: AsyncStream<TypingEvent>] = [:]
    
    init(apiService: APIService = .shared, webSocket: WebSocketService = .shared) {
        self.apiService = apiService
        self.webSocket = webSocket
        self.cache = NSCache()
    }
    
    func getConversations(page: Int, limit: Int) async throws -> ([Conversation], ListMetadata) {
        let response: ConversationListResponse = try await apiService.request(
            endpoint: "/conversations",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        
        response.data.forEach { conversation in
            cache.setObject(
                CachedChat(data: conversation, timestamp: Date()),
                forKey: conversation.id as NSString
            )
        }
        
        return (response.data, response.metadata)
    }
    
    func getConversation(id: String) async throws -> Conversation {
        if let cached = cache.object(forKey: id as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.data as! Conversation
            }
        }
        
        let response: ConversationResponse = try await apiService.request(
            endpoint: "/conversations/\(id)",
            method: "GET"
        )
        
        let conversation = response.data
        cache.setObject(
            CachedChat(data: conversation, timestamp: Date()),
            forKey: conversation.id as NSString
        )
        return conversation
    }
    
    func createConversation(participants: [String], title: String?) async throws -> Conversation {
        let response: ConversationResponse = try await apiService.request(
            endpoint: "/conversations",
            method: "POST",
            body: try JSONEncoder().encode([
                "participants": participants,
                "title": title
            ])
        )
        
        let conversation = response.data
        cache.setObject(
            CachedChat(data: conversation, timestamp: Date()),
            forKey: conversation.id as NSString
        )
        return conversation
    }
    
    func updateConversation(id: String, title: String) async throws -> Conversation {
        let response: ConversationResponse = try await apiService.request(
            endpoint: "/conversations/\(id)",
            method: "PUT",
            body: try JSONEncoder().encode(["title": title])
        )
        
        let conversation = response.data
        cache.setObject(
            CachedChat(data: conversation, timestamp: Date()),
            forKey: conversation.id as NSString
        )
        return conversation
    }
    
    func deleteConversation(id: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(id)",
            method: "DELETE"
        )
        
        if response.success {
            cache.removeObject(forKey: id as NSString)
        } else {
            throw ChatError.deleteFailed
        }
    }
    
    func leaveConversation(id: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(id)/leave",
            method: "POST"
        )
        
        if response.success {
            cache.removeObject(forKey: id as NSString)
        } else {
            throw ChatError.leaveFailed
        }
    }
    
    func addParticipants(conversationId: String, userIds: [String]) async throws -> Conversation {
        let response: ConversationResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/participants",
            method: "POST",
            body: try JSONEncoder().encode(["userIds": userIds])
        )
        
        let conversation = response.data
        cache.setObject(
            CachedChat(data: conversation, timestamp: Date()),
            forKey: conversation.id as NSString
        )
        return conversation
    }
    
    func removeParticipant(conversationId: String, userId: String) async throws -> Conversation {
        let response: ConversationResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/participants/\(userId)",
            method: "DELETE"
        )
        
        let conversation = response.data
        cache.setObject(
            CachedChat(data: conversation, timestamp: Date()),
            forKey: conversation.id as NSString
        )
        return conversation
    }
    
    func getMessages(conversationId: String, page: Int, limit: Int) async throws -> ([Message], ListMetadata) {
        let response: MessageListResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
    
    func sendMessage(conversationId: String, message: Message) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages",
            method: "POST",
            body: try JSONEncoder().encode(message)
        )
        return response.data
    }
    
    func editMessage(conversationId: String, messageId: String, newText: String) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)",
            method: "PUT",
            body: try JSONEncoder().encode(["text": newText])
        )
        return response.data
    }
    
    func deleteMessage(conversationId: String, messageId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)",
            method: "DELETE"
        )
        
        if !response.success {
            throw ChatError.messageDeleteFailed
        }
    }
    
    func markAsRead(conversationId: String, messageId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/read",
            method: "POST"
        )
        
        if !response.success {
            throw ChatError.markAsReadFailed
        }
    }
    
    func markConversationAsRead(conversationId: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/read",
            method: "POST"
        )
        
        if !response.success {
            throw ChatError.markAsReadFailed
        }
    }
    
    func getUnreadCount() async throws -> Int {
        let response: UnreadCountResponse = try await apiService.request(
            endpoint: "/conversations/unread",
            method: "GET"
        )
        return response.count
    }
    
    func searchMessages(query: String) async throws -> [Message] {
        let response: MessageListResponse = try await apiService.request(
            endpoint: "/messages/search",
            method: "GET",
            queryItems: [URLQueryItem(name: "query", value: query)]
        )
        return response.data
    }
    
    func pinMessage(conversationId: String, messageId: String) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/pin",
            method: "POST"
        )
        return response.data
    }
    
    func unpinMessage(conversationId: String, messageId: String) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/unpin",
            method: "POST"
        )
        return response.data
    }
    
    func getPinnedMessages(conversationId: String) async throws -> [Message] {
        let response: MessageListResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/pinned",
            method: "GET"
        )
        return response.data
    }
    
    func reactToMessage(conversationId: String, messageId: String, reaction: String) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/reactions",
            method: "POST",
            body: try JSONEncoder().encode(["reaction": reaction])
        )
        return response.data
    }
    
    func removeReaction(conversationId: String, messageId: String, reaction: String) async throws -> Message {
        let response: MessageResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/reactions/\(reaction)",
            method: "DELETE"
        )
        return response.data
    }
    
    func getReactions(conversationId: String, messageId: String) async throws -> [MessageReaction] {
        let response: ReactionListResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/messages/\(messageId)/reactions",
            method: "GET"
        )
        return response.data
    }
    
    func observeConversation(id: String) -> AsyncStream<Conversation> {
        if let existing = conversationObservers[id] {
            return existing
        }
        
        let stream = AsyncStream<Conversation> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "conversation.\(id)") {
                    if let conversation = try? JSONDecoder().decode(Conversation.self, from: message) {
                        continuation.yield(conversation)
                    }
                }
            }
        }
        
        conversationObservers[id] = stream
        return stream
    }
    
    func observeMessages(conversationId: String) -> AsyncStream<Message> {
        if let existing = messageObservers[conversationId] {
            return existing
        }
        
        let stream = AsyncStream<Message> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "conversation.\(conversationId).messages") {
                    if let chatMessage = try? JSONDecoder().decode(Message.self, from: message) {
                        continuation.yield(chatMessage)
                    }
                }
            }
        }
        
        messageObservers[conversationId] = stream
        return stream
    }
    
    func observeTyping(conversationId: String) -> AsyncStream<TypingEvent> {
        if let existing = typingObservers[conversationId] {
            return existing
        }
        
        let stream = AsyncStream<TypingEvent> { continuation in
            Task {
                for await message in webSocket.subscribe(to: "conversation.\(conversationId).typing") {
                    if let event = try? JSONDecoder().decode(TypingEvent.self, from: message) {
                        continuation.yield(event)
                    }
                }
            }
        }
        
        typingObservers[conversationId] = stream
        return stream
    }
    
    func setTyping(conversationId: String, isTyping: Bool) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/typing",
            method: "POST",
            body: try JSONEncoder().encode(["isTyping": isTyping])
        )
        
        if !response.success {
            throw ChatError.typingUpdateFailed
        }
    }
    
    func uploadAttachment(conversationId: String, data: Data, type: AttachmentType) async throws -> String {
        let response: AttachmentResponse = try await apiService.request(
            endpoint: "/conversations/\(conversationId)/attachments",
            method: "POST",
            body: try JSONEncoder().encode([
                "data": data.base64EncodedString(),
                "type": type.rawValue
            ])
        )
        return response.url
    }
    
    func downloadAttachment(url: String) async throws -> Data {
        let response: AttachmentDataResponse = try await apiService.request(
            endpoint: "/attachments",
            method: "GET",
            queryItems: [URLQueryItem(name: "url", value: url)]
        )
        return response.data
    }
}

// MARK: - Cache Types
private class CachedChat {
    let data: Any
    let timestamp: Date
    
    init(data: Any, timestamp: Date) {
        self.data = data
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct ConversationResponse: Codable {
    let success: Bool
    let data: Conversation
    let message: String?
}

struct ConversationListResponse: Codable {
    let success: Bool
    let data: [Conversation]
    let metadata: ListMetadata
    let message: String?
}

struct MessageResponse: Codable {
    let success: Bool
    let data: Message
    let message: String?
}

struct MessageListResponse: Codable {
    let success: Bool
    let data: [Message]
    let metadata: ListMetadata
    let message: String?
}

struct ReactionListResponse: Codable {
    let success: Bool
    let data: [MessageReaction]
    let message: String?
}

struct UnreadCountResponse: Codable {
    let success: Bool
    let count: Int
    let message: String?
}

struct AttachmentResponse: Codable {
    let success: Bool
    let url: String
    let message: String?
}

struct AttachmentDataResponse: Codable {
    let success: Bool
    let data: Data
    let message: String?
}

// MARK: - Enums
enum AttachmentType: String {
    case image
    case video
    case audio
    case document
}

enum ChatError: LocalizedError {
    case invalidConversation
    case conversationNotFound
    case createFailed
    case deleteFailed
    case leaveFailed
    case messageNotFound
    case messageDeleteFailed
    case markAsReadFailed
    case typingUpdateFailed
    case attachmentUploadFailed
    case attachmentDownloadFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidConversation:
            return "Invalid conversation"
        case .conversationNotFound:
            return "Conversation not found"
        case .createFailed:
            return "Failed to create conversation"
        case .deleteFailed:
            return "Failed to delete conversation"
        case .leaveFailed:
            return "Failed to leave conversation"
        case .messageNotFound:
            return "Message not found"
        case .messageDeleteFailed:
            return "Failed to delete message"
        case .markAsReadFailed:
            return "Failed to mark as read"
        case .typingUpdateFailed:
            return "Failed to update typing status"
        case .attachmentUploadFailed:
            return "Failed to upload attachment"
        case .attachmentDownloadFailed:
            return "Failed to download attachment"
        }
    }
} 