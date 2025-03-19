package com.example.ibcmserver_init.ui.screens.auth

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.UserRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

sealed class SignupState {
    object Initial : SignupState()
    object Loading : SignupState()
    data class Success(val user: User) : SignupState()
    data class Error(val message: String) : SignupState()
}

@HiltViewModel
class SignupViewModel @Inject constructor(
    private val userRepository: UserRepository
) : ViewModel() {

    private val _signupState = MutableStateFlow<SignupState>(SignupState.Initial)
    val signupState: StateFlow<SignupState> = _signupState.asStateFlow()

    fun signup(email: String, password: String, displayName: String) {
        viewModelScope.launch {
            _signupState.value = SignupState.Loading
            try {
                val user = userRepository.signup(email, password, displayName)
                _signupState.value = SignupState.Success(user)
            } catch (e: Exception) {
                _signupState.value = SignupState.Error(e.message ?: "Signup failed")
            }
        }
    }
} 