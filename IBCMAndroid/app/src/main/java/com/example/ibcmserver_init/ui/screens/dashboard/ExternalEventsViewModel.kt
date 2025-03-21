@HiltViewModel
class ExternalEventsViewModel @Inject constructor(
    private val externalEventsRepository: ExternalEventsRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    data class ExternalEventsUiState(
        val nearbyEvents: List<ExternalEventData> = emptyList(),
        val landingContent: LandingContentData? = null,
        val offers: OffersData? = null,
        val selectedCategory: String? = null,
        val selectedLocation: String? = null,
        val searchQuery: String = "",
        val isLoading: Boolean = false,
        val error: String? = null,
        val selectedEvent: ExternalEventDetails? = null,
        val signupPrompt: SignupPrompt? = null,
        val showSignupPrompt: Boolean = false
    )

    private val _uiState = MutableStateFlow(ExternalEventsUiState())
    val uiState: StateFlow<ExternalEventsUiState> = _uiState.asStateFlow()

    private val sessionId = UUID.randomUUID().toString()

    init {
        viewModelScope.launch {
            loadInitialData()
        }
    }

    private suspend fun loadInitialData() {
        _uiState.update { it.copy(isLoading = true) }
        
        try {
            // Load landing content first
            externalEventsRepository.getLandingContent()
                .onSuccess { landingContent ->
                    _uiState.update { it.copy(landingContent = landingContent) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }

            // Load nearby events if location is available
            // This would typically come from location services
            // For now, we'll use a default location
            val defaultLatitude = 19.0760
            val defaultLongitude = 72.8777
            
            externalEventsRepository.searchNearbyEvents(defaultLatitude, defaultLongitude)
                .onSuccess { response ->
                    _uiState.update { it.copy(nearbyEvents = response.data) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }

            // Load offers
            externalEventsRepository.searchOffers(defaultLatitude, defaultLongitude)
                .onSuccess { offers ->
                    _uiState.update { it.copy(offers = offers) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }

        } catch (e: Exception) {
            _uiState.update { it.copy(error = e.message) }
        } finally {
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun selectCategory(category: String?) {
        _uiState.update { it.copy(selectedCategory = category) }
        loadCategoryEvents(category)
    }

    private fun loadCategoryEvents(category: String?) {
        if (category == null) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val defaultLatitude = 19.0760
                val defaultLongitude = 72.8777
                
                externalEventsRepository.searchByCategory(
                    defaultLatitude,
                    defaultLongitude,
                    category
                ).onSuccess { events ->
                    // Update the UI with category-specific events
                    // This would typically update a different part of the UI
                }.onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchEvents(query)
    }

    private fun searchEvents(query: String) {
        if (query.isBlank()) return

        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val defaultLatitude = 19.0760
                val defaultLongitude = 72.8777
                
                externalEventsRepository.searchNearbyEvents(
                    defaultLatitude,
                    defaultLongitude,
                    keyword = query
                ).onSuccess { response ->
                    _uiState.update { it.copy(nearbyEvents = response.data) }
                }.onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun loadEventDetails(source: String, id: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                externalEventsRepository.getEventDetails(source, id)
                    .onSuccess { event ->
                        _uiState.update { it.copy(selectedEvent = event) }
                        trackEventView(id, source)
                    }
                    .onFailure { error ->
                        _uiState.update { it.copy(error = error.message) }
                    }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private suspend fun trackEventView(eventId: String, source: String) {
        externalEventsRepository.trackAnonymousActivity(
            sessionId,
            ActivityData(
                type = "view_event",
                eventId = eventId,
                category = source,
                timestamp = Instant.now().toString()
            )
        ).onSuccess { promptData ->
            if (promptData.shouldPrompt && promptData.prompt != null) {
                _uiState.update {
                    it.copy(
                        signupPrompt = promptData.prompt,
                        showSignupPrompt = true
                    )
                }
            }
        }
    }

    fun shareEvent(eventId: String, platform: String) {
        viewModelScope.launch {
            try {
                externalEventsRepository.getShareContent(eventId)
                    .onSuccess { content ->
                        // Handle sharing based on platform
                        val shareId = UUID.randomUUID().toString()
                        externalEventsRepository.trackShareActivity(
                            eventId,
                            platform,
                            shareId
                        )
                    }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearSelectedEvent() {
        _uiState.update { it.copy(selectedEvent = null) }
    }

    fun dismissSignupPrompt() {
        _uiState.update { it.copy(showSignupPrompt = false) }
    }

    fun refreshData() {
        viewModelScope.launch {
            loadInitialData()
        }
    }
} 