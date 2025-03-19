package com.example.ibcmserver_init.ui.screens.event

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.api.*
import com.example.ibcmserver_init.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.time.LocalDateTime
import javax.inject.Inject

@HiltViewModel
class CreateEventViewModel @Inject constructor(
    private val eventRepository: EventRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(CreateEventUiState())
    val uiState: StateFlow<CreateEventUiState> = _uiState.asStateFlow()

    private val _eventCreationState = MutableStateFlow<EventCreationState>(EventCreationState.Idle)
    val eventCreationState: StateFlow<EventCreationState> = _eventCreationState.asStateFlow()

    private val _mediaProcessingState = MutableStateFlow<MediaProcessingState>(MediaProcessingState.Idle)
    val mediaProcessingState: StateFlow<MediaProcessingState> = _mediaProcessingState.asStateFlow()

    fun updateEventState(update: (CreateEventUiState) -> CreateEventUiState) {
        _uiState.update(update)
    }

    fun generateDescription() {
        viewModelScope.launch {
            _mediaProcessingState.value = MediaProcessingState.Loading
            val currentState = _uiState.value

            val request = DescriptionGenerationRequest(
                eventType = currentState.eventType,
                title = currentState.title,
                category = currentState.category,
                targetAudience = currentState.maxCapacity,
                keywords = listOf(currentState.category, currentState.eventType.name),
                location = LocationInfo(
                    latitude = currentState.latitude,
                    longitude = currentState.longitude,
                    city = currentState.city
                )
            )

            eventRepository.generateEventDescription(request)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _uiState.update { state ->
                                state.copy(
                                    description = response.description,
                                    seoTags = response.seoTags,
                                    hashtags = response.suggestedHashtags
                                )
                            }
                            _mediaProcessingState.value = MediaProcessingState.DescriptionGenerated(response)
                        },
                        onFailure = { error ->
                            _mediaProcessingState.value = MediaProcessingState.Error(error.message ?: "Failed to generate description")
                        }
                    )
                }
        }
    }

    fun processEventImages(images: List<String>) {
        viewModelScope.launch {
            _mediaProcessingState.value = MediaProcessingState.Loading
            
            eventRepository.processEventImages(images)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _uiState.update { state ->
                                state.copy(
                                    media = state.media.copy(
                                        images = response.optimizedImages,
                                        contentWarnings = response.contentWarnings,
                                        suggestedAltText = response.suggestedAltText
                                    )
                                )
                            }
                            _mediaProcessingState.value = MediaProcessingState.ImagesProcessed(response)
                        },
                        onFailure = { error ->
                            _mediaProcessingState.value = MediaProcessingState.Error(error.message ?: "Failed to process images")
                        }
                    )
                }
        }
    }

    fun processEventVideo(videoPath: String) {
        viewModelScope.launch {
            _mediaProcessingState.value = MediaProcessingState.Loading

            eventRepository.processEventVideo(videoPath)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _uiState.update { state ->
                                state.copy(
                                    media = state.media.copy(
                                        reels = response.optimizedVideos,
                                        thumbnails = response.thumbnails,
                                        previewGif = response.previewGif,
                                        contentWarnings = response.contentWarnings
                                    )
                                )
                            }
                            _mediaProcessingState.value = MediaProcessingState.VideoProcessed(response)
                        },
                        onFailure = { error ->
                            _mediaProcessingState.value = MediaProcessingState.Error(error.message ?: "Failed to process video")
                        }
                    )
                }
        }
    }

    fun getOptimizations() {
        viewModelScope.launch {
            _eventCreationState.value = EventCreationState.Loading
            val currentState = _uiState.value
            
            val request = EventOptimizationRequest(
                eventType = currentState.eventType,
                title = currentState.title,
                expectedAttendance = currentState.maxCapacity,
                description = currentState.description,
                date = currentState.date,
                location = LocationInfo(
                    latitude = currentState.latitude,
                    longitude = currentState.longitude,
                    city = currentState.city
                ),
                category = currentState.category,
                isPublic = currentState.isPublic
            )

            eventRepository.getEventOptimizations(request)
                .collect { result ->
                    result.fold(
                        onSuccess = { optimizations ->
                            _uiState.update { state ->
                                state.copy(
                                    title = optimizations.suggestedTitle ?: state.title,
                                    description = optimizations.suggestedDescription ?: state.description,
                                    date = optimizations.suggestedDate ?: state.date,
                                    maxCapacity = optimizations.suggestedCapacity ?: state.maxCapacity
                                )
                            }
                            _eventCreationState.value = EventCreationState.OptimizationsApplied
                        },
                        onFailure = { error ->
                            _eventCreationState.value = EventCreationState.Error(error.message ?: "Failed to get optimizations")
                        }
                    )
                }
        }
    }

    fun createEvent() {
        viewModelScope.launch {
            _eventCreationState.value = EventCreationState.Loading
            val currentState = _uiState.value

            val request = CreateEventRequest(
                title = currentState.title,
                description = currentState.description,
                date = currentState.date,
                latitude = currentState.latitude,
                longitude = currentState.longitude,
                city = currentState.city,
                category = currentState.category,
                type = currentState.eventType,
                maxCapacity = currentState.maxCapacity,
                isPublic = currentState.isPublic,
                tickets = currentState.tickets,
                products = currentState.products,
                media = currentState.media
            )

            eventRepository.createEvent(request)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            setupEventAutomation(response.eventId)
                            _eventCreationState.value = EventCreationState.Success(response)
                        },
                        onFailure = { error ->
                            _eventCreationState.value = EventCreationState.Error(error.message ?: "Failed to create event")
                        }
                    )
                }
        }
    }

    private fun setupEventAutomation(eventId: String) {
        viewModelScope.launch {
            val currentState = _uiState.value
            val request = AutomationRequest(
                eventType = currentState.eventType,
                automationType = when (currentState.eventType) {
                    EventType.BOOKING -> AutomationType.TICKET_MANAGEMENT
                    EventType.MARKETPLACE -> AutomationType.ORDER_MANAGEMENT
                    EventType.HYBRID -> AutomationType.HYBRID_MANAGEMENT
                    else -> AutomationType.BASIC
                }
            )

            eventRepository.setupEventAutomation(eventId, request)
                .collect { result ->
                    result.fold(
                        onSuccess = { /* Automation setup successful */ },
                        onFailure = { error ->
                            // Log error but don't update UI state since event was created successfully
                            println("Failed to setup automation: ${error.message}")
                        }
                    )
                }
        }
    }

    fun autoGenerateEvent() {
        viewModelScope.launch {
            _eventCreationState.value = EventCreationState.Loading
            val currentState = _uiState.value

            val request = AutoGenerateEventRequest(
                eventType = currentState.eventType,
                title = currentState.title,
                expectedAttendance = currentState.maxCapacity
            )

            eventRepository.autoGenerateEvent(request)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _uiState.update { state ->
                                state.copy(
                                    title = response.title,
                                    description = response.description,
                                    date = response.date,
                                    latitude = response.latitude,
                                    longitude = response.longitude,
                                    city = response.city,
                                    category = response.category,
                                    maxCapacity = response.maxCapacity,
                                    isPublic = response.isPublic,
                                    tickets = response.tickets,
                                    products = response.products,
                                    media = response.media
                                )
                            }
                            _eventCreationState.value = EventCreationState.AutoGenerated
                        },
                        onFailure = { error ->
                            _eventCreationState.value = EventCreationState.Error(error.message ?: "Failed to auto-generate event")
                        }
                    )
                }
        }
    }

    fun validateMedia(): Boolean {
        val currentState = _uiState.value.media
        return currentState.contentWarnings?.all { !it.isCritical } ?: true
    }
}

