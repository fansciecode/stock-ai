package com.example.ibcmserver_init.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.payment.*
import com.example.ibcmserver_init.data.repository.PaymentRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class PaymentViewModel @Inject constructor(
    private val paymentRepository: PaymentRepository
) : ViewModel() {

    private val _paymentState = MutableStateFlow<NetworkResult<PaymentResponse>>(NetworkResult.Initial())
    val paymentState: StateFlow<NetworkResult<PaymentResponse>> = _paymentState

    private val _paymentVerificationState = MutableStateFlow<NetworkResult<PaymentVerification>>(NetworkResult.Initial())
    val paymentVerificationState: StateFlow<NetworkResult<PaymentVerification>> = _paymentVerificationState

    private val _paymentHistoryState = MutableStateFlow<NetworkResult<List<PaymentResponse>>>(NetworkResult.Initial())
    val paymentHistoryState: StateFlow<NetworkResult<List<PaymentResponse>>> = _paymentHistoryState

    private val _paymentIntentState = MutableStateFlow<NetworkResult<String>>(NetworkResult.Initial())
    val paymentIntentState: StateFlow<NetworkResult<String>> = _paymentIntentState

    fun initiatePayment(request: PaymentRequest) {
        viewModelScope.launch {
            paymentRepository.initiatePayment(request)
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentState.value = it }
        }
    }

    fun confirmPayment(confirmation: PaymentConfirmation) {
        viewModelScope.launch {
            paymentRepository.confirmPayment(confirmation)
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentState.value = it }
        }
    }

    fun upgradeEvent(eventId: String, request: EventUpgradeRequest) {
        viewModelScope.launch {
            paymentRepository.upgradeEvent(eventId, request)
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentState.value = it }
        }
    }

    fun createSubscription(request: SubscriptionRequest) {
        viewModelScope.launch {
            paymentRepository.createSubscription(request)
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentState.value = it }
        }
    }

    fun cancelSubscription() {
        viewModelScope.launch {
            paymentRepository.cancelSubscription()
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { result ->
                    when (result) {
                        is NetworkResult.Success -> {
                            _paymentState.value = NetworkResult.Success(
                                PaymentResponse(
                                    id = "",
                                    status = "cancelled",
                                    amount = 0.0,
                                    currency = "USD",
                                    metadata = result.data
                                )
                            )
                        }
                        is NetworkResult.Error -> _paymentState.value = NetworkResult.Error(result.message)
                        is NetworkResult.Loading -> _paymentState.value = NetworkResult.Loading()
                        is NetworkResult.Initial -> _paymentState.value = NetworkResult.Initial()
                    }
                }
        }
    }

    fun requestRefund(request: RefundRequest) {
        viewModelScope.launch {
            paymentRepository.requestRefund(request)
                .catch { e -> _paymentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentState.value = it }
        }
    }

    fun getPaymentStatus(paymentId: String) {
        viewModelScope.launch {
            paymentRepository.getPaymentStatus(paymentId)
                .catch { e -> _paymentVerificationState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentVerificationState.value = it }
        }
    }

    fun verifyPayment(paymentId: String) {
        viewModelScope.launch {
            paymentRepository.verifyPayment(paymentId)
                .catch { e -> _paymentVerificationState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentVerificationState.value = it }
        }
    }

    fun getPaymentHistory() {
        viewModelScope.launch {
            paymentRepository.getPaymentHistory()
                .catch { e -> _paymentHistoryState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentHistoryState.value = it }
        }
    }

    fun createPaymentIntent(amount: Double, currency: String = "USD", metadata: Map<String, Any> = emptyMap()) {
        viewModelScope.launch {
            paymentRepository.createPaymentIntent(amount, currency, metadata)
                .catch { e -> _paymentIntentState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _paymentIntentState.value = it }
        }
    }

    fun resetPaymentState() {
        _paymentState.value = NetworkResult.Initial()
        _paymentVerificationState.value = NetworkResult.Initial()
        _paymentIntentState.value = NetworkResult.Initial()
    }
} 