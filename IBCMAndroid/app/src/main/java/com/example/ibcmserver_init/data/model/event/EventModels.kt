package com.example.ibcmserver_init.data.model.event

import kotlinx.serialization.Serializable
import java.time.LocalDateTime

@Serializable
sealed class EventType {
    @Serializable
    data class TicketEvent(
        val ticketTypes: List<TicketType>,
        val venue: Venue,
        val seatingArrangement: SeatingArrangement? = null
    ) : EventType()

    @Serializable
    data class ServiceEvent(
        val serviceDetails: ServiceDetails,
        val availability: List<TimeSlot>,
        val provider: ServiceProvider
    ) : EventType()

    @Serializable
    data class ProductEvent(
        val products: List<Product>,
        val catalog: Catalog,
        val deliveryOptions: List<DeliveryOption>
    ) : EventType()
}

@Serializable
data class EnhancedEvent(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val eventType: EventType,
    val startDateTime: String,
    val endDateTime: String,
    val location: Location,
    val creatorId: String,
    val status: EventStatus,
    val visibility: EventVisibility,
    val pricing: PricingDetails,
    val media: List<MediaContent>,
    val tags: List<String>,
    val metadata: EventMetadata
)

@Serializable
data class TicketType(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val quantity: Int,
    val benefits: List<String>,
    val validityPeriod: ValidityPeriod? = null
)

@Serializable
data class Venue(
    val id: String,
    val name: String,
    val address: String,
    val capacity: Int,
    val facilities: List<String>,
    val layout: VenueLayout? = null
)

@Serializable
data class SeatingArrangement(
    val sections: List<Section>,
    val totalCapacity: Int,
    val isReserved: Boolean
)

@Serializable
data class Section(
    val id: String,
    val name: String,
    val rows: List<Row>,
    val capacity: Int,
    val category: String
)

@Serializable
data class Row(
    val id: String,
    val number: String,
    val seats: List<Seat>
)

@Serializable
data class Seat(
    val id: String,
    val number: String,
    val status: SeatStatus,
    val price: Double
)

@Serializable
data class ServiceDetails(
    val duration: Int, // in minutes
    val maxParticipants: Int,
    val requirements: List<String>,
    val cancellationPolicy: String
)

@Serializable
data class TimeSlot(
    val id: String,
    val startTime: String,
    val endTime: String,
    val availability: Int,
    val isBooked: Boolean = false
)

@Serializable
data class ServiceProvider(
    val id: String,
    val name: String,
    val specialization: String,
    val rating: Double,
    val experience: Int, // in years
    val certifications: List<String>
)

@Serializable
data class Product(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val inventory: Int,
    val category: String,
    val images: List<String>,
    val specifications: Map<String, String>,
    val variants: List<ProductVariant>? = null
)

@Serializable
data class Catalog(
    val id: String,
    val name: String,
    val categories: List<String>,
    val featuredProducts: List<String>,
    val lastUpdated: String
)

@Serializable
data class DeliveryOption(
    val id: String,
    val name: String,
    val estimatedDays: Int,
    val cost: Double,
    val restrictions: List<String>? = null
)

@Serializable
data class Location(
    val address: String,
    val latitude: Double,
    val longitude: Double,
    val city: String,
    val state: String,
    val country: String,
    val postalCode: String
)

@Serializable
enum class EventStatus {
    DRAFT,
    PUBLISHED,
    CANCELLED,
    COMPLETED,
    SOLD_OUT
}

@Serializable
enum class EventVisibility {
    PUBLIC,
    PRIVATE,
    UNLISTED
}

@Serializable
data class PricingDetails(
    val currency: String,
    val basePrice: Double,
    val discounts: List<Discount>? = null,
    val taxes: List<Tax>? = null
)

@Serializable
data class MediaContent(
    val id: String,
    val type: MediaType,
    val url: String,
    val thumbnail: String? = null
)

@Serializable
enum class MediaType {
    IMAGE,
    VIDEO,
    DOCUMENT
}

@Serializable
data class EventMetadata(
    val createdAt: String,
    val updatedAt: String,
    val views: Int = 0,
    val shares: Int = 0,
    val bookmarks: Int = 0
)

@Serializable
enum class SeatStatus {
    AVAILABLE,
    RESERVED,
    SOLD,
    BLOCKED
}

@Serializable
data class ProductVariant(
    val id: String,
    val name: String,
    val attributes: Map<String, String>,
    val price: Double,
    val inventory: Int
)

@Serializable
data class Discount(
    val id: String,
    val name: String,
    val type: DiscountType,
    val value: Double,
    val validUntil: String? = null
)

@Serializable
enum class DiscountType {
    PERCENTAGE,
    FIXED_AMOUNT
}

@Serializable
data class Tax(
    val id: String,
    val name: String,
    val rate: Double,
    val isIncluded: Boolean
)

@Serializable
data class ValidityPeriod(
    val startDate: String,
    val endDate: String
)

@Serializable
data class VenueLayout(
    val width: Int,
    val height: Int,
    val elements: List<LayoutElement>
)

@Serializable
data class LayoutElement(
    val type: LayoutElementType,
    val x: Int,
    val y: Int,
    val width: Int,
    val height: Int,
    val label: String? = null
)

@Serializable
enum class LayoutElementType {
    SEAT,
    STAGE,
    ENTRANCE,
    EXIT,
    AISLE,
    RESTRICTED
} 