package com.example.ibcmserver_init.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.*
import com.example.ibcmserver_init.domain.repository.*
import com.google.android.gms.maps.model.LatLng
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.util.UUID
import java.time.Instant

// Update NotificationType enum with more types
enum class NotificationType {
    EVENT,
    USER,
    PRODUCT,
    BOOKING,
    DELIVERY,
    REVIEW,
    EVENT_REMINDER,
    PAYMENT,
    ORDER_STATUS
}

enum class SearchResultType {
    EVENT,
    USER,
    PRODUCT,
    BOOKING,
    VENUE,
    REVIEW,
    ORDER
}

data class SearchResult(
    val id: String,
    val title: String,
    val subtitle: String,
    val type: SearchResultType,
    val imageUrl: String? = null,
    val metadata: Map<String, Any> = emptyMap() // Additional data specific to each type
)

data class DashboardUiState(
    val isAuthenticated: Boolean = false,
    val isLoading: Boolean = false,
    val isRefreshing: Boolean = false,
    val error: String? = null,
    val networkState: NetworkState = NetworkState.Available,
    val currentLocation: LatLng? = null,
    val selectedLocation: LatLng? = null,
    val searchQuery: String = "",
    val selectedCategory: Category? = null,
    val categories: List<Category> = emptyList(),
    val nearbyEvents: List<Event> = emptyList(),
    val trendingEvents: List<Event> = emptyList(),
    val interestBasedEvents: List<Event> = emptyList(),
    val externalEvents: List<ExternalEventData> = emptyList(),
    val eventMarkers: List<EventMarker> = emptyList(),
    val notifications: List<Notification> = emptyList(),
    val unreadNotificationCount: Int = 0,
    val showNotifications: Boolean = false,
    val landingContent: LandingContentData? = null,
    val offers: OffersData? = null,
    val signupPrompt: SignupPrompt? = null,
    val showSignupPrompt: Boolean = false
)

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val externalEventsRepository: ExternalEventsRepository,
    private val authRepository: AuthRepository,
    private val locationRepository: LocationRepository,
    private val notificationRepository: NotificationRepository,
    private val savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val _uiState = MutableStateFlow(DashboardUiState())
    val uiState: StateFlow<DashboardUiState> = _uiState.asStateFlow()

    private var currentLocation: LatLng? = null
    private var selectedCategory: Category? = null

    init {
        viewModelScope.launch {
            // Check authentication state
            authRepository.isAuthenticated.collect { isAuthenticated ->
                _uiState.update { it.copy(isAuthenticated = isAuthenticated) }
                if (isAuthenticated) {
                    loadAuthenticatedData()
                } else {
                    loadExternalData()
                }
            }
        }
    }

    private suspend fun loadAuthenticatedData() {
        _uiState.update { it.copy(isLoading = true) }
        
        try {
            // Load all authenticated user data
            loadCategories()
            loadEvents()
            loadNotifications()
            loadUserLocation()
        } catch (e: Exception) {
            _uiState.update { it.copy(error = e.message) }
        } finally {
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    private suspend fun loadExternalData() {
        _uiState.update { it.copy(isLoading = true) }
        
        try {
            // Load external events and growth features
            loadLandingContent()
            loadNearbyExternalEvents()
            loadOffers()
        } catch (e: Exception) {
            _uiState.update { it.copy(error = e.message) }
        } finally {
            _uiState.update { it.copy(isLoading = false) }
        }
    }

    private suspend fun loadLandingContent() {
        externalEventsRepository.getLandingContent()
            .onSuccess { content ->
                _uiState.update { it.copy(landingContent = content) }
            }
            .onFailure { error ->
                _uiState.update { it.copy(error = error.message) }
            }
    }

    private suspend fun loadNearbyExternalEvents() {
        val location = _uiState.value.currentLocation
        if (location != null) {
            externalEventsRepository.searchNearbyEvents(
                latitude = location.latitude,
                longitude = location.longitude
            ).onSuccess { response ->
                _uiState.update { it.copy(externalEvents = response.data) }
                updateEventMarkers(response.data)
            }
            .onFailure { error ->
                _uiState.update { it.copy(error = error.message) }
            }
        }
    }

    private suspend fun loadOffers() {
        val location = _uiState.value.currentLocation
        if (location != null) {
            externalEventsRepository.searchOffers(
                latitude = location.latitude,
                longitude = location.longitude
            ).onSuccess { offers ->
                _uiState.update { it.copy(offers = offers) }
            }
            .onFailure { error ->
                _uiState.update { it.copy(error = error.message) }
            }
        }
    }

    private fun updateEventMarkers(events: List<ExternalEventData>) {
        val markers = events.map { event ->
            EventMarker(
                id = event.id,
                title = event.name,
                subtitle = event.type,
                position = LatLng(event.location.lat, event.location.lng),
                eventId = event.id
            )
        }
        _uiState.update { it.copy(eventMarkers = markers) }
    }

    fun trackEventView(eventId: String, source: String) {
        viewModelScope.launch {
            if (!_uiState.value.isAuthenticated) {
                externalEventsRepository.trackAnonymousActivity(
                    sessionId = UUID.randomUUID().toString(),
                    activity = ActivityData(
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
        }
    }

    fun shareEvent(eventId: String, platform: String) {
        viewModelScope.launch {
            externalEventsRepository.getShareContent(eventId)
                .onSuccess { content ->
                    val shareId = UUID.randomUUID().toString()
                    externalEventsRepository.trackShareActivity(
                        eventId = eventId,
                        platform = platform,
                        shareId = shareId
                    )
                }
        }
    }

    fun dismissSignupPrompt() {
        _uiState.update { it.copy(showSignupPrompt = false) }
    }

    fun refresh() {
        viewModelScope.launch {
            _uiState.update { it.copy(isRefreshing = true) }
            if (_uiState.value.isAuthenticated) {
                loadAuthenticatedData()
            } else {
                loadExternalData()
            }
            _uiState.update { it.copy(isRefreshing = false) }
        }
    }

    private fun loadCategories() {
        viewModelScope.launch {
            eventRepository.getCategories().collect { categories ->
                _uiState.update { it.copy(categories = categories) }
            }
        }
    }

    private fun loadEvents() {
        viewModelScope.launch {
            try {
                val location = _uiState.value.currentLocation ?: return

                // Load nearby events
                val nearby = eventRepository.getNearbyEvents(location, radius = 5000.0)
                
                // Load trending events
                val trending = eventRepository.getTrendingEvents()
                
                // Load interest-based events
                val interests = eventRepository.getInterestBasedEvents()

                // Create markers for all events
                val markers = (nearby + trending + interests).distinctBy { it.id }
                    .map { event ->
                        EventMarker(
                            id = event.id,
                            title = event.title,
                            subtitle = event.description,
                            type = event.type,
                            position = event.location,
                            eventId = event.id
                        )
                    }

                _uiState.update { state ->
                    state.copy(
                        nearbyEvents = nearby,
                        trendingEvents = trending,
                        interestBasedEvents = interests,
                        eventMarkers = markers
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to load events")
                }
            }
        }
    }

    private fun loadNotifications() {
        viewModelScope.launch {
            try {
                notificationRepository.getNotifications().collect { notifications ->
                    _uiState.update { 
                        it.copy(
                            notifications = notifications,
                            unreadNotifications = notifications.count { !it.isRead }
                        )
                    }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    private fun loadUserLocation() {
        viewModelScope.launch {
            val location = locationRepository.getCurrentLocation()
            _uiState.update { it.copy(currentLocation = location) }
        }
    }

    fun selectCategory(category: Category) {
        selectedCategory = if (selectedCategory == category) null else category
        _uiState.update { it.copy(selectedCategory = selectedCategory) }
        loadEvents()
    }

    fun updateSearchQuery(query: String) {
        _uiState.update { it.copy(searchQuery = query) }
        if (query.length >= 2) {
            searchContent(query)
        } else {
            _uiState.update { it.copy(searchResults = emptyList()) }
        }
    }

    private fun searchContent(query: String) {
        viewModelScope.launch {
            _uiState.update { it.copy(isSearching = true) }
            try {
                val results = searchRepository.search(query)
                _uiState.update { 
                    it.copy(
                        searchResults = results,
                        isSearching = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(
                        error = e.message ?: "Search failed",
                        isSearching = false
                    )
                }
            }
        }
    }

    fun selectMarker(marker: EventMarker) {
        _uiState.update { it.copy(selectedLocation = marker.position) }
    }

    fun showNotifications() {
        _uiState.update { it.copy(showNotifications = true) }
    }

    fun hideNotifications() {
        _uiState.update { it.copy(showNotifications = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun markNotificationAsRead(notificationId: String) {
        viewModelScope.launch {
            try {
                notificationRepository.markAsRead(notificationId)
                // The unread count will be automatically updated through the notification observer
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to mark notification as read")
                }
            }
        }
    }

    fun handleNotificationClick(notification: Notification) {
        viewModelScope.launch {
            try {
                // Mark notification as read
                notificationRepository.markAsRead(notification.id)
                
                // Handle different notification types
                when (notification.type) {
                    NotificationType.EVENT -> navigateToEvent(notification.targetId)
                    NotificationType.USER -> navigateToUserProfile(notification.targetId)
                    NotificationType.PRODUCT -> navigateToProduct(notification.targetId)
                    NotificationType.BOOKING -> navigateToBooking(notification.targetId)
                    NotificationType.DELIVERY -> navigateToDeliveryTracking(notification.targetId)
                    NotificationType.REVIEW -> navigateToReview(notification.targetId)
                    NotificationType.EVENT_REMINDER -> navigateToEvent(notification.targetId)
                    NotificationType.PAYMENT -> navigateToPayment(notification.targetId)
                    NotificationType.ORDER_STATUS -> navigateToOrder(notification.targetId)
                }
            } catch (e: Exception) {
                _uiState.update { 
                    it.copy(error = e.message ?: "Failed to process notification")
                }
            }
        }
    }

    fun handleSearchResultClick(result: SearchResult) {
        when (result.type) {
            SearchResultType.EVENT -> navigateToEvent(result.id)
            SearchResultType.USER -> navigateToUserProfile(result.id)
            SearchResultType.PRODUCT -> navigateToProduct(result.id)
            SearchResultType.BOOKING -> navigateToBooking(result.id)
            SearchResultType.VENUE -> navigateToVenue(result.id)
            SearchResultType.REVIEW -> navigateToReview(result.id)
            SearchResultType.ORDER -> navigateToOrder(result.id)
        }
    }

    // Navigation helper functions
    private fun navigateToEvent(eventId: String) {
        // Handle event navigation
    }

    private fun navigateToUserProfile(userId: String) {
        // Handle user profile navigation
    }

    private fun navigateToProduct(productId: String) {
        // Handle product navigation
    }

    private fun navigateToBooking(bookingId: String) {
        // Handle booking navigation
    }

    private fun navigateToDeliveryTracking(deliveryId: String) {
        // Handle delivery tracking navigation
    }

    private fun navigateToReview(reviewId: String) {
        // Handle review navigation
    }

    private fun navigateToPayment(paymentId: String) {
        // Handle payment navigation
    }

    private fun navigateToOrder(orderId: String) {
        // Handle order navigation
    }

    private fun navigateToVenue(venueId: String) {
        // Handle venue navigation
    }
}

data class Notification(
    val id: String,
    val title: String,
    val message: String,
    val type: NotificationType,
    val targetId: String,
    val timestamp: Long,
    val isRead: Boolean = false,
    val metadata: Map<String, Any> = emptyMap() // Additional data specific to each notification type
) 