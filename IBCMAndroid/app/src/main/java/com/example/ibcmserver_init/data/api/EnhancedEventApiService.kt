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
} 