package com.example.ibcmserver_init.ui.screens.settings

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.UserPreferences
import com.example.ibcmserver_init.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class SettingsViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    private val _settingsState = MutableStateFlow<SettingsState>(SettingsState.Initial)
    val settingsState: StateFlow<SettingsState> = _settingsState.asStateFlow()

    private val _preferences = MutableStateFlow(UserPreferences())
    val preferences: StateFlow<UserPreferences> = _preferences.asStateFlow()

    init {
        loadPreferences()
    }

    private fun loadPreferences() {
        viewModelScope.launch {
            _settingsState.value = SettingsState.Loading
            try {
                val currentUser = userRepository.getCurrentUser()
                if (currentUser != null) {
                    _preferences.value = currentUser.preferences
                    _settingsState.value = SettingsState.Success
                } else {
                    _settingsState.value = SettingsState.Error("User not logged in")
                }
            } catch (e: Exception) {
                _settingsState.value = SettingsState.Error(e.message ?: "Failed to load preferences")
            }
        }
    }

    fun updatePreferences(preferences: UserPreferences) {
        viewModelScope.launch {
            _settingsState.value = SettingsState.Loading
            try {
                userRepository.updateUserPreferences(preferences)
                _preferences.value = preferences
                _settingsState.value = SettingsState.Success
            } catch (e: Exception) {
                _settingsState.value = SettingsState.Error(e.message ?: "Failed to update preferences")
            }
        }
    }

    fun clearError() {
        _settingsState.value = SettingsState.Success
    }

    fun toggleNotifications(enabled: Boolean) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(notificationsEnabled = enabled))
    }

    fun toggleEmailNotifications(enabled: Boolean) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(emailNotifications = enabled))
    }

    fun togglePushNotifications(enabled: Boolean) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(pushNotifications = enabled))
    }

    fun toggleDarkTheme(enabled: Boolean) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(darkMode = enabled))
    }

    fun toggleLocationServices(enabled: Boolean) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(locationEnabled = enabled))
    }

    fun updateLanguage(language: String) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(language = language))
    }

    fun updateDistanceUnit(unit: String) {
        val currentPrefs = _preferences.value
        updatePreferences(currentPrefs.copy(distanceUnit = unit))
    }
}

sealed class SettingsState {
    object Initial : SettingsState()
    object Loading : SettingsState()
    object Success : SettingsState()
    data class Error(val message: String) : SettingsState()
}

data class UserPreferences(
    val darkThemeEnabled: Boolean = false,
    val locationEnabled: Boolean = false,
    val distanceUnit: String = "km",
    val eventRemindersEnabled: Boolean = true,
    val eventUpdatesEnabled: Boolean = true,
    val commentNotificationsEnabled: Boolean = true
) 