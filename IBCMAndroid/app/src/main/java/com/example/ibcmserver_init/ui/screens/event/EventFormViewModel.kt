package com.example.ibcmserver_init.ui.screens.event

import android.net.Uri
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.*
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.utils.NetworkUtils
import com.example.ibcmserver_init.utils.MediaUtils
import com.example.ibcmserver_init.utils.LocationService
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import kotlinx.coroutines.delay
import java.util.*
import javax.inject.Inject

data class EventFormUiState(
    val isEditing: Boolean = false,
    val eventId: String? = null,
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val subcategory: String = "",
    val date: Date = Date(),
    val location: Location = Location("", "", "", 0.0, 0.0),
    val price: Price = Price(0f, "USD"),
    val images: List<String> = emptyList(),
    val reels: List<Reel> = emptyList(),
    val capacity: Capacity = Capacity(0, 0),
    val isLoading: Boolean = false,
    val error: String? = null,
    val isCategoryDropdownExpanded: Boolean = false,
    val isCurrencyDropdownExpanded: Boolean = false,
    val locationSuggestions: List<AutocompletePrediction> = emptyList(),
    val isLocationDropdownExpanded: Boolean = false,
    val validationErrors: Map<String, String> = emptyMap(),
    val isDraft: Boolean = false,
    val isPreviewMode: Boolean = false,
    val availableCategories: List<String> = listOf(
        "Music", "Sports", "Arts", "Food", "Technology",
        "Business", "Education", "Entertainment", "Lifestyle", "Other"
    ),
    val availableCurrencies: List<String> = listOf("USD", "EUR", "GBP", "JPY", "AUD", "CAD", "INR")
) {
    val isValid: Boolean
        get() = validationErrors.isEmpty() &&
                title.isNotBlank() &&
                description.isNotBlank() &&
                category.isNotBlank() &&
                location.address.isNotBlank() &&
                capacity.maxAttendees > 0
}

