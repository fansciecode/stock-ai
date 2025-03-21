package com.example.ibcmserver_init.data.repositories

import com.example.ibcmserver_init.data.api.FollowApi
import com.example.ibcmserver_init.data.model.follow.FollowResponse
import com.example.ibcmserver_init.data.model.follow.FollowersResponse
import com.example.ibcmserver_init.data.model.follow.FollowingResponse
import com.example.ibcmserver_init.data.model.notification.Notification
import com.example.ibcmserver_init.data.model.notification.NotificationData
import com.example.ibcmserver_init.data.model.notification.NotificationType
import com.example.ibcmserver_init.data.service.NotificationService
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class FollowRepository @Inject constructor(
    private val followApi: FollowApi,
    private val notificationService: NotificationService
) {
    suspend fun followUser(userId: String): FollowResponse {
        val response = followApi.followUser(userId)
        
        // Create and show notification for the followed user
        val notification = Notification(
            id = "follow_${userId}_${System.currentTimeMillis()}",
            type = NotificationType.FOLLOW_REQUEST,
            title = "New Follower",
            message = "Someone started following you",
            data = NotificationData.FollowData(userId, "New Follower")
        )
        notificationService.showNotification(notification)
        
        return response
    }

    suspend fun unfollowUser(userId: String): FollowResponse {
        return followApi.unfollowUser(userId)
    }

    suspend fun getFollowers(userId: String): FollowersResponse {
        return followApi.getFollowers(userId)
    }

    suspend fun getFollowing(userId: String): FollowingResponse {
        return followApi.getFollowing(userId)
    }

    // Method to handle event creation notifications for followers
    suspend fun notifyFollowersOfEvent(
        creatorId: String,
        eventId: String,
        eventTitle: String,
        creatorName: String
    ) {
        val followers = getFollowers(creatorId).followers
        followers.forEach { follower ->
            val notification = Notification(
                id = "event_${eventId}_${follower.userId}",
                type = NotificationType.EVENT_CREATED,
                title = "New Event",
                message = "$creatorName created a new event: $eventTitle",
                data = NotificationData.EventData(
                    eventId = eventId,
                    eventTitle = eventTitle,
                    creatorId = creatorId,
                    creatorName = creatorName
                )
            )
            notificationService.showNotification(notification)
        }
    }
} 