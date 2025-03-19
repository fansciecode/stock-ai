package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.EventRequest
import com.example.ibcmserver_init.data.model.Review
import kotlinx.coroutines.flow.Flow
import retrofit2.Response
import retrofit2.http.*

interface EventApiService {
    @GET("events")
    suspend fun getEvents(): Response<List<Event>>

    @GET("events/{id}")
    suspend fun getEventById(@Path("id") eventId: String): Response<Event>

    @POST("events")
    suspend fun createEvent(@Body event: EventRequest): Response<Event>

    @PUT("events/{id}")
    suspend fun updateEvent(
        @Path("id") eventId: String, 
        @Body event: EventUpdateRequest
    ): Response<Event>

    @DELETE("events/{id}")
    suspend fun deleteEvent(@Path("id") eventId: String): Response<Unit>

    @POST("events/{id}/register")
    suspend fun registerForEvent(@Path("id") eventId: String): Response<Event>

    @POST("events/{id}/unregister")
    suspend fun unregisterFromEvent(@Path("id") eventId: String): Response<Event>

    @GET("events/nearby")
    suspend fun getNearbyEvents(
        @Query("lat") latitude: Double,
        @Query("lng") longitude: Double,
        @Query("radius") radius: Double
    ): Response<List<Event>>

    @GET("events/search")
    suspend fun searchEvents(@Query("query") query: String): List<Event>

    @GET("events/upcoming")
    suspend fun getUpcomingEvents(): List<Event>

    @GET("events/popular")
    suspend fun getPopularEvents(): List<Event>

    @GET("events/trending")
    suspend fun getTrendingEvents(): List<Event>

    @GET("events/category/{category}")
    suspend fun getEventsByCategory(@Path("category") category: String): List<Event>

    @GET("events/user/{userId}")
    suspend fun getUserEvents(@Path("userId") userId: String): List<Event>

    @GET("events/{eventId}/requests")
    suspend fun getEventRequests(@Path("eventId") eventId: String): List<EventRequest>

    @POST("events/{eventId}/requests")
    suspend fun createEventRequest(
        @Path("eventId") eventId: String,
        @Body request: EventRequest
    ): EventRequest

    @PUT("events/{eventId}/requests/{requestId}")
    suspend fun updateEventRequest(
        @Path("eventId") eventId: String,
        @Path("requestId") requestId: String,
        @Body request: EventRequest
    ): EventRequest

    @POST("events/{eventId}/reviews")
    suspend fun addEventReview(
        @Path("eventId") eventId: String,
        @Body review: Review
    ): Review

    @GET("events/{eventId}/reviews")
    suspend fun getEventReviews(@Path("eventId") eventId: String): List<Review>

    @PUT("events/{eventId}/visibility")
    suspend fun upgradeEventVisibility(
        @Path("eventId") eventId: String,
        @Query("visibility") newVisibility: String
    ): Event

    @POST("events/{eventId}/join")
    suspend fun joinEvent(@Path("eventId") eventId: String)

    @POST("events/{eventId}/leave")
    suspend fun leaveEvent(@Path("eventId") eventId: String)

    @POST("events/{eventId}/comments")
    suspend fun addComment(
        @Path("eventId") eventId: String,
        @Body comment: Map<String, String>
    ): Event

    @DELETE("events/{eventId}/comments/{commentId}")
    suspend fun deleteComment(
        @Path("eventId") eventId: String,
        @Path("commentId") commentId: String
    ): Event

    @PUT("events/{eventId}/reminder")
    suspend fun setReminder(
        @Path("eventId") eventId: String,
        @Query("enabled") enabled: Boolean
    ): Event

    @GET("events/{eventId}/rating")
    suspend fun getEventRating(@Path("eventId") eventId: String): Float

    @POST("events/{eventId}/rate")
    suspend fun rateEvent(
        @Path("eventId") eventId: String,
        @Query("rating") rating: Float,
        @Query("review") review: String?
    ): Event

    @GET("events/{eventId}/updates")
    suspend fun getEventUpdates(@Path("eventId") eventId: String): Flow<Event>
}

data class EventRequest(
    val title: String,
    val description: String,
    val category: String,
    val date: String,
    val time: String,
    val location: String,
    val maxAttendees: Int,
    val latitude: Double?,
    val longitude: Double?,
    val imageUrl: String?
)

data class EventUpdateRequest(
    val title: String?,
    val description: String?,
    val category: String?,
    val date: String?,
    val time: String?,
    val location: String?,
    val maxAttendees: Int?,
    val status: String?
) 