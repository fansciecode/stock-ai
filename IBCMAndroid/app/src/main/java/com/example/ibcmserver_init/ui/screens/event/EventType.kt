package com.example.ibcmserver_init.ui.screens.event

enum class EventType {
    INFORMATIVE,      // Just information sharing events
    BOOKABLE,        // Events that require ticket booking
    MARKETPLACE,     // Events with product catalog and ordering
    HYBRID          // Events that combine booking and marketplace
}

data class EventDetails(
    val id: String,
    val type: EventType,
    val title: String,
    val description: String,
    val organizer: OrganizerInfo,
    val date: String,
    val location: LocationInfo,
    val images: List<String>,
    val reels: List<ReelData>?,
    val tickets: List<TicketType>?,
    val products: List<ProductData>?,
    val joinedCount: Int,
    val maxCapacity: Int,
    val category: String,
    val isPublic: Boolean,
    val status: EventStatus
)

data class OrganizerInfo(
    val id: String,
    val name: String,
    val avatar: String,
    val description: String,
    val rating: Float,
    val totalEvents: Int,
    val followers: Int
)

data class LocationInfo(
    val address: String,
    val city: String,
    val country: String,
    val latitude: Double,
    val longitude: Double
)

enum class EventStatus {
    UPCOMING,
    ONGOING,
    COMPLETED,
    CANCELLED
} 