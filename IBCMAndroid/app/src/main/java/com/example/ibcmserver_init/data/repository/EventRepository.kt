package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.local.EventDao
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.EventRequest
import com.example.ibcmserver_init.data.model.Review
import com.example.ibcmserver_init.data.remote.EventApi
import com.example.ibcmserver_init.utils.NetworkUtils
import com.example.ibcmserver_init.utils.Resource
import com.example.ibcmserver_init.utils.networkBoundResource
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import java.io.IOException
import java.time.LocalDate
import java.time.LocalTime
import com.example.ibcmserver_init.data.api.*
import com.example.ibcmserver_init.ui.screens.event.*

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

    suspend fun getNearbyEvents(
        latitude: Double,
        longitude: Double,
        radius: Double,
        category: String? = null
    ): List<Event>

    suspend fun getUpcomingEvents(): List<Event>

    suspend fun getPopularEvents(): List<Event>

    suspend fun getEventRequests(eventId: String): Flow<List<EventRequest>>

    suspend fun createEventRequest(request: EventRequest): Result<EventRequest>

    suspend fun updateEventRequest(request: EventRequest): Result<EventRequest>

    suspend fun getEventReviews(eventId: String): Flow<List<Review>>

    suspend fun getRating(eventId: String): Float

    suspend fun rateEvent(eventId: String, rating: Float, review: String?): Event

    suspend fun getEventUpdates(eventId: String): Flow<Event>

    suspend fun getTrendingEvents(category: String? = null): List<Event>

    suspend fun generateEventDescription(request: DescriptionGenerationRequest): Flow<Result<DescriptionGenerationResponse>>
    suspend fun processEventImages(images: List<String>): Flow<Result<ImageProcessingResponse>>
    suspend fun processEventVideo(videoPath: String): Flow<Result<VideoProcessingResponse>>
}

class EventRepository @Inject constructor(
    private val eventApi: EventApi,
    private val eventDao: EventDao,
    private val networkUtils: NetworkUtils
) {
    fun getNearbyEventsWithCache(
        latitude: Double,
        longitude: Double,
        radius: Double,
        category: String? = null,
        forceRefresh: Boolean = false
    ): Flow<Resource<List<Event>>> = networkBoundResource(
        query = {
            eventDao.getNearbyEvents(latitude, longitude, radius, category)
        },
        fetch = {
            eventApi.getNearbyEvents(latitude, longitude, radius, category)
        },
        saveFetchResult = { events ->
            eventDao.insertEvents(events)
        },
        shouldFetch = { cachedEvents ->
            forceRefresh || cachedEvents.isEmpty() || !networkUtils.isNetworkAvailable()
        }
    )

    fun getTrendingEventsWithCache(
        category: String? = null,
        forceRefresh: Boolean = false
    ): Flow<Resource<List<Event>>> = networkBoundResource(
        query = {
            eventDao.getTrendingEvents(category)
        },
        fetch = {
            eventApi.getTrendingEvents(category)
        },
        saveFetchResult = { events ->
            eventDao.insertEvents(events)
        },
        shouldFetch = { cachedEvents ->
            forceRefresh || cachedEvents.isEmpty() || !networkUtils.isNetworkAvailable()
        }
    )

    suspend fun getNearbyEvents(
        latitude: Double,
        longitude: Double,
        radius: Double,
        category: String? = null
    ): List<Event> {
        if (!networkUtils.isNetworkAvailable()) {
            return eventDao.getNearbyEventsSync(latitude, longitude, radius, category)
        }
        return try {
            val events = eventApi.getNearbyEvents(latitude, longitude, radius, category)
            eventDao.insertEvents(events)
            events
        } catch (e: Exception) {
            eventDao.getNearbyEventsSync(latitude, longitude, radius, category)
        }
    }

    suspend fun getTrendingEvents(category: String? = null): List<Event> {
        if (!networkUtils.isNetworkAvailable()) {
            return eventDao.getTrendingEventsSync(category)
        }
        return try {
            val events = eventApi.getTrendingEvents(category)
            eventDao.insertEvents(events)
            events
        } catch (e: Exception) {
            eventDao.getTrendingEventsSync(category)
        }
    }

    suspend fun searchEvents(query: String, filters: Map<String, String>): List<Event> {
        if (!networkUtils.isNetworkAvailable()) {
            return eventDao.searchEvents(query, filters)
        }
        return try {
            val events = eventApi.searchEvents(query, filters)
            eventDao.insertEvents(events)
            events
        } catch (e: Exception) {
            eventDao.searchEvents(query, filters)
        }
    }

    suspend fun getEventById(eventId: String): Event? {
        return try {
            if (networkUtils.isNetworkAvailable()) {
                val event = eventApi.getEventById(eventId)
                eventDao.insertEvent(event)
                event
            } else {
                eventDao.getEventById(eventId)
            }
        } catch (e: Exception) {
            eventDao.getEventById(eventId)
        }
    }

    suspend fun createEvent(event: Event): Event {
        if (!networkUtils.isNetworkAvailable()) {
            throw IOException("No network connection available")
        }
        return eventApi.createEvent(event).also {
            eventDao.insertEvent(it)
        }
    }

    suspend fun updateEvent(eventId: String, event: Event): Event {
        if (!networkUtils.isNetworkAvailable()) {
            throw IOException("No network connection available")
        }
        return eventApi.updateEvent(eventId, event).also {
            eventDao.insertEvent(it)
        }
    }

    suspend fun deleteEvent(eventId: String) {
        if (!networkUtils.isNetworkAvailable()) {
            throw IOException("No network connection available")
        }
        eventApi.deleteEvent(eventId)
        eventDao.deleteEvent(eventId)
    }

    suspend fun createEvent(request: CreateEventRequest): Flow<Result<CreateEventResponse>> = flow {
        try {
            val response = eventApi.createEvent(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to create event: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun getEventOptimizations(request: EventOptimizationRequest): Flow<Result<EventOptimizations>> = flow {
        try {
            val optimizations = eventApi.getEventOptimizations(request)
            emit(Result.success(optimizations))
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun setupEventAutomation(eventId: String, request: AutomationRequest): Flow<Result<Unit>> = flow {
        try {
            val response = eventApi.setupEventAutomation(eventId, request)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to setup automation: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun autoGenerateEvent(request: AutoGenerateEventRequest): Flow<Result<CreateEventResponse>> = flow {
        try {
            val response = eventApi.autoGenerateEvent(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to auto-generate event: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    override suspend fun generateEventDescription(
        request: DescriptionGenerationRequest
    ): Flow<Result<DescriptionGenerationResponse>> = flow {
        try {
            val response = eventApi.generateEventDescription(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to generate description: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    override suspend fun processEventImages(
        images: List<String>
    ): Flow<Result<ImageProcessingResponse>> = flow {
        try {
            val response = eventApi.processEventImages(images)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to process images: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    override suspend fun processEventVideo(
        videoPath: String
    ): Flow<Result<VideoProcessingResponse>> = flow {
        try {
            val response = eventApi.processEventVideo(videoPath)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to process video: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
} 