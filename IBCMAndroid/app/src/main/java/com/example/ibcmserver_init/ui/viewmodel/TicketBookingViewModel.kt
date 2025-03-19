package com.example.ibcmserver_init.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.event.*
import com.example.ibcmserver_init.data.repository.EnhancedEventRepository
import com.example.ibcmserver_init.ui.screens.event.SeatInfo
import com.example.ibcmserver_init.utils.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class TicketBookingViewModel @Inject constructor(
    private val repository: EnhancedEventRepository
) : ViewModel() {

    private val _bookingState = MutableStateFlow<NetworkResult<EnhancedEvent>>(NetworkResult.Initial())
    val bookingState: StateFlow<NetworkResult<EnhancedEvent>> = _bookingState

    private val _seatingState = MutableStateFlow<NetworkResult<SeatingArrangement>>(NetworkResult.Initial())
    val seatingState: StateFlow<NetworkResult<SeatingArrangement>> = _seatingState

    private val _selectedSeats = MutableStateFlow<List<SeatInfo>>(emptyList())
    val selectedSeats: StateFlow<List<SeatInfo>> = _selectedSeats

    private val _aiRecommendations = MutableStateFlow<NetworkResult<List<List<SeatInfo>>>>(NetworkResult.Initial())
    val aiRecommendations: StateFlow<NetworkResult<List<List<SeatInfo>>>> = _aiRecommendations

    fun loadEventDetails(eventId: String) {
        viewModelScope.launch {
            _bookingState.value = NetworkResult.Loading()
            try {
                repository.getEvent(eventId).collectLatest { result ->
                    _bookingState.value = result
                    if (result is NetworkResult.Success) {
                        loadSeatingArrangement(result.data)
                        generateAIRecommendations(result.data)
                    }
                }
            } catch (e: Exception) {
                _bookingState.value = NetworkResult.Error("Failed to load event: ${e.message}")
            }
        }
    }

    private fun loadSeatingArrangement(event: EnhancedEvent) {
        viewModelScope.launch {
            _seatingState.value = NetworkResult.Loading()
            try {
                when (val eventType = event.eventType) {
                    is EventType.TicketEvent -> {
                        eventType.seatingArrangement?.let { seating ->
                            _seatingState.value = NetworkResult.Success(seating)
                        } ?: run {
                            _seatingState.value = NetworkResult.Error("No seating arrangement available")
                        }
                    }
                    else -> _seatingState.value = NetworkResult.Error("Not a ticket event")
                }
            } catch (e: Exception) {
                _seatingState.value = NetworkResult.Error("Failed to load seating: ${e.message}")
            }
        }
    }

    private fun generateAIRecommendations(event: EnhancedEvent) {
        viewModelScope.launch {
            _aiRecommendations.value = NetworkResult.Loading()
            try {
                repository.generateSeatingRecommendations(event.id).collectLatest { result ->
                    _aiRecommendations.value = result
                }
            } catch (e: Exception) {
                _aiRecommendations.value = NetworkResult.Error("Failed to generate recommendations: ${e.message}")
            }
        }
    }

    fun toggleSeatSelection(seat: SeatInfo) {
        val currentSeats = _selectedSeats.value
        _selectedSeats.value = if (currentSeats.contains(seat)) {
            currentSeats - seat
        } else {
            currentSeats + seat
        }
    }

    fun applyRecommendedSeats(seats: List<SeatInfo>) {
        _selectedSeats.value = seats
    }

    fun bookTickets() {
        viewModelScope.launch {
            val event = (bookingState.value as? NetworkResult.Success)?.data ?: return@launch
            val seats = selectedSeats.value
            if (seats.isEmpty()) return@launch

            try {
                repository.bookTickets(
                    eventId = event.id,
                    seats = seats.map { seat ->
                        SeatBooking(
                            section = seat.section,
                            row = seat.row,
                            seatNumber = seat.number
                        )
                    }
                ).collectLatest { result ->
                    when (result) {
                        is NetworkResult.Success -> {
                            // Handle successful booking
                            _selectedSeats.value = emptyList()
                        }
                        is NetworkResult.Error -> {
                            // Handle booking error
                        }
                        else -> {}
                    }
                }
            } catch (e: Exception) {
                // Handle booking error
            }
        }
    }
}

data class SeatBooking(
    val section: String,
    val row: String,
    val seatNumber: String
) 