package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.PaymentApiService
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.payment.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApiService: PaymentApiService
) {
    fun initiatePayment(request: PaymentRequest): Flow<NetworkResult<PaymentResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.initiatePayment(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to initiate payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun confirmPayment(confirmation: PaymentConfirmation): Flow<NetworkResult<PaymentResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.confirmPayment(confirmation)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to confirm payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun upgradeEvent(eventId: String, request: EventUpgradeRequest): Flow<NetworkResult<PaymentResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.upgradeEvent(eventId, request)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to upgrade event: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun createSubscription(request: SubscriptionRequest): Flow<NetworkResult<PaymentResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.createSubscription(request)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to create subscription: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun cancelSubscription(): Flow<NetworkResult<Map<String, Any>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.cancelSubscription()
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to cancel subscription: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun requestRefund(request: RefundRequest): Flow<NetworkResult<PaymentResponse>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.requestRefund(request)
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

    fun getPaymentStatus(paymentId: String): Flow<NetworkResult<PaymentVerification>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.getPaymentStatus(paymentId)
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

    fun verifyPayment(paymentId: String): Flow<NetworkResult<PaymentVerification>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.verifyPayment(paymentId)
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to verify payment: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun getPaymentHistory(): Flow<NetworkResult<List<PaymentResponse>>> = flow {
        emit(NetworkResult.Loading())
        try {
            val response = paymentApiService.getPaymentHistory()
            if (response.isSuccessful) {
                response.body()?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to get payment history: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }

    fun createPaymentIntent(amount: Double, currency: String = "USD", metadata: Map<String, Any> = emptyMap()): Flow<NetworkResult<String>> = flow {
        emit(NetworkResult.Loading())
        try {
            val request = mapOf(
                "amount" to amount,
                "currency" to currency,
                "metadata" to metadata
            )
            val response = paymentApiService.createPaymentIntent(request)
            if (response.isSuccessful) {
                response.body()?.get("clientSecret")?.let {
                    emit(NetworkResult.Success(it))
                } ?: emit(NetworkResult.Error("Empty response body"))
            } else {
                emit(NetworkResult.Error("Failed to create payment intent: ${response.message()}"))
            }
        } catch (e: Exception) {
            emit(NetworkResult.Error("Network error: ${e.message}"))
        }
    }
} 