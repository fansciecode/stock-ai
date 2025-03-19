package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.event.*
import retrofit2.Response
import retrofit2.http.*

interface EnhancedEventApiService {
    @POST("events")
    suspend fun createEvent(@Body event: EnhancedEvent): Response<EnhancedEvent>

    @GET("events/{id}")
    suspend fun getEvent(@Path("id") eventId: String): Response<EnhancedEvent>

    @GET("events")
    suspend fun getEvents(
        @Query("type") type: String? = null,
        @Query("category") category: String? = null,
        @Query("status") status: EventStatus? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<List<EnhancedEvent>>

    @PUT("events/{id}")
    suspend fun updateEvent(
        @Path("id") eventId: String,
        @Body event: EnhancedEvent
    ): Response<EnhancedEvent>

    @DELETE("events/{id}")
    suspend fun deleteEvent(@Path("id") eventId: String): Response<Unit>

    // Ticket-specific endpoints
    @POST("events/{id}/tickets")
    suspend fun createTicketType(
        @Path("id") eventId: String,
        @Body ticketType: TicketType
    ): Response<TicketType>

    @GET("events/{id}/tickets")
    suspend fun getTicketTypes(@Path("id") eventId: String): Response<List<TicketType>>

    @PUT("events/{eventId}/tickets/{ticketId}")
    suspend fun updateTicketType(
        @Path("eventId") eventId: String,
        @Path("ticketId") ticketId: String,
        @Body ticketType: TicketType
    ): Response<TicketType>

    // Service-specific endpoints
    @POST("events/{id}/timeslots")
    suspend fun createTimeSlots(
        @Path("id") eventId: String,
        @Body timeSlots: List<TimeSlot>
    ): Response<List<TimeSlot>>

    @GET("events/{id}/timeslots")
    suspend fun getTimeSlots(
        @Path("id") eventId: String,
        @Query("date") date: String? = null
    ): Response<List<TimeSlot>>

    @PUT("events/{eventId}/timeslots/{slotId}")
    suspend fun updateTimeSlot(
        @Path("eventId") eventId: String,
        @Path("slotId") slotId: String,
        @Body timeSlot: TimeSlot
    ): Response<TimeSlot>

    // Product-specific endpoints
    @POST("events/{id}/products")
    suspend fun createProducts(
        @Path("id") eventId: String,
        @Body products: List<Product>
    ): Response<List<Product>>

    @GET("events/{id}/products")
    suspend fun getProducts(
        @Path("id") eventId: String,
        @Query("category") category: String? = null
    ): Response<List<Product>>

    @PUT("events/{eventId}/products/{productId}")
    suspend fun updateProduct(
        @Path("eventId") eventId: String,
        @Path("productId") productId: String,
        @Body product: Product
    ): Response<Product>

    // Seating arrangement endpoints
    @POST("events/{id}/seating")
    suspend fun createSeatingArrangement(
        @Path("id") eventId: String,
        @Body seatingArrangement: SeatingArrangement
    ): Response<SeatingArrangement>

    @GET("events/{id}/seating")
    suspend fun getSeatingArrangement(@Path("id") eventId: String): Response<SeatingArrangement>

    @PUT("events/{id}/seating")
    suspend fun updateSeatingArrangement(
        @Path("id") eventId: String,
        @Body seatingArrangement: SeatingArrangement
    ): Response<SeatingArrangement>

    // Venue management endpoints
    @POST("venues")
    suspend fun createVenue(@Body venue: Venue): Response<Venue>

    @GET("venues/{id}")
    suspend fun getVenue(@Path("id") venueId: String): Response<Venue>

    @GET("venues")
    suspend fun getVenues(
        @Query("capacity") minCapacity: Int? = null,
        @Query("facilities") facilities: List<String>? = null
    ): Response<List<Venue>>

    // Media content endpoints
    @POST("events/{id}/media")
    suspend fun uploadMedia(
        @Path("id") eventId: String,
        @Body media: MediaContent
    ): Response<MediaContent>

    @GET("events/{id}/media")
    suspend fun getEventMedia(@Path("id") eventId: String): Response<List<MediaContent>>

    @DELETE("events/{eventId}/media/{mediaId}")
    suspend fun deleteMedia(
        @Path("eventId") eventId: String,
        @Path("mediaId") mediaId: String
    ): Response<Unit>

    // Analytics endpoints
    @GET("events/{id}/analytics")
    suspend fun getEventAnalytics(@Path("id") eventId: String): Response<EventMetadata>

    // Catalog management endpoints
    @POST("events/{id}/catalog")
    suspend fun createCatalog(
        @Path("id") eventId: String,
        @Body catalog: Catalog
    ): Response<Catalog>

    @GET("events/{id}/catalog")
    suspend fun getCatalog(@Path("id") eventId: String): Response<Catalog>

    @PUT("events/{id}/catalog")
    suspend fun updateCatalog(
        @Path("id") eventId: String,
        @Body catalog: Catalog
    ): Response<Catalog>

    // AI-powered event endpoints
    @POST("events/ai/generate")
    suspend fun generateEventSuggestion(
        @Body basicInfo: EventBasicInfo
    ): Response<EnhancedEvent>

    @POST("events/{id}/ai/optimize")
    suspend fun optimizeEvent(
        @Path("id") eventId: String
    ): Response<EventOptimization>

    @GET("events/{id}/ai/analytics")
    suspend fun getEventAnalytics(
        @Path("id") eventId: String
    ): Response<EventAnalytics>

    @POST("events/{id}/ai/marketing")
    suspend fun generateMarketingMaterials(
        @Path("id") eventId: String
    ): Response<MarketingMaterials>

    // Add these new API endpoints for AI-powered features

    @POST("events/{eventId}/seating-recommendations")
    suspend fun generateSeatingRecommendations(
        @Path("eventId") eventId: String
    ): SeatingRecommendationsResponse

    @POST("events/{eventId}/book-tickets")
    suspend fun bookTickets(
        @Path("eventId") eventId: String,
        @Body seats: List<SeatBooking>
    ): BookingResponse

    @POST("events/{eventId}/analyze-image")
    @Multipart
    suspend fun analyzeEventImage(
        @Part file: MultipartBody.Part
    ): ImageAnalysis

    @POST("events/{eventId}/analyze-video")
    @Multipart
    suspend fun analyzeVideo(
        @Part file: MultipartBody.Part
    ): VideoAnalysis

    @POST("events/{eventId}/optimize-image")
    @Multipart
    suspend fun optimizeImage(
        @Part file: MultipartBody.Part,
        @Part("improvements") improvements: List<String>
    ): OptimizedImage

    @POST("events/{eventId}/optimize-video")
    @Multipart
    suspend fun optimizeVideo(
        @Part file: MultipartBody.Part,
        @Part("improvements") improvements: List<String>
    ): OptimizedVideo

    @GET("events/{eventId}/highlights")
    suspend fun generateEventHighlights(
        @Path("eventId") eventId: String
    ): EventHighlights
}

// Data classes for responses

data class SeatingRecommendationsResponse(
    val recommendations: List<List<SeatInfo>>
)

data class BookingResponse(
    val bookingId: String,
    val tickets: List<TicketInfo>,
    val qrCodes: List<String>,
    val totalAmount: Double
)

data class ImageAnalysis(
    val content: ImageContent,
    val safety: SafetyCheck,
    val quality: QualityAssessment
)

data class VideoAnalysis(
    val content: VideoContent,
    val technical: TechnicalDetails,
    val recommendations: VideoRecommendations
)

data class OptimizedImage(
    val url: String,
    val size: Long,
    val format: String,
    val dimensions: Dimensions
)

data class OptimizedVideo(
    val url: String,
    val size: Long,
    val format: String,
    val quality: String,
    val duration: Long
)

data class EventHighlights(
    val clips: List<VideoClip>,
    val thumbnails: List<String>,
    val summary: String
)

// Supporting data classes

data class ImageContent(
    val description: String,
    val tags: List<String>,
    val category: String
)

data class SafetyCheck(
    val isAppropriate: Boolean,
    val warnings: List<String>,
    val restrictions: List<String>
)

data class QualityAssessment(
    val score: Double,
    val improvements: List<String>,
    val optimization: String
)

data class VideoContent(
    val summary: String,
    val topics: List<String>,
    val timeline: List<TimelineEvent>
)

data class TechnicalDetails(
    val quality: String,
    val duration: Long,
    val format: String
)

data class VideoRecommendations(
    val improvements: List<String>,
    val optimization: String,
    val engagement: List<String>
)

data class Dimensions(
    val width: Int,
    val height: Int
)

data class VideoClip(
    val url: String,
    val startTime: Long,
    val duration: Long,
    val description: String
)

data class TimelineEvent(
    val timestamp: Long,
    val description: String,
    val type: String
)

data class TicketInfo(
    val ticketId: String,
    val seatInfo: SeatInfo,
    val qrCode: String,
    val status: String
) 