package com.example.ibcmserver_init.ui.screens.profile

import androidx.compose.runtime.getValue
import androidx.compose.runtime.mutableStateOf
import androidx.compose.runtime.setValue
import androidx.lifecycle.SavedStateHandle
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.User
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.data.repository.ReportRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject
import java.util.UUID

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val eventRepository: EventRepository,
    private val reportRepository: ReportRepository,
    savedStateHandle: SavedStateHandle
) : ViewModel() {

    private val userId: String = checkNotNull(savedStateHandle.get<String>("userId"))
        ?: throw IllegalArgumentException("userId is required")

    var user by mutableStateOf<User?>(null)
        private set

    private val _createdEvents = MutableStateFlow<List<Event>>(emptyList())
    val createdEvents: StateFlow<List<Event>> = _createdEvents

    private val _attendingEvents = MutableStateFlow<List<Event>>(emptyList())
    val attendingEvents: StateFlow<List<Event>> = _attendingEvents

    var isLoading by mutableStateOf(false)
        private set

    var error by mutableStateOf<String?>(null)
        private set

    init {
        loadUserProfile()
    }

    private fun loadUserProfile() {
        viewModelScope.launch {
            isLoading = true
            error = null
            try {
                user = userRepository.getUserById(userId) 
                    ?: throw IllegalStateException("User not found")
                loadUserEvents()
            } catch (e: Exception) {
                error = e.message ?: "Failed to load user profile"
            } finally {
                isLoading = false
            }
        }
    }

    private fun loadUserEvents() {
        viewModelScope.launch {
            try {
                val created = eventRepository.searchEvents(creatorId = userId)
                _createdEvents.value = created

                val attending = eventRepository.searchEvents(attendeeId = userId)
                _attendingEvents.value = attending
            } catch (e: Exception) {
                error = e.message ?: "Failed to load user events"
            }
        }
    }

    fun updateProfile(displayName: String, email: String, bio: String) {
        viewModelScope.launch {
            isLoading = true
            error = null
            try {
                val updatedUser = user?.copy(
                    displayName = displayName,
                    email = email,
                    bio = bio
                )
                if (updatedUser != null) {
                    val success = userRepository.updateUser(updatedUser)
                    if (success) {
                        user = updatedUser
                    } else {
                        throw IllegalStateException("Failed to update user")
                    }
                }
            } catch (e: Exception) {
                error = e.message ?: "Failed to update profile"
            } finally {
                isLoading = false
            }
        }
    }

    fun logout() {
        viewModelScope.launch {
            try {
                userRepository.logout()
            } catch (e: Exception) {
                error = e.message ?: "Failed to logout"
            }
        }
    }

    fun clearError() {
        error = null
    }

    fun reportUser(reason: String) {
        viewModelScope.launch {
            try {
                val report = Report(
                    id = UUID.randomUUID().toString(),
                    type = "USER",
                    targetId = userId,
                    reason = reason,
                    reporterId = userRepository.getCurrentUserId(),
                    timestamp = System.currentTimeMillis(),
                    status = "PENDING"
                )
                reportRepository.submitReport(report)
                error = null
            } catch (e: Exception) {
                error = e.message ?: "Failed to report user"
            }
        }
    }
} 