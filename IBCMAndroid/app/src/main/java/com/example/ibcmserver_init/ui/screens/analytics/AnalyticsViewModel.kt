package com.example.ibcmserver_init.ui.screens.analytics

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.AnalyticsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class AnalyticsViewModel @Inject constructor(
    private val analyticsRepository: AnalyticsRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow<AnalyticsUiState>(AnalyticsUiState.Initial)
    val uiState: StateFlow<AnalyticsUiState> = _uiState.asStateFlow()

    fun trackEventView(eventId: String, source: String) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackEventView(eventId, source)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }

    fun trackSearchQuery(query: String, filters: Map<String, Any>) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackSearchQuery(query, filters)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }

    fun trackUserInterest(category: String, source: String) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackUserInterest(category, source)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }

    fun trackVoiceInteraction(command: String, intent: String) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackVoiceInteraction(command, intent)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }

    fun trackContentView(contentId: String, contentType: String, source: String) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackContentView(contentId, contentType, source)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }

    fun trackContentInteraction(contentId: String, interactionType: String, source: String) {
        viewModelScope.launch {
            _uiState.value = AnalyticsUiState.Loading
            analyticsRepository.trackContentInteraction(contentId, interactionType, source)
                .collect { result ->
                    _uiState.value = when {
                        result.isSuccess -> AnalyticsUiState.Success
                        result.isFailure -> AnalyticsUiState.Error(result.exceptionOrNull()?.message ?: "Unknown error")
                    }
                }
        }
    }
}

sealed class AnalyticsUiState {
    object Initial : AnalyticsUiState()
    object Loading : AnalyticsUiState()
    object Success : AnalyticsUiState()
    data class Error(val message: String) : AnalyticsUiState()
} 