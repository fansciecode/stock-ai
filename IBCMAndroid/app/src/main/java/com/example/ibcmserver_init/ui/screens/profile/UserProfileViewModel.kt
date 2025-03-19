package com.example.ibcmserver_init.ui.screens.profile

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.models.*
import com.example.ibcmserver_init.data.repository.UserRepository
import com.example.ibcmserver_init.data.repository.EventRepository
import com.example.ibcmserver_init.data.repository.ReviewRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class UserProfileViewModel @Inject constructor(
    private val userRepository: UserRepository,
    private val eventRepository: EventRepository,
    private val reviewRepository: ReviewRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(UserProfileUiState())
    val uiState: StateFlow<UserProfileUiState> = _uiState.asStateFlow()

    init {
        loadProfileData()
    }

    private fun loadProfileData() {
        viewModelScope.launch {
            try {
                // Load user profile
                val userProfile = userRepository.getUserProfile()
                
                // Load events
                val events = eventRepository.getUserEvents(userProfile.id)
                
                // Load reviews
                val reviews = reviewRepository.getUserReviews(userProfile.id)
                
                // Load analytics if business profile
                val analytics = if (userProfile.isBusinessProfile) {
                    eventRepository.getBusinessAnalytics(userProfile.id)
                } else null

                _uiState.update { currentState ->
                    currentState.copy(
                        profile = userProfile,
                        events = events,
                        reviews = reviews,
                        analytics = analytics,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        error = e.message ?: "Failed to load profile data",
                isLoading = false
                    )
                }
            }
        }
    }

    fun updateProfile(update: ProfileUpdate) {
        viewModelScope.launch {
            try {
                userRepository.updateProfile(update)
                loadProfileData() // Reload profile data
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        error = e.message ?: "Failed to update profile"
                    )
                }
            }
        }
    }

    fun toggleFollow() {
        viewModelScope.launch {
            try {
                val currentState = _uiState.value
                if (currentState.isFollowing) {
                    userRepository.unfollowUser(currentState.profile.id)
                    } else {
                    userRepository.followUser(currentState.profile.id)
                }
                _uiState.update { it.copy(isFollowing = !it.isFollowing) }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        error = e.message ?: "Failed to update follow status"
                    )
                }
            }
        }
    }

    fun submitVerification() {
        viewModelScope.launch {
            try {
                userRepository.submitVerification()
                _uiState.update { currentState ->
                    currentState.copy(
                        profile = currentState.profile.copy(
                            verificationStatus = "PENDING"
                        )
                    )
                }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        error = e.message ?: "Failed to submit verification"
                    )
                }
            }
        }
    }

    fun navigateToEvent(eventId: String) {
        // Handle navigation to event details
    }

    fun navigateToReview(reviewId: String) {
        // Handle navigation to review details
    }

    fun navigateToAnalytics(analyticsId: String) {
        // Handle navigation to analytics details
    }
}

data class UserProfileUiState(
    val profile: UserProfile = UserProfile(),
    val events: UserEvents = UserEvents(),
    val reviews: List<Review> = emptyList(),
    val analytics: BusinessAnalytics? = null,
    val isFollowing: Boolean = false,
    val isLoading: Boolean = true,
    val error: String? = null
)

data class UserProfile(
    val id: String = "",
    val name: String = "",
    val email: String = "",
    val avatar: String = "",
    val bio: String = "",
    val location: String = "",
    val isVerified: Boolean = false,
    val verificationBadge: String = "",
    val verificationStatus: String = "",
    val isBusinessProfile: Boolean = false,
    val businessDetails: BusinessDetails? = null
)

data class UserEvents(
    val upcoming: List<Event> = emptyList(),
    val past: List<Event> = emptyList()
)

data class Event(
    val id: String,
    val title: String,
    val thumbnail: String,
    val date: String,
    val status: String
)

data class Review(
    val id: String,
    val eventId: String,
    val eventTitle: String,
    val eventThumbnail: String,
    val rating: Int,
    val comment: String,
    val date: String
)

data class BusinessAnalytics(
    val totalRevenue: Double = 0.0,
    val monthlyRevenue: Double = 0.0,
    val totalEvents: Int = 0,
    val averageAttendance: Int = 0,
    val totalCustomers: Int = 0,
    val repeatCustomers: Int = 0
)

data class ProfileUpdate(
    val name: String,
    val bio: String,
    val location: String
)

data class BusinessDetails(
    val businessName: String,
    val businessType: String,
    val registrationNumber: String,
    val taxId: String,
    val businessAddress: String,
    val operatingHours: Map<String, String>,
    val contactInfo: ContactInfo
)

data class ContactInfo(
    val phone: String,
    val email: String,
    val website: String?
) 