package com.example.ibcmserver_init.ui.screens.review

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.review.EventReview
import com.example.ibcmserver_init.data.network.EventReviewService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EventReviewViewModel @Inject constructor(
    private val reviewService: EventReviewService
) {
    private val _uiState = MutableStateFlow<EventReviewUiState>(EventReviewUiState.Loading)
    val uiState: StateFlow<EventReviewUiState> = _uiState.asStateFlow()

    fun loadReviews(eventId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = EventReviewUiState.Loading
                val reviews = reviewService.getEventReviews(eventId)
                val stats = reviewService.getReviewAnalytics(eventId)
                _uiState.value = EventReviewUiState.Success(reviews, stats)
            } catch (e: Exception) {
                _uiState.value = EventReviewUiState.Error(e.message ?: "Failed to load reviews")
            }
        }
    }

    fun submitReview(eventId: String, rating: Int, comment: String) {
        viewModelScope.launch {
            try {
                _uiState.value = EventReviewUiState.Loading
                reviewService.createEventReview(eventId, rating, comment)
                loadReviews(eventId) // Reload reviews after submission
            } catch (e: Exception) {
                _uiState.value = EventReviewUiState.Error(e.message ?: "Failed to submit review")
            }
        }
    }

    fun markReviewHelpful(eventId: String, reviewId: String) {
        viewModelScope.launch {
            try {
                reviewService.markReviewHelpful(eventId, reviewId)
                loadReviews(eventId) // Reload reviews after marking helpful
            } catch (e: Exception) {
                _uiState.value = EventReviewUiState.Error(e.message ?: "Failed to mark review as helpful")
            }
        }
    }

    fun reportReview(eventId: String, reviewId: String, reason: String) {
        viewModelScope.launch {
            try {
                reviewService.reportReview(eventId, reviewId, reason)
                _uiState.value = EventReviewUiState.ReviewReported
            } catch (e: Exception) {
                _uiState.value = EventReviewUiState.Error(e.message ?: "Failed to report review")
            }
        }
    }

    fun respondToReview(eventId: String, reviewId: String, comment: String) {
        viewModelScope.launch {
            try {
                reviewService.respondToReview(eventId, reviewId, comment)
                loadReviews(eventId) // Reload reviews after responding
            } catch (e: Exception) {
                _uiState.value = EventReviewUiState.Error(e.message ?: "Failed to respond to review")
            }
        }
    }
}

sealed class EventReviewUiState {
    object Loading : EventReviewUiState()
    data class Success(
        val reviews: List<EventReview>,
        val stats: ReviewStats
    ) : EventReviewUiState()
    data class Error(val message: String) : EventReviewUiState()
    object ReviewReported : EventReviewUiState()
}

data class ReviewStats(
    val averageRating: Float,
    val totalReviews: Int,
    val ratingDistribution: Map<Int, Int>,
    val helpfulCount: Int = 0,
    val reportedCount: Int = 0,
    val responseRate: Float = 0f
) 