@HiltViewModel
class EventFormViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository,
    private val networkUtils: NetworkUtils,
    private val mediaUtils: MediaUtils,
    private val locationService: LocationService,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(EventFormUiState())
    val uiState: StateFlow<EventFormUiState> = _uiState.asStateFlow()

    private var draftSaveJob: Job? = null
    private val draftDebounceTime = 5000L // 5 seconds

    init {
        savedStateHandle.get<String>("eventId")?.let { eventId ->
            loadEvent(eventId)
        } else {
            loadDraft()
        }

        // Start location suggestions collector
        viewModelScope.launch {
            locationService.getAutocompleteSuggestions(_uiState.value.location.address)
                .collect { suggestions ->
                    _uiState.update { it.copy(locationSuggestions = suggestions) }
                }
        }
    }

    private fun loadDraft() {
        viewModelScope.launch {
            eventRepository.getDraft()?.let { draft ->
                _uiState.update { state ->
                    state.copy(
                        title = draft.title,
                        description = draft.description,
                        category = draft.category,
                        subcategory = draft.subcategory,
                        date = draft.date,
                        location = draft.location,
                        price = draft.price,
                        images = draft.images,
                        reels = draft.reels,
                        capacity = draft.capacity,
                        isDraft = true
                    )
                }
            }
        }
    }

    private fun saveDraft() {
        draftSaveJob?.cancel()
        draftSaveJob = viewModelScope.launch {
            delay(draftDebounceTime)
            val event = createEventFromState()
            eventRepository.saveDraft(event)
        }
    }

    fun validateForm() {
        val errors = mutableMapOf<String, String>()
        
        // Title validation
        when {
            uiState.value.title.isBlank() -> 
                errors["title"] = "Title is required"
            uiState.value.title.length < 5 -> 
                errors["title"] = "Title must be at least 5 characters long"
            uiState.value.title.length > 100 ->
                errors["title"] = "Title must be less than 100 characters"
        }
        
        // Description validation
        when {
            uiState.value.description.isBlank() ->
                errors["description"] = "Description is required"
            uiState.value.description.length < 20 ->
                errors["description"] = "Description must be at least 20 characters long"
            uiState.value.description.length > 2000 ->
                errors["description"] = "Description must be less than 2000 characters"
        }
        
        // Category validation
        if (uiState.value.category.isBlank()) {
            errors["category"] = "Category is required"
        }
        
        // Date validation
        val currentDate = Date()
        when {
            uiState.value.date.before(currentDate) ->
                errors["date"] = "Event date must be in the future"
            uiState.value.date.time - currentDate.time < 24 * 60 * 60 * 1000 ->
                errors["date"] = "Event must be scheduled at least 24 hours in advance"
            uiState.value.date.time - currentDate.time > 365L * 24 * 60 * 60 * 1000 ->
                errors["date"] = "Event cannot be scheduled more than 1 year in advance"
        }
        
        // Price validation
        when {
            uiState.value.price.amount < 0 ->
                errors["price"] = "Price cannot be negative"
            uiState.value.price.amount > 10000 ->
                errors["price"] = "Price cannot exceed 10,000"
        }
        
        // Capacity validation
        when {
            uiState.value.capacity.maxAttendees <= 0 ->
                errors["capacity"] = "Capacity must be greater than 0"
            uiState.value.capacity.maxAttendees > 10000 ->
                errors["capacity"] = "Capacity cannot exceed 10,000"
        }
        
        // Location validation
        when {
            uiState.value.location.address.isBlank() ->
                errors["location"] = "Location is required"
            uiState.value.location.latitude == 0.0 && uiState.value.location.longitude == 0.0 ->
                errors["location"] = "Please select a valid location"
        }

        // Media validation
        if (uiState.value.images.isEmpty()) {
            errors["images"] = "At least one event image is required"
        }

        // Validate image count
        if (uiState.value.images.size > 10) {
            errors["images"] = "Maximum 10 images allowed"
        }

        // Validate reel count
        if (uiState.value.reels.size > 5) {
            errors["reels"] = "Maximum 5 reels allowed"
        }

        _uiState.update { it.copy(validationErrors = errors) }
    }

    fun togglePreviewMode() {
        _uiState.update { it.copy(isPreviewMode = !it.isPreviewMode) }
    }

    // Override existing image selection
    suspend fun onImagesSelected(imageUris: List<Uri>) {
        viewModelScope.launch {
            try {
                val optimizedUris = imageUris.map { uri ->
                    mediaUtils.optimizeImage(uri)
                }
                _uiState.update { it.copy(images = it.images + optimizedUris.map { uri -> uri.toString() }) }
                saveDraft()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to process images: ${e.message}") }
            }
        }
    }

    // Override existing video selection
    suspend fun onVideoSelected(videoUri: Uri) {
        viewModelScope.launch {
            try {
                val (optimizedVideoUri, thumbnailUri) = mediaUtils.optimizeVideo(videoUri)
                val newReel = Reel(
                    id = UUID.randomUUID().toString(),
                    videoUrl = optimizedVideoUri.toString(),
                    thumbnailUrl = thumbnailUri.toString(),
                    description = _uiState.value.title
                )
                _uiState.update { it.copy(reels = it.reels + newReel) }
                saveDraft()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to process video: ${e.message}") }
            }
        }
    }

    fun onLocationSelected(prediction: AutocompletePrediction) {
        viewModelScope.launch {
            try {
                val location = locationService.getPlaceDetails(prediction.placeId)
                _uiState.update { it.copy(
                    location = location,
                    isLocationDropdownExpanded = false
                ) }
                saveDraft()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = "Failed to get location details: ${e.message}") }
            }
        }
    }

    // Override existing UI event handlers to include draft saving and immediate validation
    override fun onTitleChanged(title: String) {
        _uiState.update { it.copy(title = title) }
        if (!isValidTitle(title)) {
            validateForm()
        } else {
            _uiState.update { 
                it.copy(validationErrors = it.validationErrors - "title")
            }
        }
        saveDraft()
    }

    override fun onDescriptionChanged(description: String) {
        _uiState.update { it.copy(description = description) }
        if (!isValidDescription(description)) {
            validateForm()
        } else {
            _uiState.update { 
                it.copy(validationErrors = it.validationErrors - "description")
            }
        }
        saveDraft()
    }

    // ... Add similar draft saving to other UI event handlers ...

    fun clearDraft() {
        viewModelScope.launch {
            eventRepository.clearDraft()
            _uiState.update { it.copy(isDraft = false) }
        }
    }

    private fun loadEvent(eventId: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                eventRepository.getEvent(eventId).onSuccess { event ->
                    _uiState.update { state ->
                        state.copy(
                            isEditing = true,
                            eventId = event.id,
                            title = event.title,
                            description = event.description,
                            category = event.category,
                            subcategory = event.subcategory,
                            date = event.date,
                            location = event.location,
                            price = event.price,
                            images = event.images,
                            reels = event.reels,
                            capacity = event.capacity,
                            isLoading = false
                        )
                    }
                }.onFailure { error ->
                    _uiState.update { it.copy(
                        error = error.message ?: "Failed to load event",
                        isLoading = false
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    error = e.message ?: "Failed to load event",
                    isLoading = false
                ) }
            }
        }
    }

    fun saveEvent() {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true) }
            try {
                val event = createEventFromState()
                val result = if (_uiState.value.isEditing) {
                    eventRepository.updateEvent(event)
                } else {
                    eventRepository.createEvent(event)
                }

                result.onSuccess {
                    _uiState.update { it.copy(isLoading = false) }
                }.onFailure { error ->
                    _uiState.update { it.copy(
                        error = error.message ?: "Failed to save event",
                        isLoading = false
                    ) }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(
                    error = e.message ?: "Failed to save event",
                    isLoading = false
                ) }
            }
        }
    }

    private fun createEventFromState(): Event {
        val state = _uiState.value
        return Event(
            id = state.eventId ?: UUID.randomUUID().toString(),
            title = state.title,
            description = state.description,
            category = state.category,
            subcategory = state.subcategory,
            date = state.date,
            location = state.location,
            organizer = userRepository.getCurrentUser(),
            price = state.price,
            images = state.images,
            reels = state.reels,
            capacity = state.capacity,
            status = EventStatus.UPCOMING,
            tags = emptyList(),
            rating = 0f,
            reviewCount = 0,
            attendees = emptyList(),
            comments = emptyList(),
            latitude = state.location.latitude,
            longitude = state.location.longitude
        )
    }

    // UI Event Handlers
    fun onCategorySelected(category: String) {
        _uiState.update { it.copy(category = category) }
    }

    fun onLocationChanged(address: String) {
        _uiState.update { it.copy(
            location = it.location.copy(address = address)
        ) }
    }

    fun onPriceChanged(amount: Float) {
        _uiState.update { it.copy(
            price = it.price.copy(amount = amount)
        ) }
    }

    fun onCurrencySelected(currency: String) {
        _uiState.update { it.copy(
            price = it.price.copy(currency = currency)
        ) }
    }

    fun onCapacityChanged(maxAttendees: Int) {
        _uiState.update { it.copy(
            capacity = it.capacity.copy(maxAttendees = maxAttendees)
        ) }
    }

    fun onDateSelected(date: Date) {
        val currentDate = _uiState.value.date
        val newDate = Date(date.year, date.month, date.date, currentDate.hours, currentDate.minutes)
        _uiState.update { it.copy(date = newDate) }
    }

    fun onTimeSelected(hours: Int, minutes: Int) {
        val currentDate = _uiState.value.date
        val newDate = Date(currentDate.year, currentDate.month, currentDate.date, hours, minutes)
        _uiState.update { it.copy(date = newDate) }
    }

    fun onReelRemoved(reelId: String) {
        _uiState.update { it.copy(
            reels = it.reels.filterNot { reel -> reel.id == reelId }
        ) }
    }

    fun onCategoryDropdownExpandedChanged(expanded: Boolean) {
        _uiState.update { it.copy(isCategoryDropdownExpanded = expanded) }
    }

    fun onCurrencyDropdownExpandedChanged(expanded: Boolean) {
        _uiState.update { it.copy(isCurrencyDropdownExpanded = expanded) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    // Add new validation helper functions
    private fun isValidTitle(title: String): Boolean =
        title.isNotBlank() && title.length in 5..100

    private fun isValidDescription(description: String): Boolean =
        description.isNotBlank() && description.length in 20..2000

    private fun isValidDate(date: Date): Boolean {
        val currentDate = Date()
        val minDate = Date(currentDate.time + 24 * 60 * 60 * 1000) // 24 hours from now
        val maxDate = Date(currentDate.time + 365L * 24 * 60 * 60 * 1000) // 1 year from now
        return date.after(minDate) && date.before(maxDate)
    }

    private fun isValidPrice(amount: Float): Boolean =
        amount >= 0 && amount <= 10000

    private fun isValidCapacity(capacity: Int): Boolean =
        capacity in 1..10000
} 