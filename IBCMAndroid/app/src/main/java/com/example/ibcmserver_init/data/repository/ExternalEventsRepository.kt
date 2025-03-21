@Singleton
class ExternalEventsRepository @Inject constructor(
    private val externalEventsApi: ExternalEventsApi,
    private val growthApi: GrowthApi,
    private val dispatcher: CoroutineDispatcher = Dispatchers.IO
) {
    private val _nearbyEvents = MutableStateFlow<List<ExternalEventData>>(emptyList())
    val nearbyEvents: StateFlow<List<ExternalEventData>> = _nearbyEvents.asStateFlow()

    private val _landingContent = MutableStateFlow<LandingContentData?>(null)
    val landingContent: StateFlow<LandingContentData?> = _landingContent.asStateFlow()

    private val _offers = MutableStateFlow<OffersData?>(null)
    val offers: StateFlow<OffersData?> = _offers.asStateFlow()

    suspend fun searchNearbyEvents(
        latitude: Double,
        longitude: Double,
        radius: Int = 5,
        type: String? = null,
        keyword: String? = null
    ): Result<ExternalEventsSearchResponse> = withContext(dispatcher) {
        try {
            val response = externalEventsApi.searchNearbyEvents(latitude, longitude, radius, type, keyword)
            _nearbyEvents.update { response.data }
            Result.success(response)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getEventDetails(source: String, id: String): Result<ExternalEventDetails> = withContext(dispatcher) {
        try {
            val response = externalEventsApi.getEventDetails(source, id)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchOffers(
        latitude: Double,
        longitude: Double,
        radius: Int = 5,
        category: String? = null
    ): Result<OffersData> = withContext(dispatcher) {
        try {
            val response = externalEventsApi.searchOffers(latitude, longitude, radius, category)
            _offers.update { response.data }
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun searchByCategory(
        latitude: Double,
        longitude: Double,
        category: String,
        subcategory: String? = null,
        radius: Int = 5
    ): Result<List<CategoryEventData>> = withContext(dispatcher) {
        try {
            val response = externalEventsApi.searchByCategory(latitude, longitude, radius, category, subcategory)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getLandingContent(
        latitude: Double? = null,
        longitude: Double? = null,
        city: String? = null
    ): Result<LandingContentData> = withContext(dispatcher) {
        try {
            val response = growthApi.getLandingContent(latitude, longitude, city)
            _landingContent.update { response.data }
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun trackAnonymousActivity(
        sessionId: String,
        activity: ActivityData
    ): Result<PromptData> = withContext(dispatcher) {
        try {
            val response = growthApi.trackAnonymousActivity(
                TrackActivityRequest(sessionId, activity)
            )
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getShareContent(eventId: String): Result<ShareContentData> = withContext(dispatcher) {
        try {
            val response = growthApi.getShareContent(eventId)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun trackShareActivity(
        eventId: String,
        platform: String,
        shareId: String,
        referrer: String? = null
    ): Result<ShareMetrics> = withContext(dispatcher) {
        try {
            val response = growthApi.trackShareActivity(
                TrackShareRequest(eventId, platform, shareId, referrer)
            )
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getSeoMetadata(
        page: String,
        data: Map<String, String>? = null
    ): Result<SeoMetadata> = withContext(dispatcher) {
        try {
            val response = growthApi.getSeoMetadata(page, data)
            Result.success(response.data)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun refreshLandingContent() {
        getLandingContent()
    }

    suspend fun refreshOffers(latitude: Double, longitude: Double) {
        searchOffers(latitude, longitude)
    }
} 