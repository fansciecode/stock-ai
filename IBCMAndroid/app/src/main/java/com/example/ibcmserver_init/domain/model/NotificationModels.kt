package com.example.ibcmserver_init.domain.model

import java.util.Date

data class Notification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val content: String,
    val timestamp: Date,
    val isRead: Boolean = false,
    val priority: NotificationPriority = NotificationPriority.NORMAL,
    val actionUrl: String? = null,
    val actionText: String? = null,
    val metadata: Map<String, Any> = emptyMap()
)

enum class NotificationType {
    SYSTEM,
    EVENT,
    BOOKING,
    PAYMENT,
    PROMOTION,
    REMINDER,
    UPDATE,
    CUSTOM
}

enum class NotificationPriority {
    HIGH,
    NORMAL,
    LOW
}

data class NotificationChannel(
    val id: String,
    val name: String,
    val description: String,
    val isEnabled: Boolean = true,
    val importance: NotificationImportance = NotificationImportance.DEFAULT
)

enum class NotificationImportance {
    HIGH,
    DEFAULT,
    LOW,
    MIN
}

data class NotificationPreferences(
    val enablePush: Boolean = true,
    val enableEmail: Boolean = true,
    val enableSMS: Boolean = false,
    val quietHoursStart: Int = 22, // 24-hour format
    val quietHoursEnd: Int = 7,    // 24-hour format
    val enableQuietHours: Boolean = false,
    val channelPreferences: Map<String, Boolean> = emptyMap()
)

data class NotificationGroup(
    val type: NotificationType,
    val notifications: List<Notification>,
    val unreadCount: Int
)

data class NotificationSummary(
    val totalCount: Int,
    val unreadCount: Int,
    val groups: Map<NotificationType, NotificationGroup>
) 