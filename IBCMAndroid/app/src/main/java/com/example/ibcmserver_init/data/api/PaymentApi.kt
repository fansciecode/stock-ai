package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.payment.*
import retrofit2.http.*

interface PaymentApi {
    @POST("payments/upgrade/{eventId}")
    suspend fun upgradeEvent(
        @Path("eventId") eventId: String,
        @Body request: Map<String, Any>
    ): PaymentIntent

    @POST("payments/package/purchase")
    suspend fun purchasePackage(
        @Body request: Map<String, Any>
    ): PaymentIntent

    @POST("payments/booking")
    suspend fun bookEvent(
        @Body request: Map<String, Any>
    ): PaymentIntent

    @POST("payments/confirm")
    suspend fun confirmPayment(
        @Body request: Map<String, Any>
    ): PaymentIntent

    @POST("payments/refund")
    suspend fun refundPayment(
        @Body request: RefundRequest
    ): RefundResponse

    @GET("payments/history")
    suspend fun getPaymentHistory(
        @Query("page") page: Int = 1,
        @Query("limit") limit: Int = 10
    ): PaymentHistory

    @GET("payments/status/{paymentId}")
    suspend fun getPaymentStatus(
        @Path("paymentId") paymentId: String
    ): Payment

    @POST("payments/create-payment-intent")
    suspend fun createPaymentIntent(
        @Body request: Map<String, Any>
    ): PaymentIntent

    @POST("payments/validate/{paymentId}")
    suspend fun validatePayment(
        @Path("paymentId") paymentId: String
    ): Map<String, Any>
}