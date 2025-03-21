import Foundation

enum ChatType: String, Codable {
    case individual = "INDIVIDUAL"
    case group = "GROUP"
}

enum MessageType: String, Codable {
    case text = "TEXT"
    case image = "IMAGE"
    case file = "FILE"
    case eventUpdate = "EVENT_UPDATE"
    case system = "SYSTEM"
}

struct Chat: Identifiable, Codable {
    let id: String
    let chatName: String
    let isGroupChat: Bool
    let chatType: ChatType
    let participants: [User]
    let lastMessage: Message?
    let unreadCount: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    
    var displayName: String {
        if isGroupChat {
            return chatName
        } else {
            return participants.first { $0.id != User.current?.id }?.name ?? "Unknown"
        }
    }
    
    static var preview: Chat {
        Chat(
            id: "1",
            chatName: "Test Chat",
            isGroupChat: false,
            chatType: .individual,
            participants: [User.preview],
            lastMessage: Message.preview,
            unreadCount: 2,
            isActive: true,
            createdAt: Date(),
            updatedAt: Date()
        )
    }
}

struct Message: Identifiable, Codable {
    let id: String
    let chatId: String
    let sender: User
    let content: String
    let messageType: MessageType
    let readBy: [MessageReadStatus]
    let createdAt: Date
    
    var formattedTime: String {
        let formatter = DateFormatter()
        formatter.timeStyle = .short
        return formatter.string(from: createdAt)
    }
    
    static var preview: Message {
        Message(
            id: "1",
            chatId: "1",
            sender: User.preview,
            content: "Hello!",
            messageType: .text,
            readBy: [],
            createdAt: Date()
        )
    }
}

struct MessageReadStatus: Codable {
    let user: User
    let readAt: Date
}

// MARK: - Request Types
struct CreateChatRequest: Codable {
    let participantIds: [String]
    let isGroup: Bool
    let chatName: String?
    let initialMessage: String?
}

struct SendMessageRequest: Codable {
    let content: String
    let messageType: MessageType
    let metadata: [String: String]?
}

// MARK: - Response Types
struct ChatsResponse: Codable {
    let success: Bool
    let data: [Chat]
    let message: String?
}

struct ChatResponse: Codable {
    let success: Bool
    let data: Chat
    let message: String?
}

struct MessagesResponse: Codable {
    let success: Bool
    let data: [Message]
    let message: String?
}

struct MessageResponse: Codable {
    let success: Bool
    let data: Message
    let message: String?
}

// MARK: - WebSocket Types
struct ChatUpdate: Codable {
    let type: ChatUpdateType
    let chatId: String?
    let message: Message?
    let typingUsers: [String]?
}

enum ChatUpdateType: String, Codable {
    case newMessage = "NEW_MESSAGE"
    case messageRead = "MESSAGE_READ"
    case typing = "TYPING"
    case online = "ONLINE"
} 