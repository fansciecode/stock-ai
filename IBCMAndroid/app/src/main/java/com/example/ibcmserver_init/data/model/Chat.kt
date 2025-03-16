package com.example.ibcmserver_init.data.model

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable

@Serializable
data class Chat(
    @SerialName("id")
    val id: String,
    
    @SerialName("event_id")
    val eventId: String,
    
    @SerialName("event_title")
    val eventTitle: String,
    
    @SerialName("participants")
    val participants: List<String> = emptyList(),
    
    @SerialName("last_message")
    val lastMessage: Message? = null,
    
    @SerialName("unread_count")
    val unreadCount: Int = 0,
    
    @SerialName("created_at")
    val createdAt: String,
    
    @SerialName("updated_at")
    val updatedAt: String
)