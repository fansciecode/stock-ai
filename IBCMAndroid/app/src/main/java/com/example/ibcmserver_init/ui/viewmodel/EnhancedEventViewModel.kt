package com.example.ibcmserver_init.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.event.*
import com.example.ibcmserver_init.data.repository.EnhancedEventRepository
import com.example.ibcmserver_init.utils.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class EnhancedEventViewModel @Inject constructor(
    private val repository: EnhancedEventRepository
) : ViewModel() {

    // Event creation state
    private val _eventCreationState = MutableStateFlow<NetworkResult<EnhancedEvent>>(NetworkResult.Initial())
    val eventCreationState: StateFlow<NetworkResult<EnhancedEvent>> = _eventCreationState

    // Event list state
    private val _eventsState = MutableStateFlow<NetworkResult<List<EnhancedEvent>>>(NetworkResult.Initial())
    val eventsState: StateFlow<NetworkResult<List<EnhancedEvent>>> = _eventsState

    // Ticket types state
    private val _ticketTypesState = MutableStateFlow<NetworkResult<List<TicketType>>>(NetworkResult.Initial())
    val ticketTypesState: StateFlow<NetworkResult<List<TicketType>>> = _ticketTypesState

    // Time slots state
    private val _timeSlotsState = MutableStateFlow<NetworkResult<List<TimeSlot>>>(NetworkResult.Initial())
    val timeSlotsState: StateFlow<NetworkResult<List<TimeSlot>>> = _timeSlotsState

    // Products state
    private val _productsState = MutableStateFlow<NetworkResult<List<Product>>>(NetworkResult.Initial())
    val productsState: StateFlow<NetworkResult<List<Product>>> = _productsState

    // Seating arrangement state
    private val _seatingState = MutableStateFlow<NetworkResult<SeatingArrangement>>(NetworkResult.Initial())
    val seatingState: StateFlow<NetworkResult<SeatingArrangement>> = _seatingState

    // Venues state
    private val _venuesState = MutableStateFlow<NetworkResult<List<Venue>>>(NetworkResult.Initial())
    val venuesState: StateFlow<NetworkResult<List<Venue>>> = _venuesState

    // Media state
    private val _mediaState = MutableStateFlow<NetworkResult<List<MediaContent>>>(NetworkResult.Initial())
    val mediaState: StateFlow<NetworkResult<List<MediaContent>>> = _mediaState

    // Catalog state
    private val _catalogState = MutableStateFlow<NetworkResult<Catalog>>(NetworkResult.Initial())
    val catalogState: StateFlow<NetworkResult<Catalog>> = _catalogState

    // Event creation
    fun createEvent(event: EnhancedEvent) {
        viewModelScope.launch {
            repository.createEvent(event).collectLatest { result ->
                _eventCreationState.value = result
            }
        }
    }

    // Event retrieval
    fun getEvents(type: String? = null, category: String? = null, status: EventStatus? = null) {
        viewModelScope.launch {
            repository.getEvents(type = type, category = category, status = status).collectLatest { result ->
                _eventsState.value = result
            }
        }
    }

    // Ticket management
    fun createTicketType(eventId: String, ticketType: TicketType) {
        viewModelScope.launch {
            repository.createTicketType(eventId, ticketType).collectLatest { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        // Refresh ticket types list
                        getTicketTypes(eventId)
                    }
                    else -> {} // Handle other states if needed
                }
            }
        }
    }

    fun getTicketTypes(eventId: String) {
        viewModelScope.launch {
            repository.getTicketTypes(eventId).collectLatest { result ->
                _ticketTypesState.value = result
            }
        }
    }

    // Service management
    fun createTimeSlots(eventId: String, timeSlots: List<TimeSlot>) {
        viewModelScope.launch {
            repository.createTimeSlots(eventId, timeSlots).collectLatest { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        // Refresh time slots list
                        getTimeSlots(eventId)
                    }
                    else -> {} // Handle other states if needed
                }
            }
        }
    }

    fun getTimeSlots(eventId: String, date: String? = null) {
        viewModelScope.launch {
            repository.getTimeSlots(eventId, date).collectLatest { result ->
                _timeSlotsState.value = result
            }
        }
    }

    // Product management
    fun createProducts(eventId: String, products: List<Product>) {
        viewModelScope.launch {
            repository.createProducts(eventId, products).collectLatest { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        // Refresh products list
                        getProducts(eventId)
                    }
                    else -> {} // Handle other states if needed
                }
            }
        }
    }

    fun getProducts(eventId: String, category: String? = null) {
        viewModelScope.launch {
            repository.getProducts(eventId, category).collectLatest { result ->
                _productsState.value = result
            }
        }
    }

    // Seating management
    fun createSeatingArrangement(eventId: String, seatingArrangement: SeatingArrangement) {
        viewModelScope.launch {
            repository.createSeatingArrangement(eventId, seatingArrangement).collectLatest { result ->
                _seatingState.value = result
            }
        }
    }

    fun getSeatingArrangement(eventId: String) {
        viewModelScope.launch {
            repository.getSeatingArrangement(eventId).collectLatest { result ->
                _seatingState.value = result
            }
        }
    }

    // Venue management
    fun createVenue(venue: Venue) {
        viewModelScope.launch {
            repository.createVenue(venue).collectLatest { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        // Refresh venues list
                        getVenues()
                    }
                    else -> {} // Handle other states if needed
                }
            }
        }
    }

    fun getVenues(minCapacity: Int? = null, facilities: List<String>? = null) {
        viewModelScope.launch {
            repository.getVenues(minCapacity, facilities).collectLatest { result ->
                _venuesState.value = result
            }
        }
    }

    // Media management
    fun uploadMedia(eventId: String, media: MediaContent) {
        viewModelScope.launch {
            repository.uploadMedia(eventId, media).collectLatest { result ->
                when (result) {
                    is NetworkResult.Success -> {
                        // Refresh media list
                        getEventMedia(eventId)
                    }
                    else -> {} // Handle other states if needed
                }
            }
        }
    }

    fun getEventMedia(eventId: String) {
        viewModelScope.launch {
            repository.getEventMedia(eventId).collectLatest { result ->
                _mediaState.value = result
            }
        }
    }

    // Catalog management
    fun createCatalog(eventId: String, catalog: Catalog) {
        viewModelScope.launch {
            repository.createCatalog(eventId, catalog).collectLatest { result ->
                _catalogState.value = result
            }
        }
    }

    fun getCatalog(eventId: String) {
        viewModelScope.launch {
            repository.getCatalog(eventId).collectLatest { result ->
                _catalogState.value = result
            }
        }
    }

    // Helper function to reset states
    fun resetStates() {
        _eventCreationState.value = NetworkResult.Initial()
        _eventsState.value = NetworkResult.Initial()
        _ticketTypesState.value = NetworkResult.Initial()
        _timeSlotsState.value = NetworkResult.Initial()
        _productsState.value = NetworkResult.Initial()
        _seatingState.value = NetworkResult.Initial()
        _venuesState.value = NetworkResult.Initial()
        _mediaState.value = NetworkResult.Initial()
        _catalogState.value = NetworkResult.Initial()
    }
} 