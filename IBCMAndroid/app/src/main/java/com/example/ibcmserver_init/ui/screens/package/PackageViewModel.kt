package com.example.ibcmserver_init.ui.screens.package

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.package.EventPackage
import com.example.ibcmserver_init.data.model.package.UserEventLimit
import com.example.ibcmserver_init.data.repositories.PackageRepository
import com.example.ibcmserver_init.data.repositories.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import java.util.Locale
import javax.inject.Inject

@HiltViewModel
class PackageViewModel @Inject constructor(
    private val packageRepository: PackageRepository,
    private val paymentRepository: PaymentRepository
) {
    private val _uiState = MutableStateFlow<PackageUiState>(PackageUiState.Initial)
    val uiState: StateFlow<PackageUiState> = _uiState.asStateFlow()

    private val currencySymbol = when (Locale.getDefault().country) {
        "IN" -> "₹"
        "US" -> "$"
        "GB" -> "£"
        "EU" -> "€"
        else -> "$"
    }

    fun loadAvailablePackages() {
        viewModelScope.launch {
            try {
                _uiState.value = PackageUiState.Loading
                val packages = packageRepository.getAvailablePackages()
                _uiState.value = PackageUiState.PackagesLoaded(packages)
            } catch (e: Exception) {
                _uiState.value = PackageUiState.Error(e.message ?: "Failed to load packages")
            }
        }
    }

    fun loadUserEventLimit() {
        viewModelScope.launch {
            try {
                _uiState.value = PackageUiState.Loading
                val limit = packageRepository.getUserEventLimit()
                _uiState.value = PackageUiState.EventLimitLoaded(limit)
            } catch (e: Exception) {
                _uiState.value = PackageUiState.Error(e.message ?: "Failed to load event limit")
            }
        }
    }

    fun checkEventCreationAvailability() {
        viewModelScope.launch {
            try {
                _uiState.value = PackageUiState.Loading
                val limit = packageRepository.getUserEventLimit()
                _uiState.value = if (limit.remainingEvents > 0) {
                    PackageUiState.CanCreateEvent(limit)
                } else {
                    PackageUiState.NeedPackage(limit)
                }
            } catch (e: Exception) {
                _uiState.value = PackageUiState.Error(e.message ?: "Failed to check event creation availability")
            }
        }
    }

    fun initiatePayment(packageId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PackageUiState.Loading
                val packageDetails = packageRepository.getPackageDetails(packageId)
                val paymentIntent = paymentRepository.createPaymentIntent(
                    amount = packageDetails.price,
                    currency = when (Locale.getDefault().country) {
                        "IN" -> "INR"
                        "US" -> "USD"
                        "GB" -> "GBP"
                        "EU" -> "EUR"
                        else -> "USD"
                    },
                    description = "Purchase ${packageDetails.name} package",
                    metadata = mapOf(
                        "package_id" to packageId,
                        "event_limit" to packageDetails.eventLimit.toString()
                    )
                )
                _uiState.value = PackageUiState.PaymentInitiated(paymentIntent)
            } catch (e: Exception) {
                _uiState.value = PackageUiState.Error(e.message ?: "Failed to initiate payment")
            }
        }
    }

    fun handlePaymentResult(success: Boolean, message: String) {
        if (success) {
            loadUserEventLimit()
        } else {
            _uiState.value = PackageUiState.Error(message)
        }
    }

    fun getCurrencySymbol(): String = currencySymbol
}

sealed class PackageUiState {
    object Initial : PackageUiState()
    object Loading : PackageUiState()
    data class PackagesLoaded(val packages: List<EventPackage>) : PackageUiState()
    data class EventLimitLoaded(val limit: UserEventLimit) : PackageUiState()
    data class CanCreateEvent(val limit: UserEventLimit) : PackageUiState()
    data class NeedPackage(val limit: UserEventLimit) : PackageUiState()
    data class PaymentInitiated(val paymentIntent: Any) : PackageUiState()
    data class Error(val message: String) : PackageUiState()
} 