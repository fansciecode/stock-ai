package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.EventRequest
import com.example.ibcmserver_init.data.model.Review
import kotlinx.coroutines.flow.Flow
import java.time.LocalDate
import java.time.LocalTime

interface EventRepository {
    suspend fun createEvent(event: Event): Result<Event>
    suspend fun getEventById(eventId: String): Event
    suspend fun updateEvent(event: Event): Result<Event>
    suspend fun deleteEvent(eventId: String): Result<Unit>
    suspend fun searchEvents(query: String): List<Event>
    suspend fun getEventsByCategory(category: String): List<Event>
    suspend fun getEventsByUser(userId: String): List<Event>
    suspend fun joinEvent(eventId: String): Result<Event>
    suspend fun leaveEvent(eventId: String): Result<Event>
    suspend fun addEventReview(eventId: String, review: Review): Result<Review>
    suspend fun addComment(eventId: String, text: String): Event
    suspend fun addCommentWithImage(eventId: String, text: String, imageUrl: String): Event
    suspend fun deleteComment(eventId: String, commentId: String): Event
    suspend fun setReminder(eventId: String, enabled: Boolean): Event
    suspend fun upgradeEventVisibility(eventId: String): Result<Event>
    fun observeEvent(eventId: String): Flow<Event>
    fun observeEventsByCategory(category: String): Flow<List<Event>>
    fun observeEventsByUser(userId: String): Flow<List<Event>>

    suspend fun getEvent(eventId: String): Event

    suspend fun searchEvents(creatorId: String? = null, attendeeId: String? = null): List<Event>

    suspend fun getNearbyEvents(latitude: Double, longitude: Double, radius: Double): List<Event>

    suspend fun getUpcomingEvents(): List<Event>

    suspend fun getPopularEvents(): List<Event>

    suspend fun getEventRequests(eventId: String): Flow<List<EventRequest>>

    suspend fun createEventRequest(request: EventRequest): Result<EventRequest>

    suspend fun updateEventRequest(request: EventRequest): Result<EventRequest>

    suspend fun getEventReviews(eventId: String): Flow<List<Review>>

    suspend fun getRating(eventId: String): Float

    suspend fun rateEvent(eventId: String, rating: Float, review: String?): Event

    suspend fun getEventUpdates(eventId: String): Flow<Event>
} 