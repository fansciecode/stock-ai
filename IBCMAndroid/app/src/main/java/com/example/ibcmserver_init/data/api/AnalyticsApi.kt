package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.analytics.*
import retrofit2.Response
import retrofit2.http.Body
import retrofit2.http.POST

interface UserActivityApi {
    @POST("api/user-activity")
    suspend fun trackUserActivity(
        @Body activity: UserActivityData
    ): Response<Unit>

    @POST("api/user-activity/interest")
    suspend fun trackUserInterest(
        @Body interest: UserInterestData
    ): Response<Unit>

    @POST("api/user-activity/behavior")
    suspend fun trackUserBehavior(
        @Body behavior: UserBehaviorData
    ): Response<Unit>
}

interface AnalyticsApi {
    @POST("api/analytics/search")
    suspend fun trackSearchQuery(
        @Body searchData: SearchAnalyticsData
    ): Response<Unit>

    @POST("api/analytics/voice")
    suspend fun trackVoiceInteraction(
        @Body voiceData: VoiceAnalyticsData
    ): Response<Unit>

    @POST("api/analytics/event")
    suspend fun trackEventInteraction(
        @Body eventData: EventAnalyticsData
    ): Response<Unit>
}

interface ContentAnalyticsApi {
    @POST("api/analytics/content/view")
    suspend fun trackContentView(
        @Body contentData: ContentViewData
    ): Response<Unit>

    @POST("api/analytics/content/interaction")
    suspend fun trackContentInteraction(
        @Body interactionData: ContentInteractionData
    ): Response<Unit>
}

// Additional data models for analytics
data class EventAnalyticsData(
    val userId: String,
    val eventId: String,
    val action: String,
    val timestamp: String,
    val context: EventContext
)

data class EventContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int,
    val source: String,
    val sessionDuration: Long
)

data class ContentViewData(
    val userId: String,
    val contentId: String,
    val contentType: String,
    val timestamp: String,
    val context: ContentContext
)

data class ContentContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int,
    val source: String,
    val viewDuration: Long
)

data class ContentInteractionData(
    val userId: String,
    val contentId: String,
    val interactionType: String,
    val timestamp: String,
    val context: ContentContext
) 