package com.example.ibcmserver_init.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface DeliveryDao {
    @Query("SELECT * FROM deliveries WHERE status IN (:activeStatuses)")
    suspend fun getActiveDeliveries(): List<Delivery>

    @Query("SELECT * FROM deliveries WHERE id = :deliveryId")
    suspend fun getDeliveryById(deliveryId: String): Delivery

    @Query("SELECT * FROM deliveries WHERE orderId = :orderId")
    suspend fun getDeliveriesByOrderId(orderId: String): List<Delivery>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDelivery(delivery: Delivery)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeliveries(deliveries: List<Delivery>)

    @Update
    suspend fun updateDelivery(delivery: Delivery)

    @Query("UPDATE deliveries SET status = :status WHERE id = :deliveryId")
    suspend fun updateDeliveryStatus(deliveryId: String, status: DeliveryStatus)

    @Query("UPDATE deliveries SET trackingNumber = :trackingNumber WHERE id = :deliveryId")
    suspend fun updateTrackingNumber(deliveryId: String, trackingNumber: String)

    @Query("UPDATE deliveries SET deliveryNotes = :notes WHERE id = :deliveryId")
    suspend fun updateDeliveryNotes(deliveryId: String, notes: String)

    @Query("SELECT status FROM deliveries WHERE id = :deliveryId")
    fun observeDeliveryStatus(deliveryId: String): Flow<DeliveryStatus>

    @Query("SELECT deliveryAddress FROM deliveries WHERE id = :deliveryId")
    fun observeDeliveryLocation(deliveryId: String): Flow<String>

    @Query("DELETE FROM deliveries WHERE id = :deliveryId")
    suspend fun deleteDelivery(deliveryId: String)

    @Query("DELETE FROM deliveries WHERE orderId = :orderId")
    suspend fun deleteDeliveriesByOrderId(orderId: String)

    @Query("DELETE FROM deliveries")
    suspend fun deleteAllDeliveries()
} 