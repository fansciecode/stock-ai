package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.Message
import retrofit2.http.*

interface ChatApiService {
    @GET("chats/{chatId}/messages")
    suspend fun getMessages(@Path("chatId") chatId: String): List<Message>
    
    @POST("chats/{chatId}/messages")
    suspend fun sendMessage(
        @Path("chatId") chatId: String,
        @Body content: String
    ): Message
    
    @DELETE("messages/{messageId}")
    suspend fun deleteMessage(@Path("messageId") messageId: String)
    
    @POST("messages/{messageId}/read")
    suspend fun markMessageAsRead(@Path("messageId") messageId: String)
    
    @GET("chats/{chatId}/unread")
    suspend fun getUnreadMessageCount(@Path("chatId") chatId: String): Int
    
    @GET("chats/{chatId}/typing")
    suspend fun getTypingUsers(@Path("chatId") chatId: String): List<String>
    
    @POST("chats/{chatId}/typing")
    suspend fun setTypingStatus(
        @Path("chatId") chatId: String,
        @Body isTyping: Boolean
    )
} 