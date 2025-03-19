package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.EnhancedEventApiService
import com.example.ibcmserver_init.data.model.event.*
import com.example.ibcmserver_init.utils.NetworkResult
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class EnhancedEventRepository @Inject constructor(
    private val apiService: EnhancedEventApiService
) {
    // Event CRUD operations
    suspend fun createEvent(event: EnhancedEvent): Flow<NetworkResult<EnhancedEvent>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createEvent(event)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create event: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getEvent(eventId: String): Flow<NetworkResult<EnhancedEvent>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getEvent(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch event: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getEvents(
        type: String? = null,
        category: String? = null,
        status: EventStatus? = null,
        page: Int = 1,
        limit: Int = 20
    ): Flow<NetworkResult<List<EnhancedEvent>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getEvents(type, category, status, page, limit)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch events: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Ticket management
    suspend fun createTicketType(
        eventId: String,
        ticketType: TicketType
    ): Flow<NetworkResult<TicketType>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createTicketType(eventId, ticketType)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create ticket type: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getTicketTypes(eventId: String): Flow<NetworkResult<List<TicketType>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getTicketTypes(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch ticket types: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Service management
    suspend fun createTimeSlots(
        eventId: String,
        timeSlots: List<TimeSlot>
    ): Flow<NetworkResult<List<TimeSlot>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createTimeSlots(eventId, timeSlots)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create time slots: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getTimeSlots(
        eventId: String,
        date: String? = null
    ): Flow<NetworkResult<List<TimeSlot>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getTimeSlots(eventId, date)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch time slots: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Product management
    suspend fun createProducts(
        eventId: String,
        products: List<Product>
    ): Flow<NetworkResult<List<Product>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createProducts(eventId, products)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create products: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getProducts(
        eventId: String,
        category: String? = null
    ): Flow<NetworkResult<List<Product>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getProducts(eventId, category)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch products: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Seating management
    suspend fun createSeatingArrangement(
        eventId: String,
        seatingArrangement: SeatingArrangement
    ): Flow<NetworkResult<SeatingArrangement>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createSeatingArrangement(eventId, seatingArrangement)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create seating arrangement: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getSeatingArrangement(eventId: String): Flow<NetworkResult<SeatingArrangement>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getSeatingArrangement(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch seating arrangement: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Venue management
    suspend fun createVenue(venue: Venue): Flow<NetworkResult<Venue>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createVenue(venue)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create venue: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getVenues(
        minCapacity: Int? = null,
        facilities: List<String>? = null
    ): Flow<NetworkResult<List<Venue>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getVenues(minCapacity, facilities)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch venues: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Media management
    suspend fun uploadMedia(
        eventId: String,
        media: MediaContent
    ): Flow<NetworkResult<MediaContent>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.uploadMedia(eventId, media)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to upload media: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getEventMedia(eventId: String): Flow<NetworkResult<List<MediaContent>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getEventMedia(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch media: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Catalog management
    suspend fun createCatalog(
        eventId: String,
        catalog: Catalog
    ): Flow<NetworkResult<Catalog>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.createCatalog(eventId, catalog)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to create catalog: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getCatalog(eventId: String): Flow<NetworkResult<Catalog>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getCatalog(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch catalog: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // AI-powered event operations
    suspend fun generateEventSuggestion(basicInfo: EventBasicInfo): Flow<NetworkResult<EnhancedEvent>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.generateEventSuggestion(basicInfo)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to generate event suggestion: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun optimizeEvent(eventId: String): Flow<NetworkResult<EventOptimization>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.optimizeEvent(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to optimize event: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun getEventAnalytics(eventId: String): Flow<NetworkResult<EventAnalytics>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.getEventAnalytics(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to fetch event analytics: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun generateMarketingMaterials(eventId: String): Flow<NetworkResult<MarketingMaterials>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.generateMarketingMaterials(eventId)
            if (response.isSuccessful && response.body() != null) {
                emit(NetworkResult.Success(response.body()!!))
            } else {
                emit(NetworkResult.Error("Failed to generate marketing materials: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    // Add these new functions for AI-powered features

    suspend fun generateSeatingRecommendations(eventId: String): Flow<NetworkResult<List<List<SeatInfo>>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.generateSeatingRecommendations(eventId)
            emit(NetworkResult.Success(response.recommendations))
        } catch (e: Exception) {
            emit(NetworkResult.Error("Failed to generate seating recommendations: ${e.message}"))
        }
    }

    suspend fun bookTickets(eventId: String, seats: List<SeatBooking>): Flow<NetworkResult<BookingResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.bookTickets(eventId, seats)
            emit(NetworkResult.Success(response))
        } catch (e: Exception) {
            emit(NetworkResult.Error("Failed to book tickets: ${e.message}"))
        }
    }

    suspend fun processEventMedia(eventId: String, mediaFiles: List<MediaFile>): Flow<NetworkResult<ProcessedMedia>> = flow {
        emit(NetworkResult.Loading())
        try {
            // Process images with AI
            val processedImages = mediaFiles.filter { it.type == MediaType.IMAGE }.map { file ->
                apiService.analyzeEventImage(file).also { analysis ->
                    // Apply AI recommendations for image optimization
                    if (analysis.quality.improvements.isNotEmpty()) {
                        apiService.optimizeImage(file, analysis.quality.improvements)
                    }
                }
            }

            // Process videos with AI
            val processedVideos = mediaFiles.filter { it.type == MediaType.VIDEO }.map { file ->
                apiService.analyzeVideo(file).also { analysis ->
                    // Generate video highlights and optimize
                    if (analysis.recommendations.improvements.isNotEmpty()) {
                        apiService.optimizeVideo(file, analysis.recommendations.improvements)
                    }
                }
            }

            emit(NetworkResult.Success(
                ProcessedMedia(
                    images = processedImages,
                    videos = processedVideos
                )
            ))
        } catch (e: Exception) {
            emit(NetworkResult.Error("Failed to process media: ${e.message}"))
        }
    }

    suspend fun generateEventHighlights(eventId: String): Flow<NetworkResult<EventHighlights>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = apiService.generateEventHighlights(eventId)
            emit(NetworkResult.Success(response))
        } catch (e: Exception) {
            emit(NetworkResult.Error("Failed to generate event highlights: ${e.message}"))
        }
    }
} 