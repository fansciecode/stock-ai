package com.example.ibcmserver_init.ui.state

sealed class DashboardState {
    object Initial : DashboardState()
    object Loading : DashboardState()
    object Success : DashboardState()
    data class Error(val message: String) : DashboardState()
}

sealed class EventCreationState {
    object Initial : EventCreationState()
    object Loading : EventCreationState()
    data class Success(val eventId: String) : EventCreationState()
    data class Error(val message: String) : EventCreationState()
}

sealed class CategorySelectionState {
    object Initial : CategorySelectionState()
    object Loading : CategorySelectionState()
    object Success : CategorySelectionState()
    data class Error(val message: String) : CategorySelectionState()
} 