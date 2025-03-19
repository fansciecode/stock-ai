package com.example.ibcmserver_init.data.model.chat

import java.time.Instant

data class ChatMessage(
    val id: String,
    val roomId: String,
    val senderId: String,
    val content: String,
    val timestamp: String = Instant.now().toString(),
    val status: MessageStatus = MessageStatus.SENT,
    val type: MessageType = MessageType.TEXT
)

enum class MessageStatus {
    SENDING,
    SENT,
    DELIVERED,
    READ,
    FAILED
}

enum class MessageType {
    TEXT,
    IMAGE,
    FILE,
    SYSTEM
}

data class ChatRoom(
    val id: String,
    val eventId: String? = null,
    val eventTitle: String? = null,
    val name: String? = null, // For group chats
    val participants: List<ChatParticipant>,
    val lastMessage: ChatMessage? = null,
    val unreadCount: Int = 0,
    val createdAt: String = Instant.now().toString(),
    val isGroupChat: Boolean = false,
    val groupAdminIds: List<String> = emptyList(),
    val groupImage: String? = null
)

data class ChatParticipant(
    val userId: String,
    val name: String,
    val profileImage: String?,
    val role: ParticipantRole,
    val isFollowing: Boolean = false,
    val followersCount: Int = 0,
    val followingCount: Int = 0,
    val isAdmin: Boolean = false
)

enum class ParticipantRole {
    EVENT_CREATOR,
    EVENT_PARTICIPANT,
    GROUP_ADMIN,
    GROUP_MEMBER
}

data class ChatSocketEvent(
    val type: ChatSocketEventType,
    val data: Any
)

enum class ChatSocketEventType {
    JOIN_ROOM,
    LEAVE_ROOM,
    SEND_MESSAGE,
    NEW_MESSAGE,
    TYPING,
    READ_RECEIPT,
    CONNECTED,
    DISCONNECTED,
    ERROR,
    GROUP_UPDATE,
    PARTICIPANT_JOINED,
    PARTICIPANT_LEFT,
    PARTICIPANT_ROLE_CHANGED
}

// Reporting Models
data class Report(
    val id: String,
    val reporterId: String,
    val reportedId: String,
    val type: ReportType,
    val reason: String,
    val description: String?,
    val timestamp: String = Instant.now().toString(),
    val status: ReportStatus = ReportStatus.PENDING
)

enum class ReportType {
    USER,
    EVENT,
    MESSAGE
}

enum class ReportStatus {
    PENDING,
    REVIEWING,
    RESOLVED,
    DISMISSED
}

data class ReportReason(
    val id: String,
    val type: ReportType,
    val description: String
)