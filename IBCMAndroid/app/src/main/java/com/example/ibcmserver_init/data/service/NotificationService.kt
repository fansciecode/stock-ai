package com.example.ibcmserver_init.data.service

import android.app.NotificationChannel
import android.app.NotificationManager
import android.app.PendingIntent
import android.content.Context
import android.content.Intent
import android.os.Build
import androidx.core.app.NotificationCompat
import com.example.ibcmserver_init.R
import com.example.ibcmserver_init.data.model.notification.Notification
import com.example.ibcmserver_init.data.model.notification.NotificationData
import com.example.ibcmserver_init.data.model.notification.NotificationType
import com.example.ibcmserver_init.ui.screens.event.EventScreen
import com.example.ibcmserver_init.ui.screens.profile.ProfileScreen
import dagger.hilt.android.qualifiers.ApplicationContext
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class NotificationService @Inject constructor(
    @ApplicationContext private val context: Context
) {
    private val notificationManager = context.getSystemService(Context.NOTIFICATION_SERVICE) as NotificationManager

    init {
        createNotificationChannel()
    }

    private fun createNotificationChannel() {
        if (Build.VERSION.SDK_INT >= Build.VERSION_CODES.O) {
            val channel = NotificationChannel(
                CHANNEL_ID,
                "Event Notifications",
                NotificationManager.IMPORTANCE_DEFAULT
            ).apply {
                description = "Notifications for events and follows"
            }
            notificationManager.createNotificationChannel(channel)
        }
    }

    fun showNotification(notification: Notification) {
        val intent = when (notification.data) {
            is NotificationData.EventData -> {
                Intent(context, EventScreen::class.java).apply {
                    putExtra("eventId", (notification.data as NotificationData.EventData).eventId)
                }
            }
            is NotificationData.FollowData -> {
                Intent(context, ProfileScreen::class.java).apply {
                    putExtra("userId", (notification.data as NotificationData.FollowData).userId)
                }
            }
            is NotificationData.EventInvitationData -> {
                Intent(context, EventScreen::class.java).apply {
                    putExtra("eventId", (notification.data as NotificationData.EventInvitationData).eventId)
                }
            }
        }

        val pendingIntent = PendingIntent.getActivity(
            context,
            notification.id.hashCode(),
            intent,
            PendingIntent.FLAG_UPDATE_CURRENT or PendingIntent.FLAG_IMMUTABLE
        )

        val notificationBuilder = NotificationCompat.Builder(context, CHANNEL_ID)
            .setSmallIcon(R.drawable.ic_notification)
            .setContentTitle(notification.title)
            .setContentText(notification.message)
            .setPriority(NotificationCompat.PRIORITY_DEFAULT)
            .setAutoCancel(true)
            .setContentIntent(pendingIntent)

        notificationManager.notify(notification.id.hashCode(), notificationBuilder.build())
    }

    companion object {
        private const val CHANNEL_ID = "event_notifications"
    }
} 