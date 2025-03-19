package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.Message
import retrofit2.http.*

interface ChatApiService {
    @GET("chats")
    suspend fun getUserChats(): Response<List<Chat>>

    @GET("chats/{id}")
    suspend fun getChatById(@Path("id") chatId: String): Response<Chat>

    @GET("chats/{id}/messages")
    suspend fun getChatMessages(@Path("id") chatId: String): Response<List<Message>>

    @POST("chats/{id}/messages")
    suspend fun sendMessage(
        @Path("id") chatId: String,
        @Body message: MessageRequest
    ): Response<Message>

    @DELETE("chats/{id}/messages/{messageId}")
    suspend fun deleteMessage(
        @Path("id") chatId: String,
        @Path("messageId") messageId: String
    ): Response<Unit>

    @POST("chats/{id}/typing")
    suspend fun setTypingStatus(
        @Path("id") chatId: String,
        @Body status: TypingStatus
    ): Response<Unit>
}

data class MessageRequest(
    val content: String,
    val type: String = "TEXT",
    val metadata: Map<String, Any>? = null
)

data class TypingStatus(
    val isTyping: Boolean
) 