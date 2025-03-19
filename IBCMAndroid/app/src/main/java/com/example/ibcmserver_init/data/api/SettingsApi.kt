package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.settings.Settings
import com.example.ibcmserver_init.data.model.settings.NotificationSettings
import retrofit2.http.*

interface SettingsApi {
    @GET("settings")
    suspend fun getSettings(): Settings

    @POST("settings/notifications")
    suspend fun updateNotificationSettings(@Body settings: NotificationSettings)

    @POST("settings/language")
    suspend fun updateLanguage(@Query("language") language: String)

    @POST("settings/timezone")
    suspend fun updateTimezone(@Query("timezone") timezone: String)

    @POST("settings/dark-mode")
    suspend fun updateDarkMode(@Query("enabled") enabled: Boolean)
} 