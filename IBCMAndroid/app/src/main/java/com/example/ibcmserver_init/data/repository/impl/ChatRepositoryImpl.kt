package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.api.ChatApiService
import com.example.ibcmserver_init.data.model.Chat
import com.example.ibcmserver_init.data.model.Message
import com.example.ibcmserver_init.data.model.MessageType
import com.example.ibcmserver_init.data.repository.ChatRepository
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepositoryImpl @Inject constructor(
    private val chatApiService: ChatApiService
) : ChatRepository {

    override suspend fun getChats(): Flow<List<Chat>> = flow {
        // TODO: Implement when API is ready
        emit(emptyList())
    }

    override suspend fun getChatById(chatId: String): Flow<Chat> = flow {
        // TODO: Implement when API is ready
        throw NotImplementedError("API not implemented yet")
    }

    override suspend fun getMessages(chatId: String): Flow<List<Message>> = flow {
        try {
            val messages = chatApiService.getMessages(chatId)
            emit(messages)
        } catch (e: Exception) {
            throw Exception("Failed to load messages: ${e.message}")
        }
    }

    override suspend fun sendMessage(chatId: String, content: String, type: MessageType) {
        try {
            chatApiService.sendMessage(chatId, content)
        } catch (e: Exception) {
            throw Exception("Failed to send message: ${e.message}")
        }
    }

    override suspend fun sendImage(chatId: String, imageUri: String) {
        try {
            // TODO: Implement image upload
            throw NotImplementedError("Image upload not implemented yet")
        } catch (e: Exception) {
            throw Exception("Failed to send image: ${e.message}")
        }
    }

    override suspend fun markMessagesAsRead(chatId: String) {
        try {
            // TODO: Implement when API is ready
            throw NotImplementedError("API not implemented yet")
        } catch (e: Exception) {
            throw Exception("Failed to mark messages as read: ${e.message}")
        }
    }

    override suspend fun deleteMessage(messageId: String) {
        try {
            chatApiService.deleteMessage(messageId)
        } catch (e: Exception) {
            throw Exception("Failed to delete message: ${e.message}")
        }
    }

    override suspend fun createEventChat(eventId: String): Chat {
        // TODO: Implement when API is ready
        throw NotImplementedError("API not implemented yet")
    }

    override suspend fun leaveChat(chatId: String) {
        // TODO: Implement when API is ready
        throw NotImplementedError("API not implemented yet")
    }

    override suspend fun getChatForEvent(eventId: String): Chat? {
        // TODO: Implement when API is ready
        return null
    }

    override suspend fun setTypingStatus(chatId: String, isTyping: Boolean) {
        try {
            chatApiService.setTypingStatus(chatId, isTyping)
        } catch (e: Exception) {
            throw Exception("Failed to set typing status: ${e.message}")
        }
    }

    override suspend fun markMessageAsSeen(messageId: String) {
        try {
            chatApiService.markMessageAsRead(messageId)
        } catch (e: Exception) {
            throw Exception("Failed to mark message as seen: ${e.message}")
        }
    }

    override suspend fun getTypingUsers(chatId: String): Flow<List<String>> = flow {
        try {
            while (true) {
                val users = chatApiService.getTypingUsers(chatId)
                emit(users)
                delay(500) // Poll every 500ms
            }
        } catch (e: Exception) {
            throw Exception("Failed to get typing users: ${e.message}")
        }
    }

    override suspend fun getMessageSeenStatus(messageId: String): Flow<List<String>> = flow {
        // TODO: Implement when API is ready
        emit(emptyList())
    }

    override suspend fun getUnreadMessageCount(chatId: String): Int {
        return try {
            chatApiService.getUnreadMessageCount(chatId)
        } catch (e: Exception) {
            throw Exception("Failed to get unread message count: ${e.message}")
        }
    }

    override fun observeMessages(chatId: String): Flow<List<Message>> = flow {
        try {
            while (true) {
                val messages = chatApiService.getMessages(chatId)
                emit(messages)
                delay(1000) // Poll every second
            }
        } catch (e: Exception) {
            throw Exception("Failed to observe messages: ${e.message}")
        }
    }

    override fun observeTypingStatus(chatId: String): Flow<List<String>> = flow {
        try {
            while (true) {
                val users = chatApiService.getTypingUsers(chatId)
                emit(users)
                delay(500) // Poll every 500ms
            }
        } catch (e: Exception) {
            throw Exception("Failed to observe typing status: ${e.message}")
        }
    }

    override suspend fun markMessageAsRead(messageId: String) {
        try {
            chatApiService.markMessageAsRead(messageId)
        } catch (e: Exception) {
            throw Exception("Failed to mark message as read: ${e.message}")
        }
    }
} 