package com.example.ibcmserver_init.ui.screens.event

import android.content.Intent
import android.net.Uri
import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.Review
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.data.repository.ReportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.util.UUID

@HiltViewModel
class EventDetailsViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository,
    private val reportRepository: ReportRepository
) : ViewModel() {

    private val _event = MutableStateFlow<Event?>(null)
    val event: StateFlow<Event?> = _event.asStateFlow()

    private val _isLoading = MutableStateFlow(false)
    val isLoading: StateFlow<Boolean> = _isLoading.asStateFlow()

    private val _error = MutableStateFlow<String?>(null)
    val error: StateFlow<String?> = _error.asStateFlow()

    private val _currentUserId = MutableStateFlow<String?>(null)
    val currentUserId: StateFlow<String?> = _currentUserId.asStateFlow()

    private val _snackbarMessage = MutableStateFlow<String?>(null)
    val snackbarMessage: StateFlow<String?> = _snackbarMessage.asStateFlow()

    init {
        loadCurrentUserId()
        loadEventDetails("0") // Assuming a default eventId
    }

    private fun loadCurrentUserId() {
        viewModelScope.launch {
            _currentUserId.value = userRepository.getCurrentUser()?.id
        }
    }

    fun loadEventDetails(eventId: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                _event.value = eventRepository.getEventById(eventId)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to load event details"
            } finally {
                _isLoading.value = false
            }
        }
    }

    fun addReview(rating: Int, comment: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                val currentEvent = _event.value ?: return@launch
                eventRepository.addEventReview(
                    eventId = currentEvent.id,
                    rating = rating,
                    comment = comment
                )
                // Reload event details to get updated reviews
                loadEventDetails(currentEvent.id)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to add review"
            }
        }
    }

    fun toggleReminder() {
        viewModelScope.launch {
            try {
                val currentEvent = _event.value ?: return@launch
                val updatedEvent = eventRepository.setReminder(
                    eventId = currentEvent.id,
                    enabled = !currentEvent.hasReminder
                )
                _event.value = updatedEvent
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to toggle reminder"
            }
        }
    }

    fun joinEvent() {
        viewModelScope.launch {
            try {
                _error.value = null
                val currentEvent = _event.value ?: return@launch
                eventRepository.joinEvent(currentEvent.id)
                _event.value = currentEvent.copy(
                    attendees = currentEvent.attendees + currentEvent.creatorId
                )
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to join event"
            }
        }
    }

    fun leaveEvent() {
        viewModelScope.launch {
            try {
                _error.value = null
                val currentEvent = _event.value ?: return@launch
                eventRepository.leaveEvent(currentEvent.id)
                _event.value = currentEvent.copy(
                    attendees = currentEvent.attendees - currentEvent.creatorId
                )
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to leave event"
            }
        }
    }

    fun addComment(text: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                val currentEvent = _event.value ?: return@launch
                eventRepository.addComment(
                    eventId = currentEvent.id,
                    text = text
                )
                // Reload event details to get updated comments
                loadEventDetails(currentEvent.id)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to add comment"
            }
        }
    }

    fun deleteComment(commentId: String) {
        viewModelScope.launch {
            try {
                _error.value = null
                val currentEvent = _event.value ?: return@launch
                eventRepository.deleteComment(
                    eventId = currentEvent.id,
                    commentId = commentId
                )
                // Reload event details to get updated comments
                loadEventDetails(currentEvent.id)
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to delete comment"
            }
        }
    }

    fun shareEvent() {
        // TODO: Implement sharing functionality
    }

    fun openDirections() {
        val currentEvent = _event.value ?: return
        val uri = Uri.parse("google.navigation:q=${currentEvent.latitude},${currentEvent.longitude}")
        // Create intent to open Google Maps (to be handled by the UI layer)
        val mapIntent = Intent(Intent.ACTION_VIEW, uri)
        mapIntent.setPackage("com.google.android.apps.maps")
    }

    fun openPhoto(photoUrl: String) {
        // Create intent to view photo in full screen (to be handled by the UI layer)
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(photoUrl))
    }

    fun clearError() {
        _error.value = null
    }

    fun reportEvent(reason: String) {
        viewModelScope.launch {
            try {
                _isLoading.value = true
                _error.value = null
                val report = Report(
                    id = UUID.randomUUID().toString(),
                    type = "EVENT",
                    targetId = event.value?.id ?: return,
                    reason = reason,
                    reporterId = currentUserId.value ?: return,
                    timestamp = System.currentTimeMillis(),
                    status = "PENDING"
                )
                reportRepository.submitReport(report)
                // Show success message
                _snackbarMessage.value = "Report submitted successfully"
            } catch (e: Exception) {
                _error.value = e.message ?: "Failed to submit report"
            } finally {
                _isLoading.value = false
            }
        }
    }
} 