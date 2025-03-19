package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.model.Chat
import com.example.ibcmserver_init.data.model.Message
import com.example.ibcmserver_init.data.model.MessageType
import com.example.ibcmserver_init.data.model.chat.ChatMessage
import com.example.ibcmserver_init.data.model.chat.ChatRoom
import com.example.ibcmserver_init.data.model.chat.ChatSocketEvent
import com.example.ibcmserver_init.data.model.chat.ChatSocketEventType
import com.example.ibcmserver_init.data.service.ChatSocketService
import com.example.ibcmserver_init.data.service.UserService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.flow.map
import java.util.UUID
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatRepository @Inject constructor(
    private val chatApi: ChatApi,
    private val chatSocketService: ChatSocketService,
    private val chatDao: ChatDao, // For local caching
    private val userService: UserService
) {
    private val _chats = MutableStateFlow<List<Chat>>(emptyList())
    val chats = _chats.asStateFlow()

    suspend fun accessChat(userId: String): Chat {
        val response = chatApi.accessChat(AccessChatRequest(userId))
        // Cache the chat
        chatDao.insertChat(response)
        refreshChats()
        return response
    }

    suspend fun fetchChats() {
        try {
            val response = chatApi.fetchChats()
            _chats.value = response
            // Cache the chats
            chatDao.insertChats(response)
        } catch (e: Exception) {
            // If API fails, load from cache
            _chats.value = chatDao.getAllChats()
            throw e
        }
    }

    suspend fun createGroupChat(name: String, users: List<String>): Chat {
        val response = chatApi.createGroupChat(CreateGroupRequest(name, users))
        refreshChats()
        return response
    }

    suspend fun renameGroup(chatId: String, newName: String): Chat {
        val response = chatApi.renameGroup(RenameGroupRequest(chatId, newName))
        refreshChats()
        return response
    }

    suspend fun addToGroup(chatId: String, userId: String): Chat {
        val response = chatApi.addToGroup(GroupMemberRequest(chatId, userId))
        refreshChats()
        return response
    }

    suspend fun removeFromGroup(chatId: String, userId: String): Chat {
        val response = chatApi.removeFromGroup(GroupMemberRequest(chatId, userId))
        refreshChats()
        return response
    }

    suspend fun getMessages(chatId: String): List<Message> {
        try {
            val messages = chatApi.getMessages(chatId)
            // Cache messages
            chatDao.insertMessages(chatId, messages)
            return messages
        } catch (e: Exception) {
            // If API fails, load from cache
            return chatDao.getMessagesForChat(chatId)
        }
    }

    suspend fun sendMessage(chatId: String, content: String, type: MessageType = MessageType.TEXT): Message {
        val response = chatApi.sendMessage(chatId, SendMessageRequest(content, type))
        // Update local cache
        chatDao.insertMessage(chatId, response)
        return response
    }

    // Socket related functions
    fun connect(): Flow<ChatSocketEvent> = chatSocketService.connect()

    fun joinRoom(roomId: String): Flow<ChatSocketEvent> = chatSocketService.joinRoom(roomId)

    fun sendMessage(roomId: String, content: String): Flow<ChatSocketEvent> = flow {
        val currentUserId = userService.getCurrentUserId()
        val message = ChatMessage(
            id = UUID.randomUUID().toString(),
            roomId = roomId,
            senderId = currentUserId,
            content = content,
            status = MessageStatus.SENDING
        )
        chatSocketService.sendMessage(message)
            .collect { event ->
                emit(event)
            }
    }

    fun observeMessages(roomId: String): Flow<ChatMessage> {
        return chatSocketService.connect()
            .map { event ->
                when (event.type) {
                    ChatSocketEventType.NEW_MESSAGE -> {
                        val messageJson = event.data as JSONObject
                        ChatMessage(
                            id = messageJson.getString("id"),
                            roomId = roomId,
                            senderId = messageJson.getString("senderId"),
                            content = messageJson.getString("content"),
                            timestamp = messageJson.getString("timestamp"),
                            status = MessageStatus.SENT
                        )
                    }
                    else -> null
                }
            }
            .filterNotNull()
    }

    fun disconnect() {
        chatSocketService.disconnect()
    }

    private suspend fun refreshChats() {
        try {
            _chats.value = chatApi.fetchChats()
        } catch (e: Exception) {
            // Handle error
        }
    }
}

// Room DAO interface for local caching
@Dao
interface ChatDao {
    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChat(chat: Chat)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertChats(chats: List<Chat>)

    @Query("SELECT * FROM chats ORDER BY updatedAt DESC")
    suspend fun getAllChats(): List<Chat>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessage(chatId: String, message: Message)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertMessages(chatId: String, messages: List<Message>)

    @Query("SELECT * FROM messages WHERE chatId = :chatId ORDER BY timestamp ASC")
    suspend fun getMessagesForChat(chatId: String): List<Message>
} 