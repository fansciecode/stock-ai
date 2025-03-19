package com.example.ibcmserver_init.data.model.analytics

import java.time.Instant
import java.time.LocalDate
import java.time.LocalTime

data class UserActivityData(
    val userId: String,
    val eventId: String,
    val action: String,
    val timestamp: String,
    val context: ActivityContext
)

data class ActivityContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int
)

data class LocationData(
    val latitude: Double,
    val longitude: Double,
    val accuracy: Double
)

data class UserBehaviorData(
    val userId: String,
    val action: String,
    val timestamp: String,
    val context: BehaviorContext
)

data class BehaviorContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int,
    val deviceInfo: DeviceInfo
)

data class DeviceInfo(
    val deviceId: String,
    val deviceModel: String,
    val osVersion: String,
    val appVersion: String
)

data class SearchAnalyticsData(
    val userId: String,
    val query: String,
    val filters: Map<String, Any>,
    val timestamp: String,
    val location: LocationData
)

data class VoiceAnalyticsData(
    val userId: String,
    val command: String,
    val intent: String,
    val timestamp: String,
    val context: VoiceContext
)

data class VoiceContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int,
    val deviceInfo: DeviceInfo,
    val audioQuality: AudioQuality
)

data class AudioQuality(
    val quality: String,
    val score: Double,
    val enhanced: Boolean
)

data class UserInterestData(
    val userId: String,
    val category: String,
    val timestamp: String,
    val context: InterestContext
)

data class InterestContext(
    val location: LocationData,
    val timeOfDay: Int,
    val dayOfWeek: Int,
    val source: String
) 