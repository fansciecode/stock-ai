package com.example.ibcmserver_init.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.review.ReviewSettings
import com.example.ibcmserver_init.data.repository.ReviewSettingsRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ReviewSettingsViewModel @Inject constructor(
    private val settingsRepository: ReviewSettingsRepository
) {
    private val _settings = MutableStateFlow(ReviewSettings())
    val settings: StateFlow<ReviewSettings> = _settings.asStateFlow()

    init {
        loadSettings()
    }

    private fun loadSettings() {
        viewModelScope.launch {
            try {
                val savedSettings = settingsRepository.getSettings()
                _settings.value = savedSettings
            } catch (e: Exception) {
                // Handle error
            }
        }
    }

    fun updateSettings(newSettings: ReviewSettings) {
        viewModelScope.launch {
            try {
                settingsRepository.saveSettings(newSettings)
                _settings.value = newSettings
            } catch (e: Exception) {
                // Handle error
            }
        }
    }
} 