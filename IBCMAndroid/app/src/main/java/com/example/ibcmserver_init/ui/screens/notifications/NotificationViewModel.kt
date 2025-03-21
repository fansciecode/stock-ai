package com.example.ibcmserver_init.ui.screens.notifications

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.NotificationRepository
import com.example.ibcmserver_init.domain.model.*
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

data class NotificationUiState(
    val notifications: List<Notification> = emptyList(),
    val groups: Map<NotificationType, NotificationGroup> = emptyMap(),
    val unreadCount: Int = 0,
    val selectedType: NotificationType? = null,
    val preferences: NotificationPreferences? = null,
    val isLoading: Boolean = false,
    val error: String? = null,
    val showPreferences: Boolean = false
)

@HiltViewModel
class NotificationViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(NotificationUiState())
    val uiState: StateFlow<NotificationUiState> = _uiState.asStateFlow()

    init {
        loadNotifications()
        loadPreferences()
        setupNotificationSocket()
    }

    private fun loadNotifications() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                notificationRepository.getNotifications()
                    .collect { notifications ->
                        val groups = notifications.groupBy { it.type }
                            .mapValues { (type, notifs) ->
                                NotificationGroup(
                                    type = type,
                                    notifications = notifs,
                                    unreadCount = notifs.count { !it.isRead }
                                )
                            }
                        
                        _uiState.update { state ->
                            state.copy(
                                notifications = notifications,
                                groups = groups,
                                unreadCount = notifications.count { !it.isRead },
                                isLoading = false
                            )
                        }
                    }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        error = e.message ?: "Failed to load notifications",
                        isLoading = false
                    )
                }
            }
        }
    }

    private fun loadPreferences() {
        viewModelScope.launch {
            try {
                val preferences = notificationRepository.getNotificationPreferences()
                _uiState.update { it.copy(preferences = preferences) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to load preferences")
                }
            }
        }
    }

    private fun setupNotificationSocket() {
        viewModelScope.launch {
            notificationRepository.connectToNotificationSocket()
                .collect { notification ->
                    addNotification(notification)
                }
        }
    }

    private fun addNotification(notification: Notification) {
        _uiState.update { state ->
            val updatedNotifications = state.notifications + notification
            val updatedGroups = updatedNotifications.groupBy { it.type }
                .mapValues { (type, notifs) ->
                    NotificationGroup(
                        type = type,
                        notifications = notifs,
                        unreadCount = notifs.count { !it.isRead }
                    )
                }
            
            state.copy(
                notifications = updatedNotifications,
                groups = updatedGroups,
                unreadCount = state.unreadCount + 1
            )
        }
    }

    fun markAsRead(notificationId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.markAsRead(notificationId)
                updateNotificationReadStatus(notificationId, true)
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to mark notification as read")
                }
            }
        }
    }

    fun deleteNotification(notificationId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.deleteNotification(notificationId)
                removeNotification(notificationId)
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to delete notification")
                }
            }
        }
    }

    private fun updateNotificationReadStatus(notificationId: String, isRead: Boolean) {
        _uiState.update { state ->
            val updatedNotifications = state.notifications.map { notification ->
                if (notification.id == notificationId) {
                    notification.copy(isRead = isRead)
                } else {
                    notification
                }
            }
            
            val updatedGroups = updatedNotifications.groupBy { it.type }
                .mapValues { (type, notifs) ->
                    NotificationGroup(
                        type = type,
                        notifications = notifs,
                        unreadCount = notifs.count { !it.isRead }
                    )
                }
            
            state.copy(
                notifications = updatedNotifications,
                groups = updatedGroups,
                unreadCount = updatedNotifications.count { !it.isRead }
            )
        }
    }

    private fun removeNotification(notificationId: String) {
        _uiState.update { state ->
            val updatedNotifications = state.notifications.filter { it.id != notificationId }
            val updatedGroups = updatedNotifications.groupBy { it.type }
                .mapValues { (type, notifs) ->
                    NotificationGroup(
                        type = type,
                        notifications = notifs,
                        unreadCount = notifs.count { !it.isRead }
                    )
                }
            
            state.copy(
                notifications = updatedNotifications,
                groups = updatedGroups,
                unreadCount = updatedNotifications.count { !it.isRead }
            )
        }
    }

    fun selectType(type: NotificationType?) {
        _uiState.update { it.copy(selectedType = type) }
    }

    fun showPreferences() {
        _uiState.update { it.copy(showPreferences = true) }
    }

    fun hidePreferences() {
        _uiState.update { it.copy(showPreferences = false) }
    }

    fun updatePreferences(preferences: NotificationPreferences) {
        viewModelScope.launch {
            try {
                notificationRepository.updateNotificationPreferences(preferences)
                _uiState.update { it.copy(preferences = preferences) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to update preferences")
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }
} 