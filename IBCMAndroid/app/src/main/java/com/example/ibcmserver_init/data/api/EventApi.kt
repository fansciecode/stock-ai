package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.ui.screens.event.*
import retrofit2.Response
import retrofit2.http.*
import okhttp3.MultipartBody

interface EventApi {
    @POST("api/events")
    suspend fun createEvent(@Body request: CreateEventRequest): Response<CreateEventResponse>

    @POST("api/events/optimize")
    suspend fun getEventOptimizations(@Body request: EventOptimizationRequest): EventOptimizations

    @POST("api/events/{eventId}/automation")
    suspend fun setupEventAutomation(
        @Path("eventId") eventId: String,
        @Body request: AutomationRequest
    ): Response<Unit>

    @POST("api/events/auto-generate")
    suspend fun autoGenerateEvent(@Body request: AutoGenerateEventRequest): Response<CreateEventResponse>

    @POST("api/events/generate-description")
    suspend fun generateEventDescription(@Body request: DescriptionGenerationRequest): Response<DescriptionGenerationResponse>

    @Multipart
    @POST("api/events/process-images")
    suspend fun processEventImages(@Part images: List<MultipartBody.Part>): Response<ImageProcessingResponse>

    @Multipart
    @POST("api/events/process-video")
    suspend fun processEventVideo(@Part video: MultipartBody.Part): Response<VideoProcessingResponse>
}

data class CreateEventRequest(
    val title: String,
    val description: String,
    val date: LocalDateTime,
    val latitude: Double?,
    val longitude: Double?,
    val city: String?,
    val category: String,
    val type: EventType,
    val maxCapacity: Int,
    val isPublic: Boolean,
    val tickets: List<TicketType>?,
    val products: List<ProductData>?,
    val media: EventMedia
)

data class EventOptimizationRequest(
    val eventType: EventType,
    val title: String,
    val expectedAttendance: Int,
    val description: String,
    val date: LocalDateTime,
    val location: LocationInfo,
    val category: String,
    val isPublic: Boolean
)

data class AutoGenerateEventRequest(
    val eventType: EventType,
    val title: String,
    val expectedAttendance: Int
)

data class DescriptionGenerationRequest(
    val eventType: EventType,
    val title: String,
    val category: String,
    val targetAudience: Int,
    val keywords: List<String>,
    val location: LocationInfo
)

data class DescriptionGenerationResponse(
    val description: String,
    val seoTags: List<String>,
    val suggestedHashtags: List<String>
)

data class ImageProcessingResponse(
    val optimizedImages: List<String>,
    val contentWarnings: List<ContentWarning>,
    val suggestedAltText: Map<String, String>,
    val optimizationMetrics: ImageOptimizationMetrics
)

data class VideoProcessingResponse(
    val optimizedVideos: List<String>,
    val thumbnails: List<String>,
    val previewGif: String,
    val contentWarnings: List<ContentWarning>,
    val optimizationMetrics: VideoOptimizationMetrics
)

data class ImageOptimizationMetrics(
    val originalSize: Long,
    val optimizedSize: Long,
    val compressionRatio: Double,
    val qualityScore: Double
)

data class VideoOptimizationMetrics(
    val originalSize: Long,
    val optimizedSize: Long,
    val duration: Double,
    val resolution: String,
    val bitrate: Int,
    val fps: Int
) 