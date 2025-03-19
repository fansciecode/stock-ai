package com.example.ibcmserver_init.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    @SerialName("created_at")
    val createdAt: String,
    @SerialName("is_read")
    val isRead: Boolean = false,
    @SerialName("related_id")
    val relatedId: String? = null
)

@Serializable
enum class NotificationType {
    @SerialName("event_invitation")
    EVENT_INVITATION,
    @SerialName("event_update")
    EVENT_UPDATE,
    @SerialName("event_reminder")
    EVENT_REMINDER,
    @SerialName("chat_message")
    CHAT_MESSAGE,
    @SerialName("friend_request")
    FRIEND_REQUEST,
    @SerialName("system")
    SYSTEM
} 