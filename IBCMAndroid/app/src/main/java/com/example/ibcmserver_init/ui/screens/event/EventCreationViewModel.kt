package com.example.ibcmserver_init.ui.screens.event

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.ui.state.EventCreationState
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import java.time.LocalDate
import java.time.LocalTime
import java.time.format.DateTimeFormatter
import javax.inject.Inject

data class EventFormState(
    val title: String = "",
    val description: String = "",
    val category: String = "",
    val date: LocalDate = LocalDate.now(),
    val time: LocalTime = LocalTime.now(),
    val location: String = "",
    val maxAttendees: Int? = null,
    val visibility: String = "Public",
    val titleError: String? = null,
    val descriptionError: String? = null,
    val categoryError: String? = null,
    val locationError: String? = null
)

@HiltViewModel
class EventCreationViewModel @Inject constructor(
    private val eventRepository: EventRepository
) : ViewModel() {

    private val _creationState = MutableStateFlow<EventCreationState>(EventCreationState.Initial)
    val creationState: StateFlow<EventCreationState> = _creationState.asStateFlow()

    private val _formState = MutableStateFlow(EventFormState())
    val formState: StateFlow<EventFormState> = _formState

    val categories = listOf(
        "Technology",
        "Sports",
        "Music",
        "Art",
        "Food",
        "Travel",
        "Education",
        "Business",
        "Health",
        "Science",
        "Entertainment",
        "Social"
    )

    val formattedDate: String
        get() = _formState.value.date.format(DateTimeFormatter.ofPattern("MMM dd, yyyy"))

    val formattedTime: String
        get() = _formState.value.time.format(DateTimeFormatter.ofPattern("hh:mm a"))

    fun updateTitle(newTitle: String) {
        _formState.value = _formState.value.copy(
            title = newTitle,
            titleError = null
        )
    }

    fun updateDescription(newDescription: String) {
        _formState.value = _formState.value.copy(
            description = newDescription,
            descriptionError = null
        )
    }

    fun updateCategory(newCategory: String) {
        _formState.value = _formState.value.copy(
            category = newCategory,
            categoryError = null
        )
    }

    fun updateDate(newDate: LocalDate) {
        _formState.value = _formState.value.copy(date = newDate)
    }

    fun updateTime(newTime: LocalTime) {
        _formState.value = _formState.value.copy(time = newTime)
    }

    fun updateAddress(newAddress: String) {
        _formState.value = _formState.value.copy(
            location = newAddress,
            locationError = null
        )
    }

    fun updateLatitude(latitudeStr: String) {
        try {
            val lat = latitudeStr.toDoubleOrNull()
            if (lat != null && lat in -90.0..90.0) {
                // Update location
            } else {
                _formState.value = _formState.value.copy(locationError = "Invalid latitude")
            }
        } catch (e: NumberFormatException) {
            _formState.value = _formState.value.copy(locationError = "Invalid latitude format")
        }
    }

    fun updateLongitude(longitudeStr: String) {
        try {
            val lng = longitudeStr.toDoubleOrNull()
            if (lng != null && lng in -180.0..180.0) {
                // Update location
            } else {
                _formState.value = _formState.value.copy(locationError = "Invalid longitude")
            }
        } catch (e: NumberFormatException) {
            _formState.value = _formState.value.copy(locationError = "Invalid longitude format")
        }
    }

    fun updateMaxAttendees(value: String) {
        _formState.value = _formState.value.copy(
            maxAttendees = value.toIntOrNull()
        )
    }

    fun updateVisibility(newVisibility: String) {
        _formState.value = _formState.value.copy(visibility = newVisibility)
    }

    fun createEvent(
        title: String,
        description: String,
        category: String,
        date: String,
        time: String,
        location: String,
        maxAttendees: Int
    ) {
        viewModelScope.launch {
            try {
                _creationState.value = EventCreationState.Loading

                val event = Event(
                    id = "",  // Will be set by Firebase
                    title = title,
                    description = description,
                    category = category,
                    date = date,
                    time = time,
                    location = location,
                    maxAttendees = maxAttendees,
                    creatorId = "",  // Will be set by repository
                    attendees = emptyList(),
                    createdAt = System.currentTimeMillis()
                )

                eventRepository.createEvent(event)
                _creationState.value = EventCreationState.Success
            } catch (e: Exception) {
                _creationState.value = EventCreationState.Error(e.message ?: "Failed to create event")
            }
        }
    }

    private fun validateInput(): Boolean {
        var isValid = true
        val currentState = _formState.value

        val newState = currentState.copy(
            titleError = if (currentState.title.isBlank()) "Title is required" else null,
            descriptionError = if (currentState.description.isBlank()) "Description is required" else null,
            categoryError = if (currentState.category.isBlank()) "Category is required" else null,
            locationError = if (currentState.location.isBlank()) "Address is required" else null
        )

        _formState.value = newState

        isValid = newState.titleError == null &&
                newState.descriptionError == null &&
                newState.categoryError == null &&
                newState.locationError == null

        return isValid
    }
}

sealed class EventCreationState {
    object Initial : EventCreationState()
    object Loading : EventCreationState()
    object Success : EventCreationState()
    data class Error(val message: String) : EventCreationState()
} 