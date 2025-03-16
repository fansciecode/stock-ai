package com.example.ibcmserver_init.ui.screens.notifications

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Notification
import com.example.ibcmserver_init.data.repository.NotificationRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class NotificationsViewModel @Inject constructor(
    private val notificationRepository: NotificationRepository
) : ViewModel() {

    var notifications by mutableStateOf<List<Notification>>(emptyList())
        private set

    var isLoading by mutableStateOf(false)
        private set

    var error by mutableStateOf<String?>(null)
        private set

    fun loadNotifications(userId: String) {
        viewModelScope.launch {
            isLoading = true
            error = null
            try {
                notificationRepository.getNotifications(userId).collectLatest { notificationList ->
                    notifications = notificationList
                }
            } catch (e: Exception) {
                error = e.message ?: "Failed to load notifications"
            } finally {
                isLoading = false
            }
        }
    }

    fun markAsRead(userId: String, notificationId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.markNotificationAsRead(userId, notificationId)
                notifications = notifications.map { notification ->
                    if (notification.id == notificationId) {
                        notification.copy(isRead = true)
                    } else {
                        notification
                    }
                }
            } catch (e: Exception) {
                error = e.message ?: "Failed to mark notification as read"
            }
        }
    }

    fun markAllAsRead(userId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.markAllNotificationsAsRead(userId)
                notifications = notifications.map { it.copy(isRead = true) }
            } catch (e: Exception) {
                error = e.message ?: "Failed to mark all notifications as read"
            }
        }
    }

    fun deleteNotification(userId: String, notificationId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.deleteNotification(userId, notificationId)
                notifications = notifications.filter { it.id != notificationId }
            } catch (e: Exception) {
                error = e.message ?: "Failed to delete notification"
            }
        }
    }

    fun clearError() {
        error = null
    }
} 