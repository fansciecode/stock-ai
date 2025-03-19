package com.example.ibcmserver_init.data.model.payment

import kotlinx.serialization.Serializable

@Serializable
data class PaymentRequest(
    val amount: Double,
    val currency: String = "USD",
    val description: String,
    val type: PaymentType,
    val eventId: String? = null,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
enum class PaymentType {
    EVENT_UPGRADE,
    TICKET_PURCHASE,
    PRODUCT_ORDER,
    SERVICE_BOOKING,
    SUBSCRIPTION
}

@Serializable
data class PaymentResponse(
    val success: Boolean,
    val paymentId: String,
    val clientSecret: String?,
    val amount: Double,
    val currency: String,
    val status: PaymentStatus,
    val type: PaymentType,
    val description: String,
    val requiresAction: Boolean = false,
    val nextAction: PaymentNextAction? = null
)

@Serializable
data class PaymentNextAction(
    val type: String,
    val url: String? = null
)

@Serializable
data class PaymentConfirmation(
    val paymentIntentId: String,
    val paymentMethodId: String
)

@Serializable
data class PaymentMethodDetails(
    val id: String,
    val type: PaymentMethodType,
    val last4: String? = null,
    val expiryMonth: Int? = null,
    val expiryYear: Int? = null,
    val brand: String? = null
)

@Serializable
enum class PaymentMethodType {
    CREDIT_CARD,
    DEBIT_CARD,
    BANK_TRANSFER,
    DIGITAL_WALLET
}

@Serializable
data class EventUpgradeRequest(
    val eventId: String,
    val upgradeType: UpgradeType,
    val paymentMethodId: String
)

@Serializable
enum class UpgradeType {
    FEATURED,
    PREMIUM,
    VIP
}

@Serializable
data class SubscriptionRequest(
    val subscriptionPlan: SubscriptionPlan,
    val paymentMethodId: String,
    val billingCycle: BillingCycle = BillingCycle.MONTHLY,
    val automaticPayment: Boolean = true
)

@Serializable
enum class SubscriptionPlan {
    BASIC,
    PREMIUM,
    BUSINESS
}

@Serializable
enum class BillingCycle {
    MONTHLY,
    YEARLY
}

@Serializable
data class RefundRequest(
    val paymentId: String,
    val amount: Double? = null,
    val reason: String,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
data class PaymentVerification(
    val paymentId: String,
    val status: PaymentStatus,
    val amount: Double,
    val currency: String,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
enum class PaymentStatus {
    PENDING,
    PROCESSING,
    SUCCEEDED,
    FAILED,
    REQUIRES_ACTION,
    CANCELLED,
    REFUNDED
} 