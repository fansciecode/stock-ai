package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.AnalyticsApi
import com.example.ibcmserver_init.data.api.ContentAnalyticsApi
import com.example.ibcmserver_init.data.api.UserActivityApi
import com.example.ibcmserver_init.data.model.analytics.*
import com.example.ibcmserver_init.data.service.DeviceInfoService
import com.example.ibcmserver_init.data.service.LocationService
import com.example.ibcmserver_init.data.service.UserService
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AnalyticsRepository @Inject constructor(
    private val userActivityApi: UserActivityApi,
    private val analyticsApi: AnalyticsApi,
    private val contentAnalyticsApi: ContentAnalyticsApi,
    private val userService: UserService,
    private val locationService: LocationService,
    private val deviceInfoService: DeviceInfoService
) {
    suspend fun trackEventView(eventId: String, source: String): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()
            val deviceInfo = deviceInfoService.getDeviceInfo()

            val activity = UserActivityData(
                userId = userId,
                eventId = eventId,
                action = "view",
                timestamp = Instant.now().toString(),
                context = ActivityContext(
                    location = location,
                    timeOfDay = LocalTime.now().hour,
                    dayOfWeek = LocalDate.now().dayOfWeek.value
                )
            )

            val response = userActivityApi.trackUserActivity(activity)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track event view")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun trackSearchQuery(query: String, filters: Map<String, Any>): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()

            val searchData = SearchAnalyticsData(
                userId = userId,
                query = query,
                filters = filters,
                timestamp = Instant.now().toString(),
                location = location
            )

            val response = analyticsApi.trackSearchQuery(searchData)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track search query")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun trackUserInterest(category: String, source: String): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()

            val interestData = UserInterestData(
                userId = userId,
                category = category,
                timestamp = Instant.now().toString(),
                context = InterestContext(
                    location = location,
                    timeOfDay = LocalTime.now().hour,
                    dayOfWeek = LocalDate.now().dayOfWeek.value,
                    source = source
                )
            )

            val response = userActivityApi.trackUserInterest(interestData)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track user interest")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun trackVoiceInteraction(command: String, intent: String): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()
            val deviceInfo = deviceInfoService.getDeviceInfo()

            val voiceData = VoiceAnalyticsData(
                userId = userId,
                command = command,
                intent = intent,
                timestamp = Instant.now().toString(),
                context = VoiceContext(
                    location = location,
                    timeOfDay = LocalTime.now().hour,
                    dayOfWeek = LocalDate.now().dayOfWeek.value,
                    deviceInfo = deviceInfo,
                    audioQuality = AudioQuality(
                        quality = "high",
                        score = 0.9,
                        enhanced = true
                    )
                )
            )

            val response = analyticsApi.trackVoiceInteraction(voiceData)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track voice interaction")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun trackContentView(contentId: String, contentType: String, source: String): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()

            val contentData = ContentViewData(
                userId = userId,
                contentId = contentId,
                contentType = contentType,
                timestamp = Instant.now().toString(),
                context = ContentContext(
                    location = location,
                    timeOfDay = LocalTime.now().hour,
                    dayOfWeek = LocalDate.now().dayOfWeek.value,
                    source = source,
                    viewDuration = 0L // This should be updated when the view ends
                )
            )

            val response = contentAnalyticsApi.trackContentView(contentData)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track content view")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun trackContentInteraction(
        contentId: String,
        interactionType: String,
        source: String
    ): Flow<Result<Unit>> = flow {
        try {
            val userId = userService.getCurrentUserId()
            val location = locationService.getCurrentLocation()

            val interactionData = ContentInteractionData(
                userId = userId,
                contentId = contentId,
                interactionType = interactionType,
                timestamp = Instant.now().toString(),
                context = ContentContext(
                    location = location,
                    timeOfDay = LocalTime.now().hour,
                    dayOfWeek = LocalDate.now().dayOfWeek.value,
                    source = source,
                    viewDuration = 0L
                )
            )

            val response = contentAnalyticsApi.trackContentInteraction(interactionData)
            if (response.isSuccessful) {
                emit(Result.success(Unit))
            } else {
                emit(Result.failure(Exception("Failed to track content interaction")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
} 