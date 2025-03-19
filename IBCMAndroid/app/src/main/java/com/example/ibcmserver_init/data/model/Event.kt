package com.example.ibcmserver_init.data.model

import com.example.ibcmserver_init.data.serialization.DateSerializer
import com.example.ibcmserver_init.data.serialization.LocalDateSerializer
import com.example.ibcmserver_init.data.serialization.LocalTimeSerializer
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.time.LocalDate
import java.time.LocalTime
import java.util.Date

data class Event(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val subcategory: String,
    val date: Date,
    val location: Location,
    val organizer: Organizer,
    val price: Price,
    val images: List<String>,
    val reels: List<Reel> = emptyList(),
    val capacity: Capacity,
    val status: EventStatus,
    val tags: List<String>,
    val rating: Float,
    val reviewCount: Int,
    val attendees: List<User>,
    val comments: List<Comment>,
    val latitude: Double,
    val longitude: Double
)

data class Location(
    val name: String,
    val address: String,
    val city: String,
    val latitude: Double,
    val longitude: Double
)

data class Organizer(
    val id: String,
    val name: String,
    val avatar: String?,
    val isVerified: Boolean = false
)

data class Price(
    val startingFrom: Double,
    val currency: String = "INR",
    val tiers: List<PriceTier> = emptyList()
)

data class PriceTier(
    val name: String,
    val price: Double,
    val description: String?,
    val benefits: List<String> = emptyList(),
    val availableCount: Int? = null
)

data class Capacity(
    val total: Int,
    val booked: Int,
    val available: Int = total - booked
)

enum class EventStatus {
    UPCOMING,
    ONGOING,
    COMPLETED,
    CANCELLED
}

@Serializable
data class EventRequest(
    val id: String = "",
    val eventId: String = "",
    val userId: String = "",
    val status: String = "pending",
    val message: String? = null,
    @Contextual
    val createdAt: LocalDate = LocalDate.now(),
    @Contextual
    val updatedAt: LocalDate = LocalDate.now()
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "eventId" to eventId,
        "userId" to userId,
        "status" to status,
        "message" to message,
        "createdAt" to createdAt,
        "updatedAt" to updatedAt
    )
}

data class EventUpdate(
    val id: String,
    val eventId: String,
    val content: String,
    val timestamp: Date,
    val type: String // General, Schedule, Location, Cancellation
)

data class EventComment(
    val id: String,
    val eventId: String,
    val userId: String,
    val content: String,
    val timestamp: Date,
    val replies: List<EventComment> = emptyList()
)

data class Reel(
    val id: String,
    val videoUrl: String,
    val thumbnailUrl: String,
    val description: String,
    val likes: Int = 0,
    val comments: Int = 0,
    val isLiked: Boolean = false,
    val createdAt: Date = Date()
) 