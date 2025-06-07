package com.example.ibcmserver_init.data.api

import retrofit2.http.*

interface OrderApi {
    @GET("orders")
    suspend fun getAllOrders(): List<Order>

    @GET("orders/business/{businessId}")
    suspend fun getBusinessOrders(@Path("businessId") businessId: String): List<Order>

    @GET("orders/customer/{customerId}")
    suspend fun getCustomerOrders(@Path("customerId") customerId: String): List<Order>

    @GET("orders/{orderId}")
    suspend fun getOrderById(@Path("orderId") orderId: String): Order

    @POST("orders")
    suspend fun createOrder(@Body order: Order): Order

    @PUT("orders/{orderId}")
    suspend fun updateOrder(
        @Path("orderId") orderId: String,
        @Body order: Order
    ): Order

    @DELETE("orders/{orderId}")
    suspend fun deleteOrder(@Path("orderId") orderId: String)

    @GET("orders/filter")
    suspend fun filterOrders(
        @Query("status") status: OrderStatus?,
        @Query("type") type: OrderType?,
        @Query("startDate") startDate: String?,
        @Query("endDate") endDate: String?,
        @Query("minAmount") minAmount: Double?,
        @Query("maxAmount") maxAmount: Double?
    ): List<Order>

    @GET("orders/summary/{businessId}")
    suspend fun getOrderSummary(@Path("businessId") businessId: String): OrderSummary

    // Delivery Tracking
    @GET("orders/{orderId}/tracking")
    suspend fun getDeliveryTracking(@Path("orderId") orderId: String): DeliveryTracking

    @POST("orders/{orderId}/tracking")
    suspend fun createDeliveryTracking(
        @Path("orderId") orderId: String,
        @Body tracking: DeliveryTracking
    ): DeliveryTracking

    @PUT("orders/{orderId}/tracking")
    suspend fun updateDeliveryTracking(
        @Path("orderId") orderId: String,
        @Body tracking: DeliveryTracking
    ): DeliveryTracking

    // Order Status Updates
    @POST("orders/{orderId}/status")
    suspend fun updateOrderStatus(
        @Path("orderId") orderId: String,
        @Query("status") status: OrderStatus
    ): Order

    @POST("orders/{orderId}/payment-status")
    suspend fun updatePaymentStatus(
        @Path("orderId") orderId: String,
        @Query("status") status: PaymentStatus
    ): Order

    @POST("orders/{orderId}/delivery-status")
    suspend fun updateDeliveryStatus(
        @Path("orderId") orderId: String,
        @Query("status") status: DeliveryStatus
    ): Order

    // Batch Operations
    @POST("orders/batch/status")
    suspend fun updateOrdersStatus(
        @Body orderIds: List<String>,
        @Query("status") status: OrderStatus
    ): List<Order>

    @POST("orders/batch/delivery-status")
    suspend fun updateOrdersDeliveryStatus(
        @Body orderIds: List<String>,
        @Query("status") status: DeliveryStatus
    ): List<Order>
} 