package com.example.ibcmserver_init.data.models

data class ChatMessage(
    val id: String,
    val senderId: String,
    val content: String,
    val timestamp: Long,
    val status: Status = Status.SENT
) {
    enum class Status {
        SENDING,
        SENT,
        DELIVERED,
        READ,
        FAILED
    }
} 