sealed class EventCreationState {
    object Idle : EventCreationState()
    object Loading : EventCreationState()
    object OptimizationsApplied : EventCreationState()
    object AutoGenerated : EventCreationState()
    data class Success(val response: CreateEventResponse) : EventCreationState()
    data class Error(val message: String) : EventCreationState()
}

data class CreateEventUiState(
    val eventType: EventType = EventType.INFORMATIVE,
    val title: String = "",
    val description: String = "",
    val date: LocalDateTime = LocalDateTime.now(),
    val latitude: Double? = null,
    val longitude: Double? = null,
    val city: String? = null,
    val category: String = "",
    val maxCapacity: Int = 0,
    val isPublic: Boolean = true,
    val tickets: List<TicketType>? = null,
    val products: List<ProductData>? = null,
    val media: EventMediaState = EventMediaState(),
    val seoTags: List<String> = emptyList(),
    val hashtags: List<String> = emptyList()
)

data class EventMediaState(
    val images: List<String> = emptyList(),
    val reels: List<String> = emptyList(),
    val thumbnails: List<String> = emptyList(),
    val previewGif: String? = null,
    val contentWarnings: List<ContentWarning>? = null,
    val suggestedAltText: Map<String, String> = emptyMap()
)

data class ContentWarning(
    val type: String,
    val message: String,
    val isCritical: Boolean
)

data class EventOptimizations(
    val suggestedTitle: String? = null,
    val suggestedDescription: String? = null,
    val suggestedCapacity: Int? = null,
    val suggestedTickets: List<TicketType>? = null,
    val suggestedProducts: List<ProductData>? = null,
    val marketingRecommendations: List<String>? = null,
    val timingRecommendations: List<String>? = null
)

data class EventMedia(
    val images: List<String>,
    val reels: List<String>
)

data class CreateEventResponse(
    val eventId: String,
    val success: Boolean,
    val message: String?
)

data class AutomationRequest(
    val attendeeManagement: Boolean,
    val venueManagement: Boolean,
    val scheduleManagement: Boolean,
    val communicationSystem: Boolean,
    val budgetManagement: Boolean,
    val riskManagement: Boolean
)

sealed class MediaProcessingState {
    object Idle : MediaProcessingState()
    object Loading : MediaProcessingState()
    data class DescriptionGenerated(val response: DescriptionGenerationResponse) : MediaProcessingState()
    data class ImagesProcessed(val response: ImageProcessingResponse) : MediaProcessingState()
    data class VideoProcessed(val response: VideoProcessingResponse) : MediaProcessingState()
    data class Error(val message: String) : MediaProcessingState()
} 