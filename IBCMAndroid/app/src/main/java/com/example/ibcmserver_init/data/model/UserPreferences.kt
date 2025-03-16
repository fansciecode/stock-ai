package com.example.ibcmserver_init.data.model

import kotlinx.serialization.Serializable

@Serializable
data class UserPreferences(
    val notificationsEnabled: Boolean = true,
    val emailNotifications: Boolean = true,
    val pushNotifications: Boolean = true,
    val eventReminders: Boolean = true,
    val friendRequests: Boolean = true,
    val eventInvites: Boolean = true,
    val comments: Boolean = true,
    val reviews: Boolean = true,
    val theme: String = "light",
    val language: String = "en",
    val privacy: String = "public"
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "notificationsEnabled" to notificationsEnabled,
        "emailNotifications" to emailNotifications,
        "pushNotifications" to pushNotifications,
        "eventReminders" to eventReminders,
        "friendRequests" to friendRequests,
        "eventInvites" to eventInvites,
        "comments" to comments,
        "reviews" to reviews,
        "theme" to theme,
        "language" to language,
        "privacy" to privacy
    )

    companion object {
        fun fromMap(map: Map<String, Any>): UserPreferences {
            return UserPreferences(
                notificationsEnabled = (map["notificationsEnabled"] as? Boolean) ?: true,
                emailNotifications = (map["emailNotifications"] as? Boolean) ?: true,
                pushNotifications = (map["pushNotifications"] as? Boolean) ?: true,
                eventReminders = (map["eventReminders"] as? Boolean) ?: true,
                friendRequests = (map["friendRequests"] as? Boolean) ?: true,
                eventInvites = (map["eventInvites"] as? Boolean) ?: true,
                comments = (map["comments"] as? Boolean) ?: true,
                reviews = (map["reviews"] as? Boolean) ?: true,
                theme = (map["theme"] as? String) ?: "light",
                language = (map["language"] as? String) ?: "en",
                privacy = (map["privacy"] as? String) ?: "public"
            )
        }
    }
} 