package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.payment.*
import retrofit2.Response
import retrofit2.http.*

interface PaymentApiService {
    @POST("payments/create")
    suspend fun initiatePayment(@Body request: PaymentRequest): Response<PaymentResponse>

    @POST("payments/confirm")
    suspend fun confirmPayment(@Body confirmation: PaymentConfirmation): Response<PaymentResponse>

    @POST("payments/upgrade/{eventId}")
    suspend fun upgradeEvent(
        @Path("eventId") eventId: String,
        @Body request: EventUpgradeRequest
    ): Response<PaymentResponse>

    @POST("payments/subscription/create")
    suspend fun createSubscription(@Body request: SubscriptionRequest): Response<PaymentResponse>

    @POST("payments/subscription/cancel")
    suspend fun cancelSubscription(): Response<Map<String, Any>>

    @POST("payments/refund")
    suspend fun requestRefund(@Body request: RefundRequest): Response<PaymentResponse>

    @GET("payments/status/{paymentId}")
    suspend fun getPaymentStatus(@Path("paymentId") paymentId: String): Response<PaymentVerification>

    @POST("payments/verify")
    suspend fun verifyPayment(@Body paymentId: String): Response<PaymentVerification>

    @GET("payments/history")
    suspend fun getPaymentHistory(): Response<List<PaymentResponse>>

    @POST("payments/process")
    suspend fun processPayment(
        @Body request: Map<String, Any>
    ): Response<PaymentResponse>

    @POST("payments/create-payment-intent")
    suspend fun createPaymentIntent(
        @Body request: Map<String, Any>
    ): Response<Map<String, String>>
} 