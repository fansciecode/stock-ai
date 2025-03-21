package com.example.ibcmserver_init.ui.screens.review

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.review.ReviewAnalyticsStats
import com.example.ibcmserver_init.data.network.ProductReviewService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReviewAnalyticsViewModel @Inject constructor(
    private val reviewService: ProductReviewService
) {
    private val _uiState = MutableStateFlow<ReviewAnalyticsUiState>(ReviewAnalyticsUiState.Loading)
    val uiState: StateFlow<ReviewAnalyticsUiState> = _uiState.asStateFlow()

    fun loadAnalytics(productId: String, timeRange: TimeRange) {
        viewModelScope.launch {
            try {
                _uiState.value = ReviewAnalyticsUiState.Loading
                val stats = reviewService.getReviewAnalytics(productId, timeRange)
                _uiState.value = ReviewAnalyticsUiState.Success(stats)
            } catch (e: Exception) {
                _uiState.value = ReviewAnalyticsUiState.Error(e.message ?: "Failed to load analytics")
            }
        }
    }
}

sealed class ReviewAnalyticsUiState {
    object Loading : ReviewAnalyticsUiState()
    data class Success(val stats: ReviewAnalyticsStats) : ReviewAnalyticsUiState()
    data class Error(val message: String) : ReviewAnalyticsUiState()
} 