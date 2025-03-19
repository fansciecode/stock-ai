package com.example.ibcmserver_init.data.model.payment

import java.time.Instant

data class Payment(
    val id: String,
    val userId: String,
    val amount: Int,
    val currency: String = "usd",
    val status: PaymentStatus,
    val type: PaymentType,
    val createdAt: String = Instant.now().toString(),
    val updatedAt: String = Instant.now().toString(),
    val stripePaymentId: String? = null,
    val stripeCustomerId: String? = null,
    val metadata: PaymentMetadata
)

enum class PaymentStatus {
    PENDING,
    COMPLETED,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED
}

enum class PaymentType {
    EVENT_UPGRADE,
    PACKAGE_PURCHASE,
    EVENT_BOOKING,
    SUBSCRIPTION
}

sealed class PaymentMetadata {
    data class EventUpgradeMetadata(
        val eventId: String,
        val eventTitle: String,
        val upgradeType: EventUpgradeType,
        val previousStatus: String?
    ) : PaymentMetadata()

    data class PackagePurchaseMetadata(
        val packageId: String,
        val packageName: String,
        val eventLimit: Int,
        val validityDays: Int
    ) : PaymentMetadata()

    data class EventBookingMetadata(
        val eventId: String,
        val eventTitle: String,
        val quantity: Int,
        val ticketType: String
    ) : PaymentMetadata()

    data class SubscriptionMetadata(
        val plan: String,
        val interval: String,
        val features: List<String>
    ) : PaymentMetadata()
}

enum class EventUpgradeType {
    FEATURED,
    PREMIUM,
    VIP
}

data class PaymentIntent(
    val id: String,
    val clientSecret: String,
    val amount: Int,
    val currency: String,
    val status: String,
    val requiresAction: Boolean = false,
    val nextAction: Map<String, Any>? = null
)

data class PaymentMethod(
    val id: String,
    val type: String,
    val card: CardDetails? = null
)

data class CardDetails(
    val brand: String,
    val last4: String,
    val expMonth: Int,
    val expYear: Int
)

data class PaymentHistory(
    val payments: List<Payment>,
    val total: Int,
    val pages: Int,
    val currentPage: Int
)

data class RefundRequest(
    val paymentId: String,
    val amount: Int? = null,
    val reason: String = "requested_by_customer"
)

data class RefundResponse(
    val id: String,
    val amount: Int,
    val status: String,
    val reason: String,
    val created: String
) 