package com.example.ibcmserver_init.ui.screens.dashboard

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.ui.state.DashboardState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class DashboardViewModel @Inject constructor(
    private val eventRepository: EventRepository,
    private val userRepository: UserRepository
) : ViewModel() {

    private val _dashboardState = MutableStateFlow<DashboardState>(DashboardState.Initial)
    val dashboardState: StateFlow<DashboardState> = _dashboardState.asStateFlow()

    private val _events = MutableStateFlow<List<Event>>(emptyList())
    val events: StateFlow<List<Event>> = _events.asStateFlow()

    private val _nearbyEvents = MutableStateFlow<List<Event>>(emptyList())
    val nearbyEvents: StateFlow<List<Event>> = _nearbyEvents

    private val _trendingEvents = MutableStateFlow<List<Event>>(emptyList())
    val trendingEvents: StateFlow<List<Event>> = _trendingEvents

    private val _categories = MutableStateFlow<List<String>>(emptyList())
    val categories: StateFlow<List<String>> = _categories

    private val _eventsByCategory = MutableStateFlow<Map<String, List<Event>>>(emptyMap())
    val eventsByCategory: StateFlow<Map<String, List<Event>>> = _eventsByCategory

    init {
        loadEvents()
    }

    private fun loadEvents() {
        viewModelScope.launch {
            _dashboardState.value = DashboardState.Loading
            try {
                val currentUser = userRepository.getCurrentUser()
                if (currentUser != null) {
                    val userEvents = eventRepository.getEventsByUser(currentUser.id)
                    _events.value = userEvents
                    _dashboardState.value = DashboardState.Success
                } else {
                    _dashboardState.value = DashboardState.Error("User not logged in")
                }
            } catch (e: Exception) {
                _dashboardState.value = DashboardState.Error(e.message ?: "Failed to load events")
            }
        }
    }

    fun refreshEvents() {
        loadEvents()
    }

    private fun loadDashboardData() {
        viewModelScope.launch {
            try {
                val user = userRepository.getCurrentUser()
                val locationEnabled = user.locationEnabled
                val distanceUnit = user.distanceUnit

                // Load nearby events if location is enabled
                if (locationEnabled) {
                    val nearby = eventRepository.getNearbyEvents(
                        latitude = 0.0, // TODO: Get user's location
                        longitude = 0.0,
                        radius = if (distanceUnit == "km") 10.0 else 6.2 // 10km or 6.2mi
                    )
                    _nearbyEvents.value = nearby
                }

                // Load trending events
                val trending = eventRepository.getPopularEvents()
                _trendingEvents.value = trending

                // Load categories and events by category
                val userCategories = user.selectedCategories
                val defaultCategories = listOf("Sports", "Music", "Tech", "Food", "Art", "Other")
                val allCategories = if (userCategories.isEmpty()) defaultCategories else userCategories
                _categories.value = allCategories

                val eventsByCat = mutableMapOf<String, List<Event>>()
                allCategories.forEach { category ->
                    val events = eventRepository.searchEvents(
                        query = "",
                        filters = mapOf("category" to category)
                    )
                    eventsByCat[category] = events
                }
                _eventsByCategory.value = eventsByCat
            } catch (e: Exception) {
                _dashboardState.value = DashboardState.Error(e.message ?: "Failed to load dashboard data")
            }
        }
    }

    fun getEventsByCategory(category: String): List<Event> {
        return _eventsByCategory.value[category] ?: emptyList()
    }
}

sealed class DashboardState {
    object Initial : DashboardState()
    object Loading : DashboardState()
    object Success : DashboardState()
    data class Error(val message: String) : DashboardState()
} 