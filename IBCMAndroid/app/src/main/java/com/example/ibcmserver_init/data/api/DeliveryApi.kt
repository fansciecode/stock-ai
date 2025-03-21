package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.models.*
import retrofit2.http.*

interface DeliveryApi {
    @GET("deliveries/active")
    suspend fun getActiveDeliveries(): List<Delivery>

    @GET("deliveries/{deliveryId}")
    suspend fun getDeliveryDetails(@Path("deliveryId") deliveryId: String): Delivery

    @POST("deliveries")
    suspend fun createDelivery(@Body delivery: Delivery): Delivery

    @PUT("deliveries/{deliveryId}/status")
    suspend fun updateDeliveryStatus(
        @Path("deliveryId") deliveryId: String,
        @Body status: DeliveryStatus
    )

    @PUT("deliveries/{deliveryId}/tracking")
    suspend fun updateTrackingNumber(
        @Path("deliveryId") deliveryId: String,
        @Body trackingNumber: String
    )

    @PUT("deliveries/{deliveryId}/notes")
    suspend fun updateDeliveryNotes(
        @Path("deliveryId") deliveryId: String,
        @Body notes: String
    )

    @PUT("deliveries/{deliveryId}/cancel")
    suspend fun cancelDelivery(@Path("deliveryId") deliveryId: String)

    @GET("deliveries/order/{orderId}")
    suspend fun getDeliveriesByOrderId(@Path("orderId") orderId: String): List<Delivery>

    @GET("deliveries/search")
    suspend fun searchDeliveries(
        @Query("query") query: String,
        @Query("status") status: DeliveryStatus? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): List<Delivery>

    @GET("deliveries/filter")
    suspend fun filterDeliveries(
        @Query("status") status: DeliveryStatus? = null,
        @Query("orderId") orderId: String? = null,
        @Query("startDate") startDate: String? = null,
        @Query("endDate") endDate: String? = null
    ): List<Delivery>

    @GET("deliveries/{deliveryId}/location")
    suspend fun getDeliveryLocation(@Path("deliveryId") deliveryId: String): String

    @GET("deliveries/{deliveryId}/route")
    suspend fun getDeliveryRoute(@Path("deliveryId") deliveryId: String): List<String>
} 