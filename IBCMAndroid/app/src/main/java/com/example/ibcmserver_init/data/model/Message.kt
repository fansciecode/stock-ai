package com.example.ibcmserver_init.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
enum class MessageType {
    @SerialName("text")
    TEXT,
    
    @SerialName("image")
    IMAGE,
    
    @SerialName("event_update")
    EVENT_UPDATE,
    
    @SerialName("system")
    SYSTEM
}

@Serializable
data class Message(
    @SerialName("id")
    val id: String,
    
    @SerialName("chat_id")
    val chatId: String,
    
    @SerialName("sender_id")
    val senderId: String,
    
    @SerialName("sender_name")
    val senderName: String,
    
    @SerialName("content")
    val content: String,
    
    @SerialName("type")
    val type: MessageType = MessageType.TEXT,
    
    @SerialName("image_url")
    val imageUrl: String? = null,
    
    @SerialName("sender_profile_pic")
    val senderProfilePic: String? = null,
    
    @SerialName("seen_by")
    val seenBy: List<String> = emptyList(),
    
    @SerialName("timestamp")
    val timestamp: String,
    
    @SerialName("is_read")
    val isRead: Boolean = false,
    
    @SerialName("is_deleted")
    val isDeleted: Boolean = false
) 