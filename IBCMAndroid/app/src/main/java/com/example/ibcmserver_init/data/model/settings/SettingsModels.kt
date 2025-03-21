package com.example.ibcmserver_init.data.model.settings

import com.google.gson.annotations.SerializedName

data class Settings(
    @SerializedName("event_notifications")
    val eventNotifications: Boolean = true,
    
    @SerializedName("chat_notifications")
    val chatNotifications: Boolean = true,
    
    @SerializedName("follow_notifications")
    val followNotifications: Boolean = true,
    
    @SerializedName("dark_mode")
    val darkMode: Boolean = false,
    
    @SerializedName("language")
    val language: String = "en",
    
    @SerializedName("timezone")
    val timezone: String = "UTC",

    @SerializedName("email_notifications")
    val emailNotifications: Boolean = true,

    @SerializedName("push_notifications")
    val pushNotifications: Boolean = true,

    @SerializedName("sound_enabled")
    val soundEnabled: Boolean = true,

    @SerializedName("vibration_enabled")
    val vibrationEnabled: Boolean = true,

    @SerializedName("auto_play_videos")
    val autoPlayVideos: Boolean = false,

    @SerializedName("data_saver")
    val dataSaver: Boolean = false,

    @SerializedName("location_services")
    val locationServices: Boolean = true,

    @SerializedName("distance_unit")
    val distanceUnit: String = "km",

    @SerializedName("content_filter")
    val contentFilter: Boolean = true,

    @SerializedName("two_factor_auth")
    val twoFactorAuth: Boolean = false,

    @SerializedName("login_notifications")
    val loginNotifications: Boolean = true,

    @SerializedName("account_privacy")
    val accountPrivacy: String = "public"
)

data class NotificationSettings(
    @SerializedName("type")
    val type: String,
    
    @SerializedName("enabled")
    val enabled: Boolean
)

data class LanguageSettings(
    @SerializedName("language")
    val language: String
)

data class TimezoneSettings(
    @SerializedName("timezone")
    val timezone: String
)

data class DarkModeSettings(
    @SerializedName("enabled")
    val enabled: Boolean
)

data class PrivacySettings(
    @SerializedName("account_privacy")
    val accountPrivacy: String
)

data class SecuritySettings(
    @SerializedName("two_factor_auth")
    val twoFactorAuth: Boolean
)

data class ContentSettings(
    @SerializedName("auto_play_videos")
    val autoPlayVideos: Boolean,
    
    @SerializedName("data_saver")
    val dataSaver: Boolean,
    
    @SerializedName("content_filter")
    val contentFilter: Boolean
)

data class LocationSettings(
    @SerializedName("location_services")
    val locationServices: Boolean,
    
    @SerializedName("distance_unit")
    val distanceUnit: String
)