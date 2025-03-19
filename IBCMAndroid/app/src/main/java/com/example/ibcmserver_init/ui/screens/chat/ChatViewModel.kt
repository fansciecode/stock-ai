package com.example.ibcmserver_init.ui.screens.chat

import android.net.Uri
import android.location.LatLng
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.models.ChatMessage
import com.example.ibcmserver_init.data.models.ChatRoom
import com.example.ibcmserver_init.data.models.User
import com.example.ibcmserver_init.data.repositories.ChatRepository
import com.example.ibcmserver_init.data.repositories.UserManager
import com.example.ibcmserver_init.data.model.chat.ChatSocketEvent
import com.example.ibcmserver_init.data.model.chat.ChatSocketEventType
import com.example.ibcmserver_init.data.model.chat.ChatParticipant
import com.example.ibcmserver_init.data.model.chat.ParticipantRole
import com.example.ibcmserver_init.data.repositories.FollowRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import kotlinx.coroutines.Job
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val userManager: UserManager,
    private val followRepository: FollowRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val chatId: String = checkNotNull(savedStateHandle["chatId"])
    private val _uiState = MutableStateFlow<ChatUiState>(ChatUiState.Initial)
    val uiState: StateFlow<ChatUiState> = _uiState.asStateFlow()

    private val _messages = MutableStateFlow<List<ChatMessage>>(emptyList())
    val messages: StateFlow<List<ChatMessage>> = _messages.asStateFlow()

    private val _isTyping = MutableStateFlow(false)
    val isTyping: StateFlow<Boolean> = _isTyping.asStateFlow()

    private var typingJob: Job? = null
    private val typingTimeout = 3000L // 3 seconds

    init {
        loadChat()
        observeMessages()
        observeTypingStatus()
    }

    private fun loadChat() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val messages = chatRepository.getMessages(chatId)
                _messages.value = messages
                _uiState.update { state ->
                    state.copy(
                        messages = messages,
                        currentUserId = userManager.getCurrentUserId(),
                        isLoading = false
                    )
                }
                // Mark messages as read
                messages.filter { !it.readBy.any { receipt -> receipt.userId == userManager.getCurrentUserId() } }
                    .forEach { message ->
                        chatRepository.markMessageAsRead(chatId, message.id)
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        error = e.message ?: "Failed to load chat",
                        isLoading = false
                    )
                }
            }
        }
    }

    private fun observeMessages() {
        viewModelScope.launch {
            chatRepository.observeMessages().collect { message ->
                if (message.sender.id != userManager.getCurrentUserId()) {
                    // Mark message as read if chat is open
                    chatRepository.markMessageAsRead(chatId, message.id)
                }
                _messages.value = _messages.value + message
            }
        }
    }

    private fun observeTypingStatus() {
        viewModelScope.launch {
            chatRepository.observeTypingStatus(chatId).collect { typingUsers ->
                _uiState.update { it.copy(typingUsers = typingUsers) }
            }
        }
    }

    fun updateMessageText(text: String) {
        _uiState.update { it.copy(messageText = text) }
        
        // Handle typing indicator
        typingJob?.cancel()
        if (text.isNotEmpty()) {
            chatRepository.setTypingStatus(chatId, true)
            typingJob = viewModelScope.launch {
                delay(typingTimeout)
                chatRepository.setTypingStatus(chatId, false)
            }
        } else {
            viewModelScope.launch {
                chatRepository.setTypingStatus(chatId, false)
            }
        }
    }

    fun sendMessage() {
        val messageText = uiState.value.messageText.trim()
        if (messageText.isEmpty()) return

        viewModelScope.launch {
            try {
                chatRepository.sendMessage(chatId, messageText)
                _uiState.update { it.copy(messageText = "") }
                chatRepository.setTypingStatus(chatId, false)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun sendImage(uri: Uri) {
        viewModelScope.launch {
            try {
                chatRepository.sendMessage(
                    chatId = chatId,
                    content = uri.toString(),
                    type = MessageType.IMAGE
                )
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun sendFile(uri: Uri) {
        viewModelScope.launch {
            try {
                chatRepository.sendMessage(
                    chatId = chatId,
                    content = uri.toString(),
                    type = MessageType.FILE
                )
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun sendLocation(location: LatLng) {
        viewModelScope.launch {
            try {
                chatRepository.sendMessage(
                    chatId = chatId,
                    content = "${location.latitude},${location.longitude}",
                    type = MessageType.LOCATION
                )
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun connect() {
        viewModelScope.launch {
            _uiState.value = ChatUiState.Loading
            chatRepository.connect()
                .collect { event ->
                    when (event.type) {
                        ChatSocketEventType.CONNECTED -> {
                            _uiState.value = ChatUiState.Connected
                        }
                        ChatSocketEventType.DISCONNECTED -> {
                            _uiState.value = ChatUiState.Disconnected
                        }
                        ChatSocketEventType.ERROR -> {
                            _uiState.value = ChatUiState.Error(event.data.toString())
                        }
                        else -> {}
                    }
                }
        }
    }

    fun joinRoom(roomId: String) {
        viewModelScope.launch {
            _uiState.value = ChatUiState.Loading
            chatRepository.joinRoom(roomId)
                .collect { event ->
                    when (event.type) {
                        ChatSocketEventType.JOIN_ROOM -> {
                            _uiState.value = ChatUiState.JoinedRoom(roomId)
                            observeMessages(roomId)
                        }
                        ChatSocketEventType.ERROR -> {
                            _uiState.value = ChatUiState.Error(event.data.toString())
                        }
                        else -> {}
                    }
                }
        }
    }

    private fun observeMessages(roomId: String) {
        viewModelScope.launch {
            chatRepository.observeMessages(roomId)
                .collect { message ->
                    _messages.value = _messages.value + message
                }
        }
    }

    fun sendMessage(roomId: String, content: String) {
        viewModelScope.launch {
            chatRepository.sendMessage(roomId, content)
                .collect { event ->
                    when (event.type) {
                        ChatSocketEventType.SEND_MESSAGE -> {
                            val message = event.data as ChatMessage
                            _messages.value = _messages.value + message
                        }
                        ChatSocketEventType.ERROR -> {
                            _uiState.value = ChatUiState.Error(event.data.toString())
                        }
                        else -> {}
                    }
                }
        }
    }

    fun setTyping(isTyping: Boolean) {
        _isTyping.value = isTyping
    }

    fun toggleFollow(userId: String) {
        viewModelScope.launch {
            try {
                val currentParticipant = _uiState.value.chat?.participants?.firstOrNull()
                if (currentParticipant != null) {
                    if (currentParticipant.isFollowing) {
                        followRepository.unfollowUser(userId)
                    } else {
                        followRepository.followUser(userId)
                    }
                    
                    // Update the participant's follow status in the UI
                    _uiState.update { currentState ->
                        currentState.copy(
                            chat = currentState.chat?.copy(
                                participants = currentState.chat.participants.map { participant ->
                                    if (participant.userId == userId) {
                                        participant.copy(
                                            isFollowing = !participant.isFollowing,
                                            followersCount = if (!participant.isFollowing) 
                                                participant.followersCount + 1 
                                            else 
                                                participant.followersCount - 1
                                        )
                                    } else {
                                        participant
                                    }
                                }
                            )
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            chatRepository.setTypingStatus(chatId, false)
        }
        chatRepository.disconnect()
    }
}

sealed class ChatUiState {
    object Initial : ChatUiState()
    object Loading : ChatUiState()
    object Connected : ChatUiState()
    object Disconnected : ChatUiState()
    data class JoinedRoom(val roomId: String) : ChatUiState()
    data class Error(val message: String) : ChatUiState()
}

data class ChatUiState(
    val chat: Chat? = null,
    val messages: List<Message> = emptyList(),
    val currentUserId: String = "",
    val messageText: String = "",
    val typingUsers: List<User> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null
) 
} 