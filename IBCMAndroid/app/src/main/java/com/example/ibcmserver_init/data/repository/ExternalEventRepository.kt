@Singleton
class ExternalEventRepository @Inject constructor(
    private val externalEventApi: ExternalEventApi,
    private val eventDao: EventDao,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val _events = MutableStateFlow<List<ExternalEvent>>(emptyList())
    val events: StateFlow<List<ExternalEvent>> = _events.asStateFlow()

    private val _categories = MutableStateFlow<List<EventCategory>>(emptyList())
    val categories: StateFlow<List<EventCategory>> = _categories.asStateFlow()

    suspend fun getExternalEvents(
        category: String? = null,
        location: String? = null,
        date: String? = null,
        page: Int = 1,
        limit: Int = 20
    ): Result<ExternalEventsResponse> = withContext(dispatcher) {
        try {
            val response = externalEventApi.getExternalEvents(category, location, date, page, limit)
            _events.update { response.events }
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEventDetails(eventId: String): Result<ExternalEvent> = withContext(dispatcher) {
        try {
            val event = externalEventApi.getExternalEventDetails(eventId)
            Result.success(event)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun registerForEvent(
        eventId: String,
        request: EventRegistrationRequest
    ): Result<EventRegistrationResponse> = withContext(dispatcher) {
        try {
            val response = externalEventApi.registerForEvent(eventId, request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEventTickets(eventId: String): Result<List<EventTicket>> = withContext(dispatcher) {
        try {
            val tickets = externalEventApi.getEventTickets(eventId)
            Result.success(tickets)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun validateTicket(
        eventId: String,
        request: TicketValidationRequest
    ): Result<TicketValidationResponse> = withContext(dispatcher) {
        try {
            val response = externalEventApi.validateTicket(eventId, request)
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEventCategories(): Result<List<EventCategory>> = withContext(dispatcher) {
        try {
            val categories = externalEventApi.getEventCategories()
            _categories.update { categories }
            Result.success(categories)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchEvents(
        query: String,
        filters: Map<String, String>? = null
    ): Result<List<ExternalEvent>> = withContext(dispatcher) {
        try {
            val events = externalEventApi.searchEvents(query, filters)
            Result.success(events)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshEvents() {
        getExternalEvents()
    }

    suspend fun refreshCategories() {
        getEventCategories()
    }
} 