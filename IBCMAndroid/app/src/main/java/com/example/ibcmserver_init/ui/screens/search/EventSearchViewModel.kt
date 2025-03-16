package com.example.ibcmserver_init.ui.screens.search

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.repository.EventRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class EventSearchViewModel @Inject constructor(
    private val eventRepository: EventRepository
) : ViewModel() {

    var searchQuery by mutableStateOf("")
        private set

    var selectedCategory by mutableStateOf<String?>(null)
        private set

    var selectedDate by mutableStateOf<Date?>(null)
        private set

    var radius by mutableStateOf(10.0) // Default 10km radius
        private set

    var currentLocation by mutableStateOf<Pair<Double, Double>?>(null)
        private set

    var isLoading by mutableStateOf(false)
        private set

    var error by mutableStateOf<String?>(null)
        private set

    private val _searchResults = MutableStateFlow<List<Event>>(emptyList())
    val searchResults: StateFlow<List<Event>> = _searchResults.asStateFlow()

    val availableCategories = listOf(
        "Sports",
        "Music",
        "Technology",
        "Art",
        "Food",
        "Travel",
        "Education",
        "Business",
        "Health",
        "Entertainment"
    )

    fun updateSearchQuery(query: String) {
        searchQuery = query
        performSearch()
    }

    fun updateCategory(category: String?) {
        selectedCategory = category
        performSearch()
    }

    fun updateDate(date: Date?) {
        selectedDate = date
        performSearch()
    }

    fun updateRadius(newRadius: Double) {
        radius = newRadius
        if (currentLocation != null) {
            performSearch()
        }
    }

    fun updateLocation(latitude: Double, longitude: Double) {
        currentLocation = Pair(latitude, longitude)
        performSearch()
    }

    private fun performSearch() {
        viewModelScope.launch {
            isLoading = true
            error = null

            try {
                val events = if (currentLocation != null) {
                    eventRepository.getNearbyEvents(
                        currentLocation!!.first,
                        currentLocation!!.second,
                        radius
                    )
                } else {
                    eventRepository.searchEvents(searchQuery)
                }

                _searchResults.value = events
                    .filter { event ->
                        var matches = true
                        
                        // Apply category filter
                        if (selectedCategory != null) {
                            matches = matches && event.category == selectedCategory
                        }

                        // Apply date filter
                        if (selectedDate != null) {
                            val eventDate = Calendar.getInstance().apply { time = event.date }
                            val filterDate = Calendar.getInstance().apply { time = selectedDate!! }
                            
                            matches = matches && 
                                eventDate.get(Calendar.YEAR) == filterDate.get(Calendar.YEAR) &&
                                eventDate.get(Calendar.MONTH) == filterDate.get(Calendar.MONTH) &&
                                eventDate.get(Calendar.DAY_OF_MONTH) == filterDate.get(Calendar.DAY_OF_MONTH)
                        }

                        matches
                    }
                    .collect { filteredEvents ->
                        _searchResults.value = filteredEvents
                    }
            } catch (e: Exception) {
                error = e.message ?: "Failed to search events"
                _searchResults.value = emptyList()
            } finally {
                isLoading = false
            }
        }
    }

    fun clearError() {
        error = null
    }

    fun clearFilters() {
        selectedCategory = null
        selectedDate = null
        radius = 10.0
        performSearch()
    }
} 