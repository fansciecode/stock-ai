package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.Notification
import retrofit2.Response
import retrofit2.http.*

interface NotificationApiService {
    @GET("notifications")
    suspend fun getUserNotifications(): Response<List<Notification>>

    @PUT("notifications/{id}/read")
    suspend fun markNotificationAsRead(
        @Path("id") notificationId: String
    ): Response<Unit>

    @PUT("notifications/read-all")
    suspend fun markAllNotificationsAsRead(): Response<Unit>

    @DELETE("notifications/{id}")
    suspend fun deleteNotification(
        @Path("id") notificationId: String
    ): Response<Unit>

    @POST("notifications/register")
    suspend fun registerDevice(@Body deviceInfo: Map<String, String>)

    @DELETE("notifications/unregister")
    suspend fun unregisterDevice(@Query("deviceId") deviceId: String)

    @PUT("notifications/settings")
    suspend fun updateNotificationSettings(@Body settings: Map<String, Boolean>)

    @GET("notifications/history")
    suspend fun getNotificationHistory(
        @Query("userId") userId: String,
        @Query("limit") limit: Int? = null,
        @Query("offset") offset: Int? = null
    ): List<Map<String, Any>>

    @POST("notifications/test")
    suspend fun sendTestNotification(@Body notificationData: Map<String, Any>)

    @GET("notifications/preferences")
    suspend fun getNotificationPreferences(@Query("userId") userId: String): Map<String, Boolean>

    @PUT("notifications/preferences")
    suspend fun updateNotificationPreferences(
        @Query("userId") userId: String,
        @Body preferences: Map<String, Boolean>
    )

    @POST("notifications/topics/subscribe")
    suspend fun subscribeToTopic(
        @Query("topic") topic: String,
        @Query("deviceId") deviceId: String
    )

    @POST("notifications/topics/unsubscribe")
    suspend fun unsubscribeFromTopic(
        @Query("topic") topic: String,
        @Query("deviceId") deviceId: String
    )
} 