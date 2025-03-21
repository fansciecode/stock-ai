package com.example.ibcmserver_init.ui.screens.security

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.api.*
import com.example.ibcmserver_init.data.repository.SecurityRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SecurityViewModel @Inject constructor(
    private val securityRepository: SecurityRepository
) : ViewModel() {

    private val _securityState = MutableStateFlow<SecurityState>(SecurityState.Idle)
    val securityState: StateFlow<SecurityState> = _securityState.asStateFlow()

    fun reportEvent(
        eventId: String,
        reportType: ReportType,
        description: String,
        evidence: List<String>? = null,
        reporterId: String
    ) {
        viewModelScope.launch {
            _securityState.value = SecurityState.Loading
            securityRepository.reportEvent(eventId, reportType, description, evidence, reporterId)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _securityState.value = SecurityState.ReportSubmitted(response)
                        },
                        onFailure = { error ->
                            _securityState.value = SecurityState.Error(error.message ?: "Failed to submit report")
                        }
                    )
                }
        }
    }

    fun verifyEvent(eventId: String, event: Event, organizer: User) {
        viewModelScope.launch {
            _securityState.value = SecurityState.Loading
            
            val eventDetails = EventVerificationDetails(
                title = event.title,
                description = event.description,
                date = event.date.toString(),
                location = event.location,
                capacity = event.maxCapacity,
                ticketPrices = event.tickets?.map { it.price },
                category = event.category
            )

            val organizerDetails = OrganizerVerificationDetails(
                organizerId = organizer.id,
                verificationStatus = organizer.verificationStatus,
                previousEvents = organizer.eventCount,
                rating = organizer.rating
            )

            securityRepository.verifyEvent(eventId, eventDetails, organizerDetails)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _securityState.value = SecurityState.EventVerified(response)
                        },
                        onFailure = { error ->
                            _securityState.value = SecurityState.Error(error.message ?: "Failed to verify event")
                        }
                    )
                }
        }
    }

    fun checkSpam(content: String, contentType: ContentType, metadata: Map<String, String>? = null) {
        viewModelScope.launch {
            _securityState.value = SecurityState.Loading
            securityRepository.checkSpam(content, contentType, metadata)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _securityState.value = SecurityState.SpamChecked(response)
                        },
                        onFailure = { error ->
                            _securityState.value = SecurityState.Error(error.message ?: "Failed to check spam")
                        }
                    )
                }
        }
    }

    fun detectFraud(
        eventId: String,
        transactionDetails: TransactionDetails? = null,
        organizerHistory: OrganizerHistory? = null
    ) {
        viewModelScope.launch {
            _securityState.value = SecurityState.Loading
            securityRepository.detectFraud(eventId, transactionDetails, organizerHistory)
                .collect { result ->
                    result.fold(
                        onSuccess = { response ->
                            _securityState.value = SecurityState.FraudDetected(response)
                        },
                        onFailure = { error ->
                            _securityState.value = SecurityState.Error(error.message ?: "Failed to detect fraud")
                        }
                    )
                }
        }
    }
}

sealed class SecurityState {
    object Idle : SecurityState()
    object Loading : SecurityState()
    data class ReportSubmitted(val response: EventReportResponse) : SecurityState()
    data class EventVerified(val response: EventVerificationResponse) : SecurityState()
    data class SpamChecked(val response: SpamCheckResponse) : SecurityState()
    data class FraudDetected(val response: FraudDetectionResponse) : SecurityState()
    data class Error(val message: String) : SecurityState()
}

// Placeholder data classes for Event and User
data class Event(
    val title: String,
    val description: String,
    val date: String,
    val location: String,
    val maxCapacity: Int,
    val tickets: List<Ticket>?,
    val category: String
)

data class User(
    val id: String,
    val verificationStatus: String,
    val eventCount: Int,
    val rating: Double
)

data class Ticket(
    val price: Double
) 