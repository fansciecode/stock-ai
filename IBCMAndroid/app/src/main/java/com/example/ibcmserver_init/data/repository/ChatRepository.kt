package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.model.Chat
import com.example.ibcmserver_init.data.model.Message
import com.example.ibcmserver_init.data.model.MessageType
import kotlinx.coroutines.flow.Flow

interface ChatRepository {
    suspend fun getChats(): Flow<List<Chat>>
    suspend fun getChatById(chatId: String): Flow<Chat>
    suspend fun getMessages(chatId: String): Flow<List<Message>>
    suspend fun sendMessage(chatId: String, content: String, type: MessageType = MessageType.TEXT)
    suspend fun sendImage(chatId: String, imageUri: String)
    suspend fun markMessagesAsRead(chatId: String)
    suspend fun deleteMessage(messageId: String)
    suspend fun createEventChat(eventId: String): Chat
    suspend fun leaveChat(chatId: String)
    suspend fun getChatForEvent(eventId: String): Chat?
    
    // New methods for typing indicators and seen status
    suspend fun setTypingStatus(chatId: String, isTyping: Boolean)
    suspend fun markMessageAsSeen(messageId: String)
    suspend fun getTypingUsers(chatId: String): Flow<List<String>>
    suspend fun getMessageSeenStatus(messageId: String): Flow<List<String>>

    suspend fun getUnreadMessageCount(chatId: String): Int
    fun observeMessages(chatId: String): Flow<List<Message>>
    fun observeTypingStatus(chatId: String): Flow<List<String>>
    suspend fun markMessageAsRead(messageId: String)
} 