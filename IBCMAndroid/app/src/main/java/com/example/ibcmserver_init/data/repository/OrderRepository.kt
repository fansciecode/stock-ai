package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.OrderApiService
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.order.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

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
} 