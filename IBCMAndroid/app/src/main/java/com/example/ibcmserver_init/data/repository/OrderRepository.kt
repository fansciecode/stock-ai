package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.OrderApi
import com.example.ibcmserver_init.data.local.OrderDao
import com.example.ibcmserver_init.data.models.*
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class OrderRepository @Inject constructor(
    private val orderApi: OrderApi,
    private val orderDao: OrderDao
) {
    fun observeAllOrders(): Flow<List<Order>> {
        return orderDao.observeAllOrders()
    }

    fun observeBusinessOrders(businessId: String): Flow<List<Order>> {
        return orderDao.observeBusinessOrders(businessId)
    }

    fun observeCustomerOrders(customerId: String): Flow<List<Order>> {
        return orderDao.observeCustomerOrders(customerId)
    }

    suspend fun refreshOrders(businessId: String) {
        try {
            val orders = orderApi.getBusinessOrders(businessId)
            orderDao.insertOrders(orders)
        } catch (e: Exception) {
            // Handle error or use cached data
        }
    }

    suspend fun getOrderById(orderId: String): Order? {
        return try {
            val order = orderApi.getOrderById(orderId)
            orderDao.insertOrder(order)
            order
        } catch (e: Exception) {
            orderDao.getOrderById(orderId)
        }
    }

    suspend fun createOrder(order: Order): Order {
        val createdOrder = orderApi.createOrder(order)
        orderDao.insertOrder(createdOrder)
        return createdOrder
    }

    suspend fun updateOrder(orderId: String, order: Order): Order {
        val updatedOrder = orderApi.updateOrder(orderId, order)
        orderDao.updateOrder(updatedOrder)
        return updatedOrder
    }

    suspend fun deleteOrder(orderId: String) {
        try {
            orderApi.deleteOrder(orderId)
            orderDao.getOrderById(orderId)?.let { orderDao.deleteOrder(it) }
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun filterOrders(filter: OrderFilter): List<Order> {
        return try {
            val orders = orderApi.filterOrders(
                status = filter.status,
                type = filter.type,
                startDate = filter.startDate?.toString(),
                endDate = filter.endDate?.toString(),
                minAmount = filter.minAmount,
                maxAmount = filter.maxAmount
            )
            orderDao.insertOrders(orders)
            orders
        } catch (e: Exception) {
            // Return cached data based on filter
            when {
                filter.status != null -> orderDao.getOrdersByStatus(filter.status)
                filter.type != null -> orderDao.getOrdersByType(filter.type)
                filter.startDate != null && filter.endDate != null -> 
                    orderDao.getOrdersByDateRange(
                        filter.startDate.toString(),
                        filter.endDate.toString()
                    )
                else -> emptyList()
            }
        }
    }

    suspend fun getOrderSummary(businessId: String): OrderSummary {
        return try {
            orderApi.getOrderSummary(businessId)
        } catch (e: Exception) {
            orderDao.getOrderSummary(businessId)
        }
    }

    fun observeDeliveryTracking(orderId: String): Flow<DeliveryTracking?> {
        return orderDao.observeDeliveryTracking(orderId)
    }

    suspend fun updateDeliveryTracking(orderId: String, tracking: DeliveryTracking) {
        try {
            val updatedTracking = orderApi.updateDeliveryTracking(orderId, tracking)
            orderDao.insertDeliveryTracking(updatedTracking)
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun updateOrderStatus(orderId: String, status: OrderStatus) {
        try {
            val updatedOrder = orderApi.updateOrderStatus(orderId, status)
            orderDao.updateOrder(updatedOrder)
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun updatePaymentStatus(orderId: String, status: PaymentStatus) {
        try {
            val updatedOrder = orderApi.updatePaymentStatus(orderId, status)
            orderDao.updateOrder(updatedOrder)
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun updateDeliveryStatus(orderId: String, status: DeliveryStatus) {
        try {
            val updatedOrder = orderApi.updateDeliveryStatus(orderId, status)
            orderDao.updateOrder(updatedOrder)
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun updateBatchOrderStatus(orderIds: List<String>, status: OrderStatus) {
        try {
            val updatedOrders = orderApi.updateOrdersStatus(orderIds, status)
            orderDao.insertOrders(updatedOrders)
        } catch (e: Exception) {
            // Handle error
        }
    }

    suspend fun updateBatchDeliveryStatus(orderIds: List<String>, status: DeliveryStatus) {
        try {
            val updatedOrders = orderApi.updateOrdersDeliveryStatus(orderIds, status)
            orderDao.insertOrders(updatedOrders)
        } catch (e: Exception) {
            // Handle error
        }
    }
} 
} 