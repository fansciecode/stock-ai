package com.example.ibcmserver_init.data.model

import com.example.ibcmserver_init.data.serialization.DateSerializer
import com.example.ibcmserver_init.data.serialization.LocalDateSerializer
import com.example.ibcmserver_init.data.serialization.LocalTimeSerializer
import kotlinx.serialization.Contextual
import kotlinx.serialization.Serializable
import java.time.LocalDate
import java.time.LocalTime
import java.util.Date

@Serializable
data class Event(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val imageUrl: String,
    val date: Long,
    val location: String,
    val latitude: Double,
    val longitude: Double,
    val attendees: List<String> = emptyList(),
    val maxAttendees: Int,
    val status: String = "UPCOMING",
    val creatorId: String,
    val isRegistered: Boolean = false
) {
    @Serializable
    data class Comment(
        val id: String = "",
        val userId: String = "",
        val userName: String = "",
        val text: String = "",
        val imageUrl: String? = null,
        val createdAt: Long = System.currentTimeMillis()
    ) {
        fun toMap(): Map<String, Any?> = mapOf(
            "id" to id,
            "userId" to userId,
            "userName" to userName,
            "text" to text,
            "imageUrl" to imageUrl,
            "createdAt" to createdAt
        )
    }

    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "title" to title,
        "description" to description,
        "category" to category,
        "imageUrl" to imageUrl,
        "date" to date,
        "location" to location,
        "latitude" to latitude,
        "longitude" to longitude,
        "attendees" to attendees,
        "maxAttendees" to maxAttendees,
        "status" to status,
        "creatorId" to creatorId,
        "isRegistered" to isRegistered
    )
}

@Serializable
data class Location(
    val address: String = "",
    val latitude: Double = 0.0,
    val longitude: Double = 0.0,
    val city: String = "",
    val state: String = "",
    val country: String = "",
    val postalCode: String = ""
) {
    fun toMap(): Map<String, Any> = mapOf(
        "address" to address,
        "latitude" to latitude,
        "longitude" to longitude,
        "city" to city,
        "state" to state,
        "country" to country,
        "postalCode" to postalCode
    )
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