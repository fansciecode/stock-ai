package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.OrderApiService
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.order.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton
import android.graphics.Bitmap
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow

@Singleton
class OrderRepository @Inject constructor(
    private val orderApiService: OrderApiService
) {
    fun createOrder(order: Order): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.createOrder(order)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to create order: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getOrder(orderId: String): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getOrder(orderId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get order: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getUserOrders(
        userId: String,
        status: OrderStatus? = null,
        page: Int = 1,
        limit: Int = 20
    ): Flow<NetworkResult<List<OrderSummary>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getUserOrders(userId, status, page, limit)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get user orders: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun processPayment(orderId: String, paymentInfo: PaymentInfo): Flow<NetworkResult<PaymentInfo>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.processPayment(orderId, paymentInfo)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to process payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getPaymentStatus(orderId: String): Flow<NetworkResult<PaymentInfo>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getPaymentStatus(orderId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get payment status: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun requestRefund(orderId: String, request: RefundDetails): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.requestRefund(orderId, request)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to request refund: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun updateOrderStatus(orderId: String, status: OrderStatus): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.updateOrderStatus(orderId, status)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to update order status: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun cancelOrder(orderId: String): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.cancelOrder(orderId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to cancel order: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun updateDeliveryDetails(orderId: String, details: DeliveryDetails): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.updateDeliveryDetails(orderId, details)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to update delivery details: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun processCreatorSettlement(orderId: String): Flow<NetworkResult<SettlementDetails>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.processCreatorSettlement(orderId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to process creator settlement: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getCreatorSettlements(creatorId: String): Flow<NetworkResult<List<SettlementDetails>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getCreatorSettlements(creatorId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get creator settlements: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun updateTrackingInfo(orderId: String, trackingInfo: TrackingInfo): Flow<NetworkResult<Order>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.updateTrackingInfo(orderId, trackingInfo)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to update tracking info: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getCustomerOrders(customerId: String): Flow<NetworkResult<List<Order>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getCustomerOrders(customerId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get customer orders: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getCreatorOrders(creatorId: String): Flow<NetworkResult<List<Order>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = orderApiService.getCreatorOrders(creatorId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get creator orders: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    suspend fun verifyOtp(orderId: String, otp: String): Boolean {
        // Example: Call backend API to verify OTP for the order
        val response = orderApiService.getOrder(orderId) // Replace with actual verifyOtp endpoint if available
        // TODO: Replace with real verification logic
        return response.isSuccessful // Simulate success if order exists
    }

    suspend fun verifyBookingQr(qrContent: String): Boolean {
        // TODO: Implement real backend call to verify QR code for booking
        // For now, always return true
        return true
    }

    suspend fun generateBookingQr(content: String): Bitmap {
        // TODO: Implement real backend call to generate QR code for booking
        // For now, return a dummy Bitmap
        return Bitmap.createBitmap(200, 200, Bitmap.Config.ARGB_8888)
    }

    suspend fun updateBookingStatus(bookingId: String, status: BookingStatus) {
        // Example: Call backend API to update booking status
        // Use updateOrderStatus for now (if booking and order are unified)
        orderApiService.updateOrderStatus(bookingId, status.name)
    }

    suspend fun updateBookingQr(bookingId: String, qrCode: Bitmap) {
        // TODO: Implement real backend call to update booking QR code
        // No-op for now
    }

    // In-memory cache for observed orders
    private val _ordersFlow = MutableStateFlow<List<Order>>(emptyList())
    val ordersFlow = _ordersFlow.asStateFlow()

    fun observeBusinessOrders(businessId: String): Flow<List<Order>> {
        // Just return the flow for now
        return ordersFlow
    }

    suspend fun refreshOrders(businessId: String) {
        // Fetch orders for the creator/business and update the flow
        val response = orderApiService.getCreatorOrders(businessId)
        if (response.isSuccessful) {
            _ordersFlow.value = response.body() ?: emptyList()
        } else {
            _ordersFlow.value = emptyList()
        }
    }

    fun getOrderSummary(businessId: String): OrderSummary {
        val orders = _ordersFlow.value
        return OrderSummary(
            totalOrders = orders.size,
            pendingOrders = orders.count { it.status == OrderStatus.PENDING },
            completedOrders = orders.count { it.status == OrderStatus.COMPLETED },
            cancelledOrders = orders.count { it.status == OrderStatus.CANCELLED },
            totalRevenue = orders.sumOf { it.totalPrice ?: 0.0 },
            averageOrderValue = if (orders.isNotEmpty()) orders.sumOf { it.totalPrice ?: 0.0 } / orders.size else 0.0
        )
    }
} 