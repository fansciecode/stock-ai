interface ExternalEventApi {
    @GET("external/events")
    suspend fun getExternalEvents(
        @Query("category") category: String? = null,
        @Query("location") location: String? = null,
        @Query("date") date: String? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): ExternalEventsResponse

    @GET("external/events/{eventId}")
    suspend fun getExternalEventDetails(
        @Path("eventId") eventId: String
    ): ExternalEvent

    @POST("external/events/{eventId}/register")
    suspend fun registerForEvent(
        @Path("eventId") eventId: String,
        @Body request: EventRegistrationRequest
    ): EventRegistrationResponse

    @GET("external/events/{eventId}/tickets")
    suspend fun getEventTickets(
        @Path("eventId") eventId: String
    ): List<EventTicket>

    @POST("external/events/{eventId}/tickets/validate")
    suspend fun validateTicket(
        @Path("eventId") eventId: String,
        @Body request: TicketValidationRequest
    ): TicketValidationResponse

    @GET("external/events/categories")
    suspend fun getEventCategories(): List<EventCategory>

    @GET("external/events/search")
    suspend fun searchEvents(
        @Query("query") query: String,
        @Query("filters") filters: Map<String, String>? = null
    ): List<ExternalEvent>
}

data class ExternalEventsResponse(
    val events: List<ExternalEvent>,
    val totalCount: Int,
    val currentPage: Int,
    val totalPages: Int
)

data class ExternalEvent(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val location: EventLocation,
    val date: String,
    val time: String,
    val organizer: EventOrganizer,
    val ticketTypes: List<TicketType>,
    val images: List<String>,
    val status: EventStatus,
    val capacity: Int,
    val registeredCount: Int,
    val isRegistrationOpen: Boolean,
    val tags: List<String> = emptyList(),
    val metadata: Map<String, Any> = emptyMap()
)

data class EventLocation(
    val address: String,
    val city: String,
    val state: String,
    val country: String,
    val latitude: Double,
    val longitude: Double
)

data class EventOrganizer(
    val id: String,
    val name: String,
    val logo: String?,
    val description: String?,
    val contactInfo: OrganizerContact
)

data class OrganizerContact(
    val email: String,
    val phone: String?,
    val website: String?
)

data class TicketType(
    val id: String,
    val name: String,
    val description: String?,
    val price: Double,
    val quantity: Int,
    val availableQuantity: Int,
    val benefits: List<String> = emptyList()
)

data class EventRegistrationRequest(
    val ticketTypeId: String,
    val quantity: Int,
    val attendeeDetails: List<AttendeeDetails>
)

data class AttendeeDetails(
    val name: String,
    val email: String,
    val phone: String?,
    val additionalInfo: Map<String, String> = emptyMap()
)

data class EventRegistrationResponse(
    val registrationId: String,
    val tickets: List<EventTicket>,
    val totalAmount: Double,
    val paymentStatus: PaymentStatus,
    val qrCodes: List<String>
)

data class EventTicket(
    val id: String,
    val ticketNumber: String,
    val ticketType: TicketType,
    val attendee: AttendeeDetails,
    val qrCode: String,
    val isValid: Boolean,
    val usageHistory: List<TicketUsage> = emptyList()
)

data class TicketUsage(
    val timestamp: Long,
    val location: String?,
    val status: TicketStatus
)

data class TicketValidationRequest(
    val ticketId: String,
    val ticketNumber: String,
    val location: String?
)

data class TicketValidationResponse(
    val isValid: Boolean,
    val message: String?,
    val ticketDetails: EventTicket?
)

data class EventCategory(
    val id: String,
    val name: String,
    val icon: String?,
    val color: String?
)

enum class EventStatus {
    UPCOMING,
    ONGOING,
    COMPLETED,
    CANCELLED
}

enum class PaymentStatus {
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED
}

enum class TicketStatus {
    VALID,
    USED,
    EXPIRED,
    CANCELLED
} 