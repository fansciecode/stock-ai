package com.example.ibcmserver_init.data.model.notification

import java.time.Instant

data class Notification(
    val id: String,
    val type: NotificationType,
    val title: String,
    val message: String,
    val timestamp: String = Instant.now().toString(),
    val isRead: Boolean = false,
    val data: NotificationData
)

enum class NotificationType {
    EVENT_CREATED,
    EVENT_UPDATED,
    EVENT_CANCELLED,
    FOLLOW_REQUEST,
    FOLLOW_ACCEPTED,
    EVENT_INVITATION
}

sealed class NotificationData {
    data class EventData(
        val eventId: String,
        val eventTitle: String,
        val creatorId: String,
        val creatorName: String
    ) : NotificationData()
    
    data class FollowData(
        val userId: String,
        val userName: String
    ) : NotificationData()
    
    data class EventInvitationData(
        val eventId: String,
        val eventTitle: String,
        val inviterId: String,
        val inviterName: String
    ) : NotificationData()
}

data class NotificationPreferences(
    val userId: String,
    val eventNotifications: Boolean = true,
    val followNotifications: Boolean = true,
    val invitationNotifications: Boolean = true
) 