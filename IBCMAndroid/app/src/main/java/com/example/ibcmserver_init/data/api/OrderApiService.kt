package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.order.*
import retrofit2.Response
import retrofit2.http.*

interface OrderApiService {
    @POST("orders")
    suspend fun createOrder(@Body order: Order): Response<Order>

    @GET("orders/{orderId}")
    suspend fun getOrder(@Path("orderId") orderId: String): Response<Order>

    @GET("orders/user/{userId}")
    suspend fun getUserOrders(
        @Path("userId") userId: String,
        @Query("status") status: OrderStatus? = null,
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 20
    ): Response<List<OrderSummary>>

    @PUT("orders/{orderId}/status")
    suspend fun updateOrderStatus(
        @Path("orderId") orderId: String,
        @Body status: OrderStatus
    ): Response<Order>

    @POST("orders/{orderId}/payment")
    suspend fun processPayment(
        @Path("orderId") orderId: String,
        @Body paymentInfo: PaymentInfo
    ): Response<PaymentInfo>

    @GET("orders/{orderId}/payment")
    suspend fun getPaymentStatus(
        @Path("orderId") orderId: String
    ): Response<PaymentInfo>

    @POST("orders/{orderId}/refund")
    suspend fun requestRefund(
        @Path("orderId") orderId: String,
        @Body refundRequest: RefundRequest
    ): Response<Order>

    @GET("orders/summary")
    suspend fun getOrdersSummary(
        @Query("startDate") startDate: String,
        @Query("endDate") endDate: String
    ): Response<List<OrderSummary>>

    @DELETE("orders/{orderId}")
    suspend fun cancelOrder(
        @Path("orderId") orderId: String
    ): Response<Order>

    @PUT("orders/{orderId}/delivery")
    suspend fun updateDeliveryDetails(
        @Path("orderId") orderId: String,
        @Body details: DeliveryDetails
    ): Response<Order>

    @POST("orders/{orderId}/settlement")
    suspend fun processCreatorSettlement(
        @Path("orderId") orderId: String
    ): Response<SettlementDetails>

    @GET("creators/{creatorId}/settlements")
    suspend fun getCreatorSettlements(
        @Path("creatorId") creatorId: String
    ): Response<List<SettlementDetails>>

    @POST("orders/{orderId}/refund")
    suspend fun requestRefund(
        @Path("orderId") orderId: String,
        @Body request: RefundDetails
    ): Response<Order>

    @PUT("orders/{orderId}/tracking")
    suspend fun updateTrackingInfo(
        @Path("orderId") orderId: String,
        @Body trackingInfo: TrackingInfo
    ): Response<Order>

    @GET("customers/{customerId}/orders")
    suspend fun getCustomerOrders(
        @Path("customerId") customerId: String
    ): Response<List<Order>>

    @GET("creators/{creatorId}/orders")
    suspend fun getCreatorOrders(
        @Path("creatorId") creatorId: String
    ): Response<List<Order>>

    @GET("orders/{orderId}/tracking")
    suspend fun getTrackingInfo(
        @Path("orderId") orderId: String
    ): Response<TrackingInfo>

    @POST("orders/{orderId}/delivery/validate")
    suspend fun validateDeliveryAddress(
        @Path("orderId") orderId: String,
        @Body address: Address
    ): Response<Map<String, Boolean>>

    @GET("orders/statistics")
    suspend fun getOrderStatistics(
        @Query("creatorId") creatorId: String? = null,
        @Query("startDate") startDate: Long? = null,
        @Query("endDate") endDate: Long? = null
    ): Response<Map<String, Any>>

    @POST("orders/{orderId}/notify")
    suspend fun sendOrderNotification(
        @Path("orderId") orderId: String,
        @Body notification: Map<String, String>
    ): Response<Map<String, Boolean>>
} 