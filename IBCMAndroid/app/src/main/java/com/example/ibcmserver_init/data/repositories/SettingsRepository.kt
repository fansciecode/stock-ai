package com.example.ibcmserver_init.data.repositories

import com.example.ibcmserver_init.data.api.SettingsApi
import com.example.ibcmserver_init.data.model.settings.Settings
import com.example.ibcmserver_init.data.model.settings.NotificationSettings
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SettingsRepository @Inject constructor(
    private val settingsApi: SettingsApi
) {
    suspend fun getSettings(): Settings {
        return settingsApi.getSettings()
    }

    suspend fun updateNotificationSettings(type: String, enabled: Boolean) {
        settingsApi.updateNotificationSettings(NotificationSettings(type, enabled))
    }

    suspend fun updateLanguage(language: String) {
        settingsApi.updateLanguage(language)
    }

    suspend fun updateTimezone(timezone: String) {
        settingsApi.updateTimezone(timezone)
    }

    suspend fun updateDarkMode(enabled: Boolean) {
        settingsApi.updateDarkMode(enabled)
    }
} 