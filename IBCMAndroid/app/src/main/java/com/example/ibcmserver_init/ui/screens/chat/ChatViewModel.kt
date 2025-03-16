package com.example.ibcmserver_init.ui.screens.chat

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Chat
import com.example.ibcmserver_init.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {
    var chats by mutableStateOf<List<Chat>>(emptyList())
        private set
    
    var isLoading by mutableStateOf(false)
        private set
    
    var error by mutableStateOf<String?>(null)
        private set

    init {
        loadChats()
    }

    private fun loadChats() {
        viewModelScope.launch {
            isLoading = true
            error = null
            try {
                chatRepository.getChats()
                    .catch { e ->
                        error = e.message
                        isLoading = false
                    }
                    .collect { chatList ->
                        chats = chatList.sortedByDescending { it.lastMessage?.timestamp }
                        isLoading = false
                    }
            } catch (e: Exception) {
                error = e.message
                isLoading = false
            }
        }
    }

    fun markChatAsRead(chatId: String) {
        viewModelScope.launch {
            try {
                chatRepository.markMessagesAsRead(chatId)
            } catch (e: Exception) {
                error = e.message
            }
        }
    }

    fun leaveChat(chatId: String) {
        viewModelScope.launch {
            try {
                chatRepository.leaveChat(chatId)
                // Chat list will be automatically updated through the Flow
            } catch (e: Exception) {
                error = e.message
            }
        }
    }

    fun retryLoadChats() {
        loadChats()
    }
} 