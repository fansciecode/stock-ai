package com.example.ibcmserver_init.ui.screens.chat

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.chat.ChatRoom
import com.example.ibcmserver_init.data.repository.ChatRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ChatListViewModel @Inject constructor(
    private val chatRepository: ChatRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<ChatListUiState>(ChatListUiState.Loading)
    val uiState: StateFlow<ChatListUiState> = _uiState.asStateFlow()

    init {
        loadChats()
    }

    fun loadChats() {
        viewModelScope.launch {
            _uiState.value = ChatListUiState.Loading
            try {
                val chats = chatRepository.getChats()
                _uiState.value = ChatListUiState.Success(chats)
            } catch (e: Exception) {
                _uiState.value = ChatListUiState.Error(e.message ?: "Failed to load chats")
            }
        }
    }
}

sealed class ChatListUiState {
    object Loading : ChatListUiState()
    data class Success(val chats: List<ChatRoom>) : ChatListUiState()
    data class Error(val message: String) : ChatListUiState()
} 