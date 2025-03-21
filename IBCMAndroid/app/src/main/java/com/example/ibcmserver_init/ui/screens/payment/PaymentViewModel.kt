package com.example.ibcmserver_init.ui.screens.payment

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.payment.*
import com.example.ibcmserver_init.data.repositories.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) {
    private val _uiState = MutableStateFlow<PaymentUiState>(PaymentUiState.Initial)
    val uiState: StateFlow<PaymentUiState> = _uiState.asStateFlow()

    fun upgradeEvent(eventId: String, upgradeType: EventUpgradeType, paymentMethodId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val paymentIntent = paymentRepository.upgradeEvent(eventId, upgradeType, paymentMethodId)
                _uiState.value = PaymentUiState.Success(paymentIntent)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to upgrade event")
            }
        }
    }

    fun purchasePackage(packageId: String, paymentMethodId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val paymentIntent = paymentRepository.purchasePackage(packageId, paymentMethodId)
                _uiState.value = PaymentUiState.Success(paymentIntent)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to purchase package")
            }
        }
    }

    fun bookEvent(eventId: String, quantity: Int, ticketType: String, paymentMethodId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val paymentIntent = paymentRepository.bookEvent(eventId, quantity, ticketType, paymentMethodId)
                _uiState.value = PaymentUiState.Success(paymentIntent)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to book event")
            }
        }
    }

    fun confirmPayment(paymentIntentId: String, paymentMethodId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val paymentIntent = paymentRepository.confirmPayment(paymentIntentId, paymentMethodId)
                _uiState.value = PaymentUiState.Success(paymentIntent)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to confirm payment")
            }
        }
    }

    fun refundPayment(paymentId: String, amount: Int? = null) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val refundResponse = paymentRepository.refundPayment(paymentId, amount)
                _uiState.value = PaymentUiState.RefundSuccess(refundResponse)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to process refund")
            }
        }
    }

    fun getPaymentHistory(page: Int = 1, limit: Int = 10) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val history = paymentRepository.getPaymentHistory(page, limit)
                _uiState.value = PaymentUiState.HistoryLoaded(history)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to load payment history")
            }
        }
    }

    fun getPaymentStatus(paymentId: String) {
        viewModelScope.launch {
            try {
                _uiState.value = PaymentUiState.Loading
                val payment = paymentRepository.getPaymentStatus(paymentId)
                _uiState.value = PaymentUiState.PaymentStatusLoaded(payment)
            } catch (e: Exception) {
                _uiState.value = PaymentUiState.Error(e.message ?: "Failed to get payment status")
            }
        }
    }
}

sealed class PaymentUiState {
    object Initial : PaymentUiState()
    object Loading : PaymentUiState()
    data class Success(val paymentIntent: PaymentIntent) : PaymentUiState()
    data class RefundSuccess(val refundResponse: RefundResponse) : PaymentUiState()
    data class HistoryLoaded(val history: PaymentHistory) : PaymentUiState()
    data class PaymentStatusLoaded(val payment: Payment) : PaymentUiState()
    data class Error(val message: String) : PaymentUiState()
} 