package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.model.Notification
import kotlinx.coroutines.flow.Flow

interface NotificationRepository {
    suspend fun getNotifications(userId: String): Flow<List<Notification>>
    suspend fun markNotificationAsRead(userId: String, notificationId: String)
    suspend fun markAllNotificationsAsRead(userId: String)
    suspend fun deleteNotification(userId: String, notificationId: String)
} 