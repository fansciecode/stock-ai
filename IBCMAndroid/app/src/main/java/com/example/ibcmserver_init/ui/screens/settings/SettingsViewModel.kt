package com.example.ibcmserver_init.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repositories.SettingsRepository
import com.example.ibcmserver_init.data.repositories.AuthRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val settingsRepository: SettingsRepository,
    private val authRepository: AuthRepository
) {
    private val _uiState = MutableStateFlow<SettingsUiState>(SettingsUiState.Loading)
    val uiState: StateFlow<SettingsUiState> = _uiState.asStateFlow()

    init {
        loadSettings()
    }

    fun loadSettings() {
        viewModelScope.launch {
            try {
                _uiState.value = SettingsUiState.Loading
                val settings = settingsRepository.getSettings()
                _uiState.value = SettingsUiState.Success(settings)
            } catch (e: Exception) {
                _uiState.value = SettingsUiState.Error(e.message ?: "Failed to load settings")
            }
        }
    }

    fun toggleNotification(type: String, enabled: Boolean) {
        viewModelScope.launch {
            try {
                settingsRepository.updateNotificationSettings(type, enabled)
                loadSettings() // Reload settings to reflect changes
            } catch (e: Exception) {
                _uiState.value = SettingsUiState.Error(e.message ?: "Failed to update notification settings")
            }
        }
    }

    fun updateSetting(key: String, value: Any) {
        viewModelScope.launch {
            try {
                when (key) {
                    "email_notifications" -> settingsRepository.updateEmailNotifications(value as Boolean)
                    "push_notifications" -> settingsRepository.updatePushNotifications(value as Boolean)
                    "login_notifications" -> settingsRepository.updateLoginNotifications(value as Boolean)
                    "auto_play_videos" -> settingsRepository.updateAutoPlayVideos(value as Boolean)
                    "data_saver" -> settingsRepository.updateDataSaver(value as Boolean)
                    "content_filter" -> settingsRepository.updateContentFilter(value as Boolean)
                    "two_factor_auth" -> settingsRepository.updateTwoFactorAuth(value as Boolean)
                    "location_services" -> settingsRepository.updateLocationServices(value as Boolean)
                    "account_privacy" -> settingsRepository.updateAccountPrivacy(value as String)
                    else -> throw IllegalArgumentException("Unknown setting key: $key")
                }
                loadSettings() // Reload settings to reflect changes
            } catch (e: Exception) {
                _uiState.value = SettingsUiState.Error(e.message ?: "Failed to update setting")
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                authRepository.logout()
            } catch (e: Exception) {
                _uiState.value = SettingsUiState.Error(e.message ?: "Failed to logout")
            }
        }
    }
}

sealed class SettingsUiState {
    object Loading : SettingsUiState()
    data class Success(val settings: Settings) : SettingsUiState()
    data class Error(val message: String) : SettingsUiState()
}

data class Settings(
    val eventNotifications: Boolean = true,
    val chatNotifications: Boolean = true,
    val followNotifications: Boolean = true,
    val darkMode: Boolean = false,
    val language: String = "en",
    val timezone: String = "UTC",
    val emailNotifications: Boolean = true,
    val pushNotifications: Boolean = true,
    val soundEnabled: Boolean = true,
    val vibrationEnabled: Boolean = true,
    val autoPlayVideos: Boolean = false,
    val dataSaver: Boolean = false,
    val locationServices: Boolean = true,
    val distanceUnit: String = "km",
    val contentFilter: Boolean = true,
    val twoFactorAuth: Boolean = false,
    val loginNotifications: Boolean = true,
    val accountPrivacy: String = "public"
)