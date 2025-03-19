package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.api.NotificationApiService
import com.example.ibcmserver_init.data.model.Notification
import com.example.ibcmserver_init.data.repository.NotificationRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepositoryImpl @Inject constructor(
    private val notificationApiService: NotificationApiService
) : NotificationRepository {

    override suspend fun getNotifications(userId: String): Flow<List<Notification>> = flow {
        val response = notificationApiService.getNotifications(userId)
        if (response.isSuccessful) {
            emit(response.body() ?: emptyList())
        } else {
            throw Exception("Failed to get notifications: ${response.message()}")
        }
    }

    override suspend fun markNotificationAsRead(userId: String, notificationId: String) {
        val response = notificationApiService.markNotificationAsRead(userId, notificationId)
        if (!response.isSuccessful) {
            throw Exception("Failed to mark notification as read: ${response.message()}")
        }
    }

    override suspend fun markAllNotificationsAsRead(userId: String) {
        val response = notificationApiService.markAllNotificationsAsRead(userId)
        if (!response.isSuccessful) {
            throw Exception("Failed to mark all notifications as read: ${response.message()}")
        }
    }

    override suspend fun deleteNotification(userId: String, notificationId: String) {
        val response = notificationApiService.deleteNotification(userId, notificationId)
        if (!response.isSuccessful) {
            throw Exception("Failed to delete notification: ${response.message()}")
        }
    }
} 