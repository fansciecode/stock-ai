data class Chat(
    val id: String,
    val participants: List<User>,
    val messages: List<Message> = emptyList(),
    val lastMessage: Message? = null,
    val isGroupChat: Boolean = false,
    val chatName: String? = null,
    val groupAdmin: String? = null,
    val updatedAt: Long = System.currentTimeMillis()
)

data class Message(
    val id: String,
    val sender: User,
    val content: String,
    val messageType: MessageType = MessageType.TEXT,
    val timestamp: Long = System.currentTimeMillis(),
    val readBy: List<ReadReceipt> = emptyList()
)

data class ReadReceipt(
    val userId: String,
    val readAt: Long
)

enum class MessageType {
    TEXT,
    IMAGE,
    FILE,
    LOCATION
}

// UI State for Chat Screen
data class ChatUiState(
    val chat: Chat? = null,
    val messages: List<Message> = emptyList(),
    val currentUserId: String = "",
    val messageText: String = "",
    val isLoading: Boolean = false,
    val error: String? = null
)

// UI State for Chat List Screen
data class ChatListUiState(
    val chats: List<Chat> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
) 