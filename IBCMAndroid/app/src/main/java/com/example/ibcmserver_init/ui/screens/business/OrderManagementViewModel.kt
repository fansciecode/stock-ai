package com.example.ibcmserver_init.ui.screens.business

import android.graphics.Bitmap
import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.delay
import kotlinx.coroutines.flow.*
import kotlinx.coroutines.launch
import java.util.*
import javax.inject.Inject

@HiltViewModel
class OrderManagementViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(OrderManagementUiState())
    val uiState: StateFlow<OrderManagementUiState> = _uiState.asStateFlow()

    private val _selectedOrderIds = MutableStateFlow<Set<String>>(emptySet())
    val selectedOrderIds: StateFlow<Set<String>> = _selectedOrderIds.asStateFlow()

    private val _otpVerificationState = MutableStateFlow<OtpVerificationState>(OtpVerificationState.Idle)
    val otpVerificationState: StateFlow<OtpVerificationState> = _otpVerificationState.asStateFlow()

    init {
        loadOrders()
        observeOrders()
    }

    private fun observeOrders() {
        viewModelScope.launch {
            // Assuming we have the business ID from somewhere
            val businessId = "current_business_id"
            orderRepository.observeBusinessOrders(businessId)
                .collect { orders ->
                    _uiState.update { currentState ->
                        currentState.copy(
                            orders = orders.groupBy { it.status }
                        )
                    }
                }
        }
    }

    fun loadOrders() {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isLoading = true) }
                
                val businessId = "current_business_id" // Replace with actual business ID
                orderRepository.refreshOrders(businessId)
                val summary = orderRepository.getOrderSummary(businessId)

                _uiState.update { currentState ->
                    currentState.copy(
                        isLoading = false,
                        orderSummary = summary,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to load orders"
                    )
                }
            }
        }
    }

    fun refreshOrders() {
        loadOrders()
    }

    fun updateOrderStatus(orderId: String, status: OrderStatus) {
        viewModelScope.launch {
            try {
                orderRepository.updateOrderStatus(orderId, status)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun updateDeliveryStatus(orderId: String, status: DeliveryStatus) {
        viewModelScope.launch {
            try {
                orderRepository.updateDeliveryStatus(orderId, status)
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun updateBatchOrderStatus(status: OrderStatus) {
        viewModelScope.launch {
            try {
                val orderIds = selectedOrderIds.value.toList()
                orderRepository.updateBatchOrderStatus(orderIds, status)
                clearSelectedOrders()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun updateBatchDeliveryStatus(status: DeliveryStatus) {
        viewModelScope.launch {
            try {
                val orderIds = selectedOrderIds.value.toList()
                orderRepository.updateBatchDeliveryStatus(orderIds, status)
                clearSelectedOrders()
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun filterOrders(filter: OrderFilter) {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isLoading = true) }
                val filteredOrders = orderRepository.filterOrders(filter)
                _uiState.update { currentState ->
                    currentState.copy(
                        orders = filteredOrders.groupBy { it.status },
                        isLoading = false,
                        error = null
                    )
                }
            } catch (e: Exception) {
                _uiState.update { currentState ->
                    currentState.copy(
                        isLoading = false,
                        error = e.message ?: "Failed to filter orders"
                    )
                }
            }
        }
    }

    fun toggleOrderSelection(orderId: String) {
        _selectedOrderIds.update { currentSelection ->
            if (currentSelection.contains(orderId)) {
                currentSelection - orderId
            } else {
                currentSelection + orderId
            }
        }
    }

    fun clearSelectedOrders() {
        _selectedOrderIds.value = emptySet()
    }

    fun setOrderFilter(filter: OrderFilter) {
        _uiState.update { it.copy(currentFilter = filter) }
        filterOrders(filter)
    }

    fun clearOrderFilter() {
        _uiState.update { it.copy(currentFilter = null) }
        loadOrders()
    }

    fun verifyOtpAndUpdateOrderStatus(orderId: String, status: OrderStatus, otp: String) {
        viewModelScope.launch {
            try {
                _otpVerificationState.value = OtpVerificationState.Loading
                // Here you would typically make an API call to verify the OTP
                val isVerified = verifyOtp(orderId, otp)
                
                if (isVerified) {
                    updateOrderStatus(orderId, status)
                    _otpVerificationState.value = OtpVerificationState.Success
                } else {
                    _otpVerificationState.value = OtpVerificationState.Error("Invalid OTP")
                }
            } catch (e: Exception) {
                _otpVerificationState.value = OtpVerificationState.Error(e.message ?: "Verification failed")
            }
        }
    }

    fun verifyOtpAndUpdateDeliveryStatus(orderId: String, status: DeliveryStatus, otp: String) {
        viewModelScope.launch {
            try {
                _otpVerificationState.value = OtpVerificationState.Loading
                // Here you would typically make an API call to verify the OTP
                val isVerified = verifyOtp(orderId, otp)
                
                if (isVerified) {
                    updateDeliveryStatus(orderId, status)
                    _otpVerificationState.value = OtpVerificationState.Success
                } else {
                    _otpVerificationState.value = OtpVerificationState.Error("Invalid OTP")
                }
            } catch (e: Exception) {
                _otpVerificationState.value = OtpVerificationState.Error(e.message ?: "Verification failed")
            }
        }
    }

    private suspend fun verifyOtp(orderId: String, otp: String): Boolean {
        return try {
            // Call backend API to verify OTP
            orderRepository.verifyOtp(orderId, otp)
        } catch (e: Exception) {
            throw Exception("Failed to verify OTP: "+e.message)
        }
    }

    fun resetOtpVerificationState() {
        _otpVerificationState.value = OtpVerificationState.Idle
    }

    fun selectDigitalBooking(booking: DigitalBooking) {
        _uiState.update { it.copy(selectedDigitalBooking = booking) }
    }

    fun clearSelectedDigitalBooking() {
        _uiState.update { it.copy(selectedDigitalBooking = null) }
    }

    fun verifyDigitalBookingQr(qrContent: String) {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isLoading = true) }
                val isVerified = orderRepository.verifyBookingQr(qrContent)
                if (isVerified) {
                    _uiState.value.selectedDigitalBooking?.let { booking ->
                        updateDigitalBookingStatus(booking.id, BookingStatus.CHECKED_IN)
                    }
                } else {
                    _uiState.update { it.copy(error = "Invalid QR Code") }
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "Verification failed") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    fun generateDigitalBookingQr(content: String) {
        viewModelScope.launch {
            try {
                _uiState.update { it.copy(isLoading = true) }
                // Call backend API to generate the QR code
                val qrCode = orderRepository.generateBookingQr(content)
                _uiState.value.selectedDigitalBooking?.let { booking ->
                    updateDigitalBookingQr(booking.id, qrCode)
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message ?: "QR code generation failed") }
            } finally {
                _uiState.update { it.copy(isLoading = false) }
            }
        }
    }

    private suspend fun updateDigitalBookingStatus(bookingId: String, status: BookingStatus) {
        try {
            // Call backend API to update the booking status
            orderRepository.updateBookingStatus(bookingId, status)
            _uiState.update { currentState ->
                currentState.copy(
                    digitalBookings = currentState.digitalBookings.map { booking ->
                        if (booking.id == bookingId) {
                            booking.copy(status = status)
                        } else {
                            booking
                        }
                    },
                    selectedDigitalBooking = currentState.selectedDigitalBooking?.let { booking ->
                        if (booking.id == bookingId) {
                            booking.copy(status = status)
                        } else {
                            booking
                        }
                    }
                )
            }
        } catch (e: Exception) {
            throw Exception("Failed to update booking status: ${e.message}")
        }
    }

    private suspend fun updateDigitalBookingQr(bookingId: String, qrCode: Bitmap) {
        try {
            // Call backend API to update the booking QR code
            orderRepository.updateBookingQr(bookingId, qrCode)
            _uiState.update { currentState ->
                currentState.copy(
                    digitalBookings = currentState.digitalBookings.map { booking ->
                        if (booking.id == bookingId) {
                            booking.copy(qrCode = qrCode)
                        } else {
                            booking
                        }
                    },
                    selectedDigitalBooking = currentState.selectedDigitalBooking?.let { booking ->
                        if (booking.id == bookingId) {
                            booking.copy(qrCode = qrCode)
                        } else {
                            booking
                        }
                    }
                )
            }
        } catch (e: Exception) {
            throw Exception("Failed to update booking QR code: ${e.message}")
        }
    }
}

data class OrderManagementUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val orders: Map<OrderStatus, List<Order>> = emptyMap(),
    val orderSummary: OrderSummary? = null,
    val currentFilter: OrderFilter? = null,
    val selectedOrder: Order? = null,
    val selectedDelivery: Delivery? = null,
    val selectedDigitalBooking: DigitalBooking? = null
)

data class OrderStatistics(
    val pendingOrders: Int = 0,
    val processingOrders: Int = 0,
    val completedOrders: Int = 0,
    val totalRevenue: Int = 0
)

enum class OrderStatus {
    PENDING,
    PROCESSING,
    COMPLETED,
    CANCELLED
}

enum class DeliveryStatus {
    PENDING,
    PICKED_UP,
    IN_TRANSIT,
    DELIVERED,
    FAILED
}

data class Order(
    val id: String,
    val customerName: String,
    val orderDate: String,
    val status: OrderStatus,
    val totalAmount: Double,
    val items: List<OrderItem>,
    val deliveryAddress: String? = null,
    val paymentStatus: PaymentStatus = PaymentStatus.PENDING
)

data class OrderItem(
    val id: String,
    val name: String,
    val quantity: Int,
    val price: Double,
    val type: ItemType
)

data class Delivery(
    val id: String,
    val orderId: String,
    val customerName: String,
    val deliveryAddress: String,
    val status: DeliveryStatus,
    val estimatedDeliveryTime: String,
    val trackingNumber: String? = null,
    val deliveryNotes: String? = null
)

enum class ItemType {
    PHYSICAL,
    DIGITAL
}

enum class PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    REFUNDED
}

sealed class OtpVerificationState {
    object Idle : OtpVerificationState()
    object Loading : OtpVerificationState()
    object Success : OtpVerificationState()
    data class Error(val message: String) : OtpVerificationState()
} 