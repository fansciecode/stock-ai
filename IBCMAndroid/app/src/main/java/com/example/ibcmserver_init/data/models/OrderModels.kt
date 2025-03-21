package com.example.ibcmserver_init.data.models

import android.graphics.Bitmap
import androidx.room.Entity
import androidx.room.PrimaryKey
import androidx.room.TypeConverters
import com.example.ibcmserver_init.data.local.Converters
import java.util.Date

@Entity(tableName = "orders")
@TypeConverters(Converters::class)
data class Order(
    @PrimaryKey
    val id: String,
    val customerId: String,
    val customerPhone: String,
    val businessId: String,
    val eventId: String?,
    val status: OrderStatus,
    val type: OrderType,
    val items: List<OrderItem>,
    val totalAmount: Double,
    val paymentStatus: PaymentStatus,
    val deliveryAddress: DeliveryAddress?,
    val deliveryStatus: DeliveryStatus?,
    val createdAt: String,
    val updatedAt: String,
    val metadata: Map<String, String>?
)

data class OrderItem(
    val id: String,
    val productId: String,
    val name: String,
    val quantity: Int,
    val unitPrice: Double,
    val totalPrice: Double,
    val options: Map<String, String>?
)

data class DeliveryAddress(
    val addressLine1: String,
    val addressLine2: String?,
    val city: String,
    val state: String,
    val country: String,
    val postalCode: String,
    val contactName: String,
    val contactPhone: String
)

@Entity(tableName = "delivery_tracking")
data class DeliveryTracking(
    @PrimaryKey
    val id: String,
    val orderId: String,
    val customerPhone: String,
    val status: DeliveryStatus,
    val trackingNumber: String?,
    val carrier: String?,
    val estimatedDeliveryDate: String?,
    val actualDeliveryDate: String?,
    val currentLocation: String?,
    val updates: List<DeliveryUpdate>
)

data class DeliveryUpdate(
    val timestamp: String,
    val status: DeliveryStatus,
    val location: String?,
    val description: String
)

data class OrderSummary(
    val totalOrders: Int,
    val pendingOrders: Int,
    val completedOrders: Int,
    val cancelledOrders: Int,
    val totalRevenue: Double,
    val averageOrderValue: Double
)

enum class OrderStatus {
    PENDING,
    CONFIRMED,
    PREPARING,
    READY,
    IN_TRANSIT,
    DELIVERED,
    CANCELLED,
    REFUNDED
}

enum class OrderType {
    PHYSICAL_PRODUCT,
    DIGITAL_PRODUCT,
    EVENT_TICKET,
    SERVICE,
    SUBSCRIPTION
}

enum class PaymentStatus {
    PENDING,
    PAID,
    FAILED,
    REFUNDED,
    PARTIALLY_REFUNDED
}

enum class DeliveryStatus {
    PENDING,
    PROCESSING,
    PICKED_UP,
    IN_TRANSIT,
    OUT_FOR_DELIVERY,
    DELIVERED,
    FAILED,
    RETURNED
}

data class OrderFilter(
    val status: OrderStatus? = null,
    val type: OrderType? = null,
    val startDate: Date? = null,
    val endDate: Date? = null,
    val minAmount: Double? = null,
    val maxAmount: Double? = null
)

enum class BookingStatus {
    CONFIRMED,
    CHECKED_IN,
    CANCELLED
}

data class DigitalBooking(
    val id: String,
    val eventId: String,
    val eventName: String,
    val customerId: String,
    val customerName: String,
    val customerPhone: String,
    val seats: List<String>,
    val bookingDate: String,
    val status: BookingStatus,
    val qrCode: Bitmap?,
    val metadata: Map<String, String>?
)

data class OrderManagementUiState(
    val isLoading: Boolean = false,
    val error: String? = null,
    val orders: Map<OrderStatus, List<Order>> = emptyMap(),
    val orderSummary: OrderSummary? = null,
    val currentFilter: OrderFilter? = null,
    val selectedOrder: Order? = null,
    val selectedDelivery: Delivery? = null,
    val digitalBookings: List<DigitalBooking> = emptyList(),
    val selectedDigitalBooking: DigitalBooking? = null
) 