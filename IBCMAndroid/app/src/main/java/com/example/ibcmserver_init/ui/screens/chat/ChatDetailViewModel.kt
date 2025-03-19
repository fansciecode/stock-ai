package com.example.ibcmserver_init.ui.screens.chat

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Chat
import com.example.ibcmserver_init.data.model.Message
import com.example.ibcmserver_init.data.repository.ChatRepository
import com.example.ibcmserver_init.data.repository.ReportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.*
import kotlinx.coroutines.flow.*
import javax.inject.Inject
import java.util.*

@HiltViewModel
class ChatDetailViewModel @Inject constructor(
    private val chatRepository: ChatRepository,
    private val reportRepository: ReportRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {
    private val chatId: String = checkNotNull(savedStateHandle["chatId"])
    private var typingJob: Job? = null

    private val _chat = MutableStateFlow<Chat?>(null)
    val chat: StateFlow<Chat?> = _chat.asStateFlow()

    private val _messages = MutableStateFlow<List<Message>>(emptyList())
    val messages: StateFlow<List<Message>> = _messages.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _messageText = MutableStateFlow("")
    val messageText: StateFlow<String> = _messageText.asStateFlow()

    private val _typingUsers = MutableStateFlow<List<String>>(emptyList())
    val typingUsers: StateFlow<List<String>> = _typingUsers.asStateFlow()

    init {
        loadChat()
        loadMessages(chatId)
        observeTypingUsers()
    }

    private fun observeTypingUsers() {
        viewModelScope.launch {
            try {
                chatRepository.getTypingUsers(chatId)
                    .catch { e ->
                        _error.value = e.message
                    }
                    .collect { users ->
                        _typingUsers.value = users
                    }
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    private fun loadChat() {
        viewModelScope.launch {
            try {
                chatRepository.getChatById(chatId)
                    .catch { e ->
                        _error.value = e.message
                    }
                    .collect { loadedChat ->
                        _chat.value = loadedChat
                    }
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun loadMessages(chatId: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                chatRepository.getMessages(chatId)
                    .catch { e ->
                        _error.value = e.message ?: "Failed to load messages"
                        _isLoading.value = false
                    }
                    .collect { messageList ->
                        _messages.value = messageList
                        _isLoading.value = false
                    }
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load messages"
                _isLoading.value = false
            }
        }
    }

    fun onMessageTextChanged(text: String) {
        _messageText.value = text
        
        // Handle typing indicator
        typingJob?.cancel()
        typingJob = viewModelScope.launch {
            chatRepository.setTypingStatus(chatId, true)
            delay(3000) // Show typing indicator for 3 seconds after last keystroke
            chatRepository.setTypingStatus(chatId, false)
        }
    }

    fun sendMessage(chatId: String, content: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                chatRepository.sendMessage(chatId, content)
                _messageText.value = ""
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to send message"
            }
        }
    }

    fun sendImage(imageUri: String) {
        viewModelScope.launch {
            try {
                chatRepository.sendImage(chatId, imageUri)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    fun deleteMessage(messageId: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                chatRepository.deleteMessage(messageId)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to delete message"
            }
        }
    }

    fun retryLoadMessages() {
        loadMessages(chatId)
    }

    fun markMessageAsSeen(messageId: String) {
        viewModelScope.launch {
            try {
                chatRepository.markMessageAsSeen(messageId)
            } catch (e: Exception) {
                _error.value = e.message
            }
        }
    }

    private fun observeTypingStatus() {
        viewModelScope.launch {
            chatRepository.observeTypingStatus(chatId)
                .catch { e ->
                    _error.value = e.message ?: "Failed to observe typing status"
                }
                .collect { users -> 
                    _typingUsers.value = users
                }
        }
    }

    fun reportChat(chatId: String, reason: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                val report = Report(
                    id = UUID.randomUUID().toString(),
                    type = "CHAT",
                    targetId = chatId,
                    reason = reason,
                    reporterId = currentUserId.value ?: return,
                    timestamp = System.currentTimeMillis(),
                    status = "PENDING"
                )
                reportRepository.submitReport(report)
                // Show success message
                _snackbarMessage.value = "Chat reported successfully"
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to report chat"
            }
        }
    }

    fun reportMessage(messageId: String, reason: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                val report = Report(
                    id = UUID.randomUUID().toString(),
                    type = "MESSAGE",
                    targetId = messageId,
                    reason = reason,
                    reporterId = currentUserId.value ?: return,
                    timestamp = System.currentTimeMillis(),
                    status = "PENDING"
                )
                reportRepository.submitReport(report)
                // Show success message
                _snackbarMessage.value = "Message reported successfully"
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to report message"
            }
        }
    }

    override fun onCleared() {
        super.onCleared()
        viewModelScope.launch {
            chatRepository.setTypingStatus(chatId, false)
        }
    }
} 