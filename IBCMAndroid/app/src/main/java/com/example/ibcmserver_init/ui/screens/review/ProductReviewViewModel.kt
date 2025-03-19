package com.example.ibcmserver_init.ui.screens.review

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.review.ProductReview
import com.example.ibcmserver_init.data.network.ProductReviewService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductReviewViewModel @Inject constructor(
    private val reviewService: ProductReviewService
) {
    private val _uiState = MutableStateFlow<ProductReviewUiState>(ProductReviewUiState.Loading)
    val uiState: StateFlow<ProductReviewUiState> = _uiState.asStateFlow()

    fun loadReviews(productId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = ProductReviewUiState.Loading
                val reviews = reviewService.getProductReviews(productId)
                val stats = reviewService.getReviewAnalytics(productId)
                _uiState.value = ProductReviewUiState.Success(reviews, stats)
            } catch (e: Exception) {
                _uiState.value = ProductReviewUiState.Error(e.message ?: "Failed to load reviews")
            }
        }
    }

    fun submitReview(
        productId: String,
        rating: Int,
        title: String,
        comment: String,
        media: List<String>
    ) {
        viewModelScope.launch {
            try {
                _uiState.value = ProductReviewUiState.Loading
                reviewService.createProductReview(productId, rating, title, comment, media)
                loadReviews(productId) // Reload reviews after submission
            } catch (e: Exception) {
                _uiState.value = ProductReviewUiState.Error(e.message ?: "Failed to submit review")
            }
        }
    }

    fun markReviewHelpful(productId: String, reviewId: String) {
        viewModelScope.launch {
            try {
                reviewService.markReviewHelpful(productId, reviewId)
                loadReviews(productId) // Reload reviews after marking helpful
            } catch (e: Exception) {
                _uiState.value = ProductReviewUiState.Error(e.message ?: "Failed to mark review as helpful")
            }
        }
    }

    fun reportReview(productId: String, reviewId: String, reason: String) {
        viewModelScope.launch {
            try {
                reviewService.reportReview(productId, reviewId, reason)
                _uiState.value = ProductReviewUiState.ReviewReported
            } catch (e: Exception) {
                _uiState.value = ProductReviewUiState.Error(e.message ?: "Failed to report review")
            }
        }
    }

    fun respondToReview(productId: String, reviewId: String, comment: String) {
        viewModelScope.launch {
            try {
                reviewService.respondToReview(productId, reviewId, comment)
                loadReviews(productId) // Reload reviews after responding
            } catch (e: Exception) {
                _uiState.value = ProductReviewUiState.Error(e.message ?: "Failed to respond to review")
            }
        }
    }
}

sealed class ProductReviewUiState {
    object Loading : ProductReviewUiState()
    data class Success(
        val reviews: List<ProductReview>,
        val stats: ReviewStats
    ) : ProductReviewUiState()
    data class Error(val message: String) : ProductReviewUiState()
    object ReviewReported : ProductReviewUiState()
} 