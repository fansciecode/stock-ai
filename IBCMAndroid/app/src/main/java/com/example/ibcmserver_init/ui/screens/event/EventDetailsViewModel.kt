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
import com.example.ibcmserver_init.data.model.Reel
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.utils.NetworkUtils
import com.example.ibcmserver_init.utils.Resource
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.text.SimpleDateFormat
import java.util.*

data class EventDetailsUiState(
    val event: Event? = null,
    val reviews: List<Review> = emptyList(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isJoined: Boolean = false,
    val isReminderSet: Boolean = false,
    val userRating: Float = 0f,
    val userReview: String = "",
    val isOffline: Boolean = false,
    val shareUrl: String? = null,
    val selectedReel: Reel? = null
)

@HiltViewModel
class EventDetailsViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository,
    private val networkUtils: NetworkUtils,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val eventId: String = checkNotNull(savedStateHandle["eventId"])
    private val _uiState = MutableStateFlow(EventDetailsUiState())
    val uiState: StateFlow<EventDetailsUiState> = _uiState.asStateFlow()

    init {
        loadEventDetails()
        observeNetworkState()
    }

    private fun observeNetworkState() {
        viewModelScope.launch {
            networkUtils.observeNetworkState().collect { networkState ->
                _uiState.update { it.copy(isOffline = !networkUtils.isNetworkAvailable()) }
            }
        }
    }

    private fun loadEventDetails() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                // Load event details
                val event = eventRepository.getEventById(eventId)
                
                // Load reviews
                eventRepository.getEventReviews(eventId).collect { reviews ->
                    _uiState.update { state ->
                        state.copy(
                            event = event,
                            reviews = reviews,
                            isLoading = false,
                            error = null
                        )
                    }
                }

                // Check if user has joined
                val currentUser = userRepository.getCurrentUser()
                val isJoined = event.attendees.any { it.id == currentUser.id }
                val userReview = reviews.find { it.userId == currentUser.id }

                _uiState.update { state ->
                    state.copy(
                        isJoined = isJoined,
                        userRating = userReview?.rating ?: 0f,
                        userReview = userReview?.comment ?: ""
                    )
                }

            } catch (e: Exception) {
                _uiState.update {
                    it.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load event details"
                    )
                }
            }
        }
    }

    fun joinEvent() {
        viewModelScope.launch {
            try {
                eventRepository.joinEvent(eventId).onSuccess { updatedEvent ->
                    _uiState.update { 
                        it.copy(
                            event = updatedEvent,
                            isJoined = true
                        )
                    }
                }.onFailure { error ->
                    _uiState.update { 
                        it.copy(error = error.message ?: "Failed to join event")
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to join event")
                }
            }
        }
    }

    fun leaveEvent() {
        viewModelScope.launch {
            try {
                eventRepository.leaveEvent(eventId).onSuccess { updatedEvent ->
                    _uiState.update { 
                        it.copy(
                            event = updatedEvent,
                            isJoined = false
                        )
                    }
                }.onFailure { error ->
                    _uiState.update { 
                        it.copy(error = error.message ?: "Failed to leave event")
                    }
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to leave event")
                }
            }
        }
    }

    fun submitReview(rating: Float, review: String) {
        viewModelScope.launch {
            try {
                val updatedEvent = eventRepository.rateEvent(eventId, rating, review)
                _uiState.update { 
                    it.copy(
                        event = updatedEvent,
                        userRating = rating,
                        userReview = review
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to submit review")
                }
            }
        }
    }

    fun toggleReminder() {
        viewModelScope.launch {
            try {
                val currentState = _uiState.value.isReminderSet
                val updatedEvent = eventRepository.setReminder(eventId, !currentState)
                _uiState.update { 
                    it.copy(
                        event = updatedEvent,
                        isReminderSet = !currentState
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to update reminder")
                }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun refresh() {
        loadEventDetails()
    }

    fun addComment(text: String) {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(error = null) }
                val currentEvent = _uiState.value.event ?: return@launch
                eventRepository.addComment(
                    eventId = currentEvent.id,
                    text = text
                )
                // Reload event details to get updated comments
                loadEventDetails()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to add comment") }
            }
        }
    }

    fun deleteComment(commentId: String) {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(error = null) }
                val currentEvent = _uiState.value.event ?: return@launch
                eventRepository.deleteComment(
                    eventId = currentEvent.id,
                    commentId = commentId
                )
                // Reload event details to get updated comments
                loadEventDetails()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to delete comment") }
            }
        }
    }

    fun shareEvent() {
        viewModelScope.launch {
            try {
                val event = _uiState.value.event ?: return@launch
                val shareUrl = eventRepository.getShareableLink(event.id)
                val shareText = buildString {
                    append("Check out this event: ${event.title}\n\n")
                    append("📅 ${SimpleDateFormat("EEEE, MMM dd, yyyy 'at' hh:mm a", Locale.getDefault()).format(event.date)}\n")
                    append("📍 ${event.location.address}, ${event.location.city}\n\n")
                    append(shareUrl)
                }
                _uiState.update { it.copy(shareUrl = shareText) }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to generate share link")
                }
            }
        }
    }

    fun clearShareUrl() {
        _uiState.update { it.copy(shareUrl = null) }
    }

    fun openDirections() {
        val event = _uiState.value.event ?: return
        val uri = Uri.parse("google.navigation:q=${event.latitude},${event.longitude}")
        // Create intent to open Google Maps (to be handled by the UI layer)
        val mapIntent = Intent(Intent.ACTION_VIEW, uri)
        mapIntent.setPackage("com.google.android.apps.maps")
    }

    fun openPhoto(photoUrl: String) {
        // Create intent to view photo in full screen (to be handled by the UI layer)
        val intent = Intent(Intent.ACTION_VIEW, Uri.parse(photoUrl))
    }

    fun likeReel(reelId: String) {
        viewModelScope.launch {
            try {
                val event = _uiState.value.event ?: return@launch
                eventRepository.likeReel(event.id, reelId).onSuccess { updatedEvent ->
                    _uiState.update { it.copy(event = updatedEvent) }
                }.onFailure { error ->
                    _uiState.update { it.copy(error = error.message ?: "Failed to like reel") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to like reel") }
            }
        }
    }

    fun commentOnReel(reelId: String, comment: String) {
        viewModelScope.launch {
            try {
                val event = _uiState.value.event ?: return@launch
                eventRepository.commentOnReel(event.id, reelId, comment).onSuccess { updatedEvent ->
                    _uiState.update { it.copy(event = updatedEvent) }
                }.onFailure { error ->
                    _uiState.update { it.copy(error = error.message ?: "Failed to comment on reel") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to comment on reel") }
            }
        }
    }

    fun shareReel(reelId: String) {
        viewModelScope.launch {
            try {
                val event = _uiState.value.event ?: return@launch
                val reel = event.reels.find { it.id == reelId } ?: return@launch
                val shareUrl = eventRepository.getReelShareableLink(event.id, reelId)
                val shareText = buildString {
                    append("Check out this event reel: ${event.title}\n\n")
                    append("${reel.description}\n\n")
                    append(shareUrl)
                }
                _uiState.update { it.copy(shareUrl = shareText) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Failed to share reel") }
            }
        }
    }

    fun selectReel(reelId: String?) {
        val selectedReel = if (reelId == null) null else {
            _uiState.value.event?.reels?.find { it.id == reelId }
        }
        _uiState.update { it.copy(selectedReel = selectedReel) }
    }
} 