package com.example.ibcmserver_init.ui.screens.category

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class CategorySelectionState {
    object Initial : CategorySelectionState()
    object Loading : CategorySelectionState()
    object Success : CategorySelectionState()
    data class Error(val message: String) : CategorySelectionState()
}

@HiltViewModel
class CategorySelectionViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    private val _state = MutableStateFlow<CategorySelectionState>(CategorySelectionState.Initial)
    val state: StateFlow<CategorySelectionState> = _state.asStateFlow()

    val availableCategories = listOf(
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

    fun saveSelectedCategories(categories: Set<String>) {
        viewModelScope.launch {
            try {
                _state.value = CategorySelectionState.Loading
                val currentUser = userRepository.getCurrentUser()
                if (currentUser != null) {
                    val updatedUser = currentUser.copy(
                        interests = categories.toList(),
                        updatedAt = System.currentTimeMillis()
                    )
                    userRepository.updateUserProfile(updatedUser)
                    _state.value = CategorySelectionState.Success
                } else {
                    _state.value = CategorySelectionState.Error("User not found")
                }
            } catch (e: Exception) {
                _state.value = CategorySelectionState.Error(e.message ?: "Failed to save categories")
            }
        }
    }
} 