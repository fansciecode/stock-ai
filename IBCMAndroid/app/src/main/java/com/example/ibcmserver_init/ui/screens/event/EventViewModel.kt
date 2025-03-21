package com.example.ibcmserver_init.ui.screens.event

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.api.*
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.SecurityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EventViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val securityRepository: SecurityRepository
) : ViewModel() {

    private val _eventState = MutableStateFlow(EventDisplayState())
    val eventState: StateFlow<EventDisplayState> = _eventState.asStateFlow()

    fun loadEvent(eventId: String) {
        viewModelScope.launch {
            _eventState.value = _eventState.value.copy(isLoading = true)
            
            try {
                // Load event details
                val event = eventRepository.getEvent(eventId)
                
                // Verify event security
                val verificationResponse = securityRepository.verifyEvent(
                    eventId = eventId,
                    eventDetails = EventVerificationDetails(
                        title = event.title,
                        description = event.description,
                        date = event.date,
                        location = event.location,
                        capacity = event.maxCapacity,
                        ticketPrices = event.tickets?.map { it.price },
                        category = event.category
                    ),
                    organizerDetails = OrganizerVerificationDetails(
                        organizerId = event.organizerId,
                        verificationStatus = event.organizerVerificationStatus,
                        previousEvents = event.organizerEventCount,
                        rating = event.organizerRating
                    )
                ).first()

                // Check for spam content
                val spamCheckResponse = securityRepository.checkSpam(
                    content = event.description,
                    contentType = ContentType.EVENT_DESCRIPTION,
                    metadata = mapOf(
                        "eventId" to eventId,
                        "category" to event.category
                    )
                ).first()

                // Update state with event and security information
                _eventState.value = _eventState.value.copy(
                    isLoading = false,
                    event = event,
                    securityWarnings = verificationResponse.getOrNull()?.warnings,
                    isSpam = spamCheckResponse.getOrNull()?.isSpam ?: false,
                    spamScore = spamCheckResponse.getOrNull()?.spamScore ?: 0.0
                )
            } catch (e: Exception) {
                _eventState.value = _eventState.value.copy(
                    isLoading = false,
                    error = e.message ?: "Failed to load event"
                )
            }
        }
    }

    fun getCurrentUserId(): String {
        // Implement this to get the current user's ID from your auth system
        return "current_user_id"
    }
}

data class EventDisplayState(
    val isLoading: Boolean = false,
    val event: Event? = null,
    val error: String? = null,
    val securityWarnings: List<SecurityWarning>? = null,
    val isSpam: Boolean = false,
    val spamScore: Double = 0.0
)

data class Event(
    val id: String,
    val title: String,
    val description: String,
    val date: String,
    val location: String,
    val maxCapacity: Int,
    val tickets: List<Ticket>?,
    val category: String,
    val organizerId: String,
    val organizerVerificationStatus: String,
    val organizerEventCount: Int,
    val organizerRating: Double
) 