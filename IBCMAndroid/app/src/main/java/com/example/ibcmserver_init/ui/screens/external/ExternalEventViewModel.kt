@HiltViewModel
class ExternalEventViewModel @Inject constructor(
    private val externalEventRepository: ExternalEventRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    data class ExternalEventUiState(
        val events: List<ExternalEvent> = emptyList(),
        val categories: List<EventCategory> = emptyList(),
        val selectedCategory: String? = null,
        val selectedLocation: String? = null,
        val selectedDate: String? = null,
        val searchQuery: String = "",
        val currentPage: Int = 1,
        val totalPages: Int = 1,
        val isLoading: Boolean = false,
        val error: String? = null,
        val selectedEvent: ExternalEvent? = null,
        val registrationStatus: RegistrationStatus = RegistrationStatus.NONE
    )

    sealed class RegistrationStatus {
        object NONE : RegistrationStatus()
        object IN_PROGRESS : RegistrationStatus()
        data class SUCCESS(val response: EventRegistrationResponse) : RegistrationStatus()
        data class ERROR(val message: String) : RegistrationStatus()
    }

    private val _uiState = MutableStateFlow(ExternalEventUiState())
    val uiState: StateFlow<ExternalEventUiState> = _uiState.asStateFlow()

    init {
        viewModelScope.launch {
            loadInitialData()
        }
    }

    private suspend fun loadInitialData() {
        _uiState.update { it.copy(isLoading = true) }
        
        try {
            externalEventRepository.getEventCategories()
                .onSuccess { categories ->
                    _uiState.update { it.copy(categories = categories) }
                }
                .onFailure { error ->
                    _uiState.update { it.copy(error = error.message) }
                }

            loadEvents()
        } catch (e: Exception) {
            _uiState.update { it.copy(error = e.message) }
        } finally {
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    fun loadEvents(page: Int = 1) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val state = _uiState.value
                externalEventRepository.getExternalEvents(
                    category = state.selectedCategory,
                    location = state.selectedLocation,
                    date = state.selectedDate,
                    page = page
                ).onSuccess { response ->
                    _uiState.update {
                        it.copy(
                            events = if (page == 1) response.events else it.events + response.events,
                            currentPage = response.currentPage,
                            totalPages = response.totalPages
                        )
                    }
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

    fun selectCategory(category: String?) {
        _uiState.update { it.copy(selectedCategory = category, currentPage = 1) }
        loadEvents(1)
    }

    fun selectLocation(location: String?) {
        _uiState.update { it.copy(selectedLocation = location, currentPage = 1) }
        loadEvents(1)
    }

    fun selectDate(date: String?) {
        _uiState.update { it.copy(selectedDate = date, currentPage = 1) }
        loadEvents(1)
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        searchEvents()
    }

    private fun searchEvents() {
        viewModelScope.launch {
            val query = _uiState.value.searchQuery
            if (query.isBlank()) {
                loadEvents(1)
                return@launch
            }

            _uiState.update { it.copy(isLoading = true) }
            
            try {
                val filters = mapOf(
                    "category" to (_uiState.value.selectedCategory ?: ""),
                    "location" to (_uiState.value.selectedLocation ?: ""),
                    "date" to (_uiState.value.selectedDate ?: "")
                ).filterValues { it.isNotBlank() }

                externalEventRepository.searchEvents(query, filters)
                    .onSuccess { events ->
                        _uiState.update { it.copy(events = events) }
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

    fun loadEventDetails(eventId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            
            try {
                externalEventRepository.getEventDetails(eventId)
                    .onSuccess { event ->
                        _uiState.update { it.copy(selectedEvent = event) }
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

    fun registerForEvent(eventId: String, request: EventRegistrationRequest) {
        viewModelScope.launch {
            _uiState.update { it.copy(registrationStatus = RegistrationStatus.IN_PROGRESS) }
            
            try {
                externalEventRepository.registerForEvent(eventId, request)
                    .onSuccess { response ->
                        _uiState.update { it.copy(registrationStatus = RegistrationStatus.SUCCESS(response)) }
                    }
                    .onFailure { error ->
                        _uiState.update { it.copy(registrationStatus = RegistrationStatus.ERROR(error.message ?: "Registration failed")) }
                    }
            } catch (e: Exception) {
                _uiState.update { it.copy(registrationStatus = RegistrationStatus.ERROR(e.message ?: "Registration failed")) }
            }
        }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun resetRegistrationStatus() {
        _uiState.update { it.copy(registrationStatus = RegistrationStatus.NONE) }
    }

    fun clearSelectedEvent() {
        _uiState.update { it.copy(selectedEvent = null) }
    }
} 