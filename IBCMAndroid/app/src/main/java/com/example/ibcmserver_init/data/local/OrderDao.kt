package com.example.ibcmserver_init.data.local

import androidx.room.*
import kotlinx.coroutines.flow.Flow

@Dao
interface OrderDao {
    @Query("SELECT * FROM orders ORDER BY createdAt DESC")
    fun observeAllOrders(): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE businessId = :businessId ORDER BY createdAt DESC")
    fun observeBusinessOrders(businessId: String): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE customerId = :customerId ORDER BY createdAt DESC")
    fun observeCustomerOrders(customerId: String): Flow<List<Order>>

    @Query("SELECT * FROM orders WHERE id = :orderId")
    suspend fun getOrderById(orderId: String): Order?

    @Query("SELECT * FROM orders WHERE status = :status ORDER BY createdAt DESC")
    suspend fun getOrdersByStatus(status: OrderStatus): List<Order>

    @Query("SELECT * FROM orders WHERE type = :type ORDER BY createdAt DESC")
    suspend fun getOrdersByType(type: OrderType): List<Order>

    @Query("SELECT * FROM orders WHERE createdAt BETWEEN :startDate AND :endDate ORDER BY createdAt DESC")
    suspend fun getOrdersByDateRange(startDate: String, endDate: String): List<Order>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrder(order: Order)

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertOrders(orders: List<Order>)

    @Update
    suspend fun updateOrder(order: Order)

    @Delete
    suspend fun deleteOrder(order: Order)

    @Query("DELETE FROM orders")
    suspend fun deleteAllOrders()

    // Delivery Tracking
    @Query("SELECT * FROM delivery_tracking WHERE orderId = :orderId")
    fun observeDeliveryTracking(orderId: String): Flow<DeliveryTracking?>

    @Insert(onConflict = OnConflictStrategy.REPLACE)
    suspend fun insertDeliveryTracking(deliveryTracking: DeliveryTracking)

    @Update
    suspend fun updateDeliveryTracking(deliveryTracking: DeliveryTracking)

    @Query("DELETE FROM delivery_tracking WHERE orderId = :orderId")
    suspend fun deleteDeliveryTracking(orderId: String)

    // Order Statistics
    @Query("""
        SELECT 
            COUNT(*) as totalOrders,
            SUM(CASE WHEN status = 'PENDING' THEN 1 ELSE 0 END) as pendingOrders,
            SUM(CASE WHEN status = 'DELIVERED' THEN 1 ELSE 0 END) as completedOrders,
            SUM(CASE WHEN status = 'CANCELLED' THEN 1 ELSE 0 END) as cancelledOrders,
            SUM(totalAmount) as totalRevenue,
            AVG(totalAmount) as averageOrderValue
        FROM orders
        WHERE businessId = :businessId
    """)
    suspend fun getOrderSummary(businessId: String): OrderSummary

    @Transaction
    suspend fun updateOrderWithDeliveryTracking(order: Order, deliveryTracking: DeliveryTracking) {
        updateOrder(order)
        insertDeliveryTracking(deliveryTracking)
    }
} 