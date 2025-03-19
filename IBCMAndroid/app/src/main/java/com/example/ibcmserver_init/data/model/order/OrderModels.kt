package com.example.ibcmserver_init.data.model.order

import kotlinx.serialization.Serializable
import java.util.Date

@Serializable
data class Order(
    val id: String,
    val type: OrderType,
    val status: OrderStatus,
    val customerId: String,
    val creatorId: String,
    val items: List<OrderItem>,
    val payment: PaymentDetails,
    val delivery: DeliveryDetails?,
    val createdAt: Long,
    val updatedAt: Long,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
enum class OrderType {
    EVENT_TICKET,
    PRODUCT,
    SERVICE,
    SUBSCRIPTION
}

@Serializable
enum class OrderStatus {
    PENDING,
    CONFIRMED,
    PROCESSING,
    READY_FOR_DELIVERY,
    IN_TRANSIT,
    DELIVERED,
    COMPLETED,
    CANCELLED,
    REFUNDED
}

@Serializable
data class OrderItem(
    val id: String,
    val type: OrderItemType,
    val name: String,
    val quantity: Int,
    val unitPrice: Double,
    val totalPrice: Double,
    val metadata: Map<String, String> = emptyMap()
)

@Serializable
enum class OrderItemType {
    TICKET,
    PHYSICAL_PRODUCT,
    DIGITAL_PRODUCT,
    SERVICE
}

@Serializable
data class PaymentDetails(
    val totalAmount: Double,
    val currency: String,
    val status: PaymentStatus,
    val creatorSettlement: SettlementDetails?,
    val platformFee: Double,
    val refundDetails: RefundDetails?
)

@Serializable
data class SettlementDetails(
    val creatorId: String,
    val amount: Double,
    val status: SettlementStatus,
    val scheduledDate: Long?,
    val completedDate: Long?,
    val paymentMethod: CreatorPaymentMethod
)

@Serializable
enum class SettlementStatus {
    PENDING,
    SCHEDULED,
    PROCESSING,
    COMPLETED,
    FAILED
}

@Serializable
data class CreatorPaymentMethod(
    val type: CreatorPaymentType,
    val accountDetails: Map<String, String>
)

@Serializable
enum class CreatorPaymentType {
    BANK_TRANSFER,
    PAYPAL,
    STRIPE_CONNECT
}

@Serializable
data class RefundDetails(
    val amount: Double,
    val reason: String,
    val status: RefundStatus,
    val requestedAt: Long,
    val processedAt: Long?
)

@Serializable
enum class RefundStatus {
    REQUESTED,
    PROCESSING,
    COMPLETED,
    FAILED
}

@Serializable
data class DeliveryDetails(
    val type: DeliveryType,
    val status: DeliveryStatus,
    val address: Address?,
    val trackingInfo: TrackingInfo?,
    val estimatedDeliveryDate: Long?,
    val actualDeliveryDate: Long?
)

@Serializable
enum class DeliveryType {
    PHYSICAL_SHIPPING,
    DIGITAL_DELIVERY,
    IN_PERSON_SERVICE,
    PICKUP
}

@Serializable
enum class DeliveryStatus {
    PENDING,
    PROCESSING,
    READY_FOR_PICKUP,
    IN_TRANSIT,
    DELIVERED,
    FAILED
}

@Serializable
data class Address(
    val street: String,
    val city: String,
    val state: String,
    val country: String,
    val postalCode: String,
    val additionalInfo: String?
)

@Serializable
data class TrackingInfo(
    val carrier: String,
    val trackingNumber: String,
    val trackingUrl: String?,
    val updates: List<DeliveryUpdate>
)

@Serializable
data class DeliveryUpdate(
    val status: String,
    val location: String?,
    val timestamp: Long,
    val description: String?
)

@Serializable
data class PaymentStatus(
    val status: String,
    val platformSettled: Boolean,
    val creatorSettled: Boolean
) 