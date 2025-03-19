package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.NotificationApi
import com.example.ibcmserver_init.data.local.NotificationDao
import com.example.ibcmserver_init.domain.model.Notification
import com.example.ibcmserver_init.domain.model.NotificationPreferences
import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationRepository @Inject constructor(
    private val notificationApi: NotificationApi,
    private val notificationDao: NotificationDao
) {
    private var socket: Socket? = null

    fun getNotifications(): Flow<List<Notification>> = flow {
        try {
            // Get notifications from local storage first
            val localNotifications = notificationDao.getNotifications()
            emit(localNotifications)

            // Then fetch from API and update local storage
            val remoteNotifications = notificationApi.getUserNotifications()
            notificationDao.insertNotifications(remoteNotifications)
            emit(remoteNotifications)
        } catch (e: Exception) {
            // If API call fails, at least show local notifications
            val localNotifications = notificationDao.getNotifications()
            emit(localNotifications)
            throw e
        }
    }

    suspend fun markAsRead(notificationId: String) {
        try {
            notificationApi.markAsRead(notificationId)
            notificationDao.markAsRead(notificationId)
        } catch (e: Exception) {
            // Mark as read locally even if API fails
            notificationDao.markAsRead(notificationId)
            throw e
        }
    }

    suspend fun deleteNotification(notificationId: String) {
        try {
            notificationApi.deleteNotification(notificationId)
            notificationDao.deleteNotification(notificationId)
        } catch (e: Exception) {
            // Delete locally even if API fails
            notificationDao.deleteNotification(notificationId)
            throw e
        }
    }

    suspend fun getNotificationPreferences(): NotificationPreferences {
        return try {
            notificationApi.getNotificationPreferences()
        } catch (e: Exception) {
            // Return default preferences if API fails
            NotificationPreferences()
        }
    }

    suspend fun updateNotificationPreferences(preferences: NotificationPreferences) {
        notificationApi.updateNotificationPreferences(preferences)
    }

    fun connectToNotificationSocket(): Flow<Notification> = callbackFlow {
        try {
            socket = IO.socket(BASE_URL).apply {
                connect()
                
                on(Socket.EVENT_CONNECT) {
                    // Send authentication token when connected
                    emit("authenticate", JSONObject().put("token", getAuthToken()))
                }

                on("newNotification") { args ->
                    if (args.isNotEmpty() && args[0] is JSONObject) {
                        val notificationJson = args[0] as JSONObject
                        val notification = parseNotification(notificationJson)
                        launch {
                            // Store notification locally
                            notificationDao.insertNotification(notification)
                            // Send to UI
                            trySend(notification)
                        }
                    }
                }

                on(Socket.EVENT_DISCONNECT) {
                    // Handle disconnection
                }

                on(Socket.EVENT_ERROR) {
                    // Handle error
                }
            }
        } catch (e: Exception) {
            // Handle socket connection error
        }

        awaitClose {
            socket?.disconnect()
            socket = null
        }
    }

    private fun parseNotification(json: JSONObject): Notification {
        // Parse JSON to Notification object
        return Notification(
            id = json.getString("id"),
            type = parseNotificationType(json.getString("type")),
            title = json.getString("title"),
            content = json.getString("content"),
            timestamp = java.util.Date(json.getLong("timestamp")),
            isRead = json.optBoolean("isRead", false),
            priority = parseNotificationPriority(json.optString("priority", "NORMAL")),
            actionUrl = json.optString("actionUrl"),
            actionText = json.optString("actionText"),
            metadata = parseMetadata(json.optJSONObject("metadata"))
        )
    }

    private fun parseNotificationType(type: String): NotificationType {
        return try {
            NotificationType.valueOf(type.uppercase())
        } catch (e: Exception) {
            NotificationType.CUSTOM
        }
    }

    private fun parseNotificationPriority(priority: String): NotificationPriority {
        return try {
            NotificationPriority.valueOf(priority.uppercase())
        } catch (e: Exception) {
            NotificationPriority.NORMAL
        }
    }

    private fun parseMetadata(json: JSONObject?): Map<String, Any> {
        if (json == null) return emptyMap()
        
        return json.keys().asSequence().associate { key ->
            key to when (val value = json.get(key)) {
                is JSONObject -> parseMetadata(value)
                else -> value
            }
        }
    }

    private fun getAuthToken(): String {
        // Get authentication token from secure storage
        return "YOUR_AUTH_TOKEN"
    }

    companion object {
        private const val BASE_URL = "YOUR_SOCKET_SERVER_URL"
    }
} 