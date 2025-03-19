package com.example.ibcmserver_init.data.repositories

import com.example.ibcmserver_init.data.api.PaymentApi
import com.example.ibcmserver_init.data.model.payment.*
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PaymentRepository @Inject constructor(
    private val paymentApi: PaymentApi
) {
    suspend fun upgradeEvent(
        eventId: String,
        upgradeType: EventUpgradeType,
        paymentMethodId: String
    ): PaymentIntent {
        val request = mapOf(
            "upgradeType" to upgradeType.name,
            "paymentMethodId" to paymentMethodId
        )
        return paymentApi.upgradeEvent(eventId, request)
    }

    suspend fun purchasePackage(
        packageId: String,
        paymentMethodId: String
    ): PaymentIntent {
        val request = mapOf(
            "packageId" to packageId,
            "paymentMethodId" to paymentMethodId
        )
        return paymentApi.purchasePackage(request)
    }

    suspend fun bookEvent(
        eventId: String,
        quantity: Int,
        ticketType: String,
        paymentMethodId: String
    ): PaymentIntent {
        val request = mapOf(
            "eventId" to eventId,
            "quantity" to quantity,
            "ticketType" to ticketType,
            "paymentMethodId" to paymentMethodId
        )
        return paymentApi.bookEvent(request)
    }

    suspend fun confirmPayment(
        paymentIntentId: String,
        paymentMethodId: String
    ): PaymentIntent {
        val request = mapOf(
            "paymentIntentId" to paymentIntentId,
            "paymentMethodId" to paymentMethodId
        )
        return paymentApi.confirmPayment(request)
    }

    suspend fun refundPayment(
        paymentId: String,
        amount: Int? = null,
        reason: String = "requested_by_customer"
    ): RefundResponse {
        val request = RefundRequest(paymentId, amount, reason)
        return paymentApi.refundPayment(request)
    }

    suspend fun getPaymentHistory(
        page: Int = 1,
        limit: Int = 10
    ): PaymentHistory {
        return paymentApi.getPaymentHistory(page, limit)
    }

    suspend fun getPaymentStatus(paymentId: String): Payment {
        return paymentApi.getPaymentStatus(paymentId)
    }

    suspend fun createPaymentIntent(
        amount: Int,
        currency: String,
        type: PaymentType,
        metadata: PaymentMetadata
    ): PaymentIntent {
        val request = mapOf(
            "amount" to amount,
            "currency" to currency,
            "type" to type.name,
            "metadata" to metadata
        )
        return paymentApi.createPaymentIntent(request)
    }

    suspend fun validatePayment(paymentId: String): Map<String, Any> {
        return paymentApi.validatePayment(paymentId)
    }
} 