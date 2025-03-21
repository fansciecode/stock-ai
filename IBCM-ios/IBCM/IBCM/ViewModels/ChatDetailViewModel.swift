import Foundation
import SwiftUI

@MainActor
class ChatDetailViewModel: ObservableObject {
    let chat: Chat
    
    @Published var messages: [Message] = []
    @Published var messageText = ""
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var showAttachmentOptions = false
    @Published var typingUsers: [String] = []
    @Published var selectedImage: UIImage?
    @Published var showImagePicker = false
    @Published var showCamera = false
    
    private var typingTask: Task<Void, Never>?
    private let chatService = ChatService.shared
    
    var canSendMessage: Bool {
        !messageText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty || selectedImage != nil
    }
    
    var typingIndicatorText: String? {
        guard !typingUsers.isEmpty else { return nil }
        
        let names = typingUsers.map { name in
            if let user = chat.participants.first(where: { $0.name == name }) {
                return user.name
            }
            return name
        }
        
        if names.count == 1 {
            return "\(names[0]) is typing..."
        } else if names.count == 2 {
            return "\(names[0]) and \(names[1]) are typing..."
        } else {
            return "Several people are typing..."
        }
    }
    
    init(chat: Chat) {
        self.chat = chat
    }
    
    func loadMessages() async {
        isLoading = true
        errorMessage = ""
        
        do {
            messages = try await chatService.getMessages(chatId: chat.id)
            
            // Mark messages as read
            if let lastMessage = messages.last {
                try? await chatService.markMessageAsRead(chatId: chat.id, messageId: lastMessage.id)
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func sendMessage() async {
        guard canSendMessage else { return }
        
        let text = messageText
        let image = selectedImage
        messageText = ""
        selectedImage = nil
        
        do {
            if let image = image {
                // Upload image first
                let imageUrl = try await uploadImage(image)
                
                let request = SendMessageRequest(
                    content: imageUrl,
                    messageType: .image,
                    metadata: nil
                )
                let message = try await chatService.sendMessage(chatId: chat.id, request: request)
                messages.append(message)
            } else {
                let request = SendMessageRequest(
                    content: text,
                    messageType: .text,
                    metadata: nil
                )
                let message = try await chatService.sendMessage(chatId: chat.id, request: request)
                messages.append(message)
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func deleteMessage(_ message: Message) async {
        do {
            try await chatService.deleteMessage(chatId: chat.id, messageId: message.id)
            if let index = messages.firstIndex(where: { $0.id == message.id }) {
                messages.remove(at: index)
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func handleMessageTextChange(_ text: String) {
        messageText = text
        
        // Cancel previous typing task
        typingTask?.cancel()
        
        // Create new typing task
        typingTask = Task {
            do {
                try await chatService.sendTypingStatus(chatId: chat.id, isTyping: true)
                try await Task.sleep(nanoseconds: 3_000_000_000) // 3 seconds
                try await chatService.sendTypingStatus(chatId: chat.id, isTyping: false)
            } catch {
                // Ignore typing status errors
            }
        }
    }
    
    func setupWebSocket() {
        chatService.connectToChat(chatId: chat.id) { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let update):
                Task { @MainActor in
                    self.handleChatUpdate(update)
                }
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
            if let message = update.message {
                messages.append(message)
                
                // Mark message as read if we're in the chat
                Task {
                    try? await chatService.markMessageAsRead(chatId: chat.id, messageId: message.id)
                }
            }
            
        case .messageRead:
            // Update read status of messages
            if let messageId = update.message?.id,
               let index = messages.firstIndex(where: { $0.id == messageId }) {
                messages[index] = update.message!
            }
            
        case .typing:
            if let users = update.typingUsers {
                typingUsers = users.filter { $0 != User.current?.id }
            }
            
        case .online:
            // Handle online status updates if needed
            break
        }
    }
    
    private func uploadImage(_ image: UIImage) async throws -> String {
        // TODO: Implement image upload
        throw NSError(domain: "ChatDetailViewModel", code: -1, userInfo: [
            NSLocalizedDescriptionKey: "Image upload not implemented yet"
        ])
    }
    
    deinit {
        chatService.disconnectFromChat(chatId: chat.id)
    }
} 