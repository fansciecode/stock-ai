package com.example.ibcmserver_init.data.model

import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.time.LocalDate

@Serializable
data class User(
    val id: String = "",
    val email: String = "",
    val username: String = "",
    val displayName: String = "",
    val bio: String = "",
    val profilePictureUrl: String = "",
    val interests: List<String> = emptyList(),
    val preferences: UserPreferences = UserPreferences(),
    val friends: List<String> = emptyList(),
    val blockedUsers: List<String> = emptyList(),
    val eventsCreated: List<String> = emptyList(),
    val eventsAttending: List<String> = emptyList(),
    val eventsInterested: List<String> = emptyList(),
    val notificationTokens: List<String> = emptyList(),
    val isVerified: Boolean = false,
    val createdAt: Long = System.currentTimeMillis(),
    val updatedAt: Long = System.currentTimeMillis()
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "email" to email,
        "username" to username,
        "displayName" to displayName,
        "bio" to bio,
        "profilePictureUrl" to profilePictureUrl,
        "interests" to interests,
        "preferences" to preferences.toMap(),
        "friends" to friends,
        "blockedUsers" to blockedUsers,
        "eventsCreated" to eventsCreated,
        "eventsAttending" to eventsAttending,
        "eventsInterested" to eventsInterested,
        "notificationTokens" to notificationTokens,
        "isVerified" to isVerified,
        "createdAt" to createdAt,
        "updatedAt" to updatedAt
    )
}

@Serializable
data class UserSettings(
    val emailNotifications: Boolean = true,
    val pushNotifications: Boolean = true,
    val eventReminders: Boolean = true,
    val chatNotifications: Boolean = true,
    val darkMode: Boolean = false,
    val language: String = "en"
) {
    fun toMap(): Map<String, Any> {
        return mapOf(
            "emailNotifications" to emailNotifications,
            "pushNotifications" to pushNotifications,
            "eventReminders" to eventReminders,
            "chatNotifications" to chatNotifications,
            "darkMode" to darkMode,
            "language" to language
        )
    }
} 