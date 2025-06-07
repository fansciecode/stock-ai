package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.DeliveryApi
import com.example.ibcmserver_init.data.local.DeliveryDao
import kotlinx.coroutines.flow.Flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class DeliveryRepository @Inject constructor(
    private val deliveryApi: DeliveryApi,
    private val deliveryDao: DeliveryDao
) {
    suspend fun getActiveDeliveries(): List<Delivery> {
        return try {
            val deliveries = deliveryApi.getActiveDeliveries()
            deliveryDao.insertDeliveries(deliveries)
            deliveries
        } catch (e: Exception) {
            deliveryDao.getActiveDeliveries()
        }
    }

    suspend fun getDeliveryDetails(deliveryId: String): Delivery {
        return try {
            val delivery = deliveryApi.getDeliveryDetails(deliveryId)
            deliveryDao.insertDelivery(delivery)
            delivery
        } catch (e: Exception) {
            deliveryDao.getDeliveryById(deliveryId)
        }
    }

    suspend fun updateDeliveryStatus(deliveryId: String, status: DeliveryStatus) {
        try {
            deliveryApi.updateDeliveryStatus(deliveryId, status)
            deliveryDao.updateDeliveryStatus(deliveryId, status)
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun createDelivery(delivery: Delivery): Delivery {
        return try {
            val createdDelivery = deliveryApi.createDelivery(delivery)
            deliveryDao.insertDelivery(createdDelivery)
            createdDelivery
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun updateTrackingNumber(deliveryId: String, trackingNumber: String) {
        try {
            deliveryApi.updateTrackingNumber(deliveryId, trackingNumber)
            deliveryDao.updateTrackingNumber(deliveryId, trackingNumber)
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun updateDeliveryNotes(deliveryId: String, notes: String) {
        try {
            deliveryApi.updateDeliveryNotes(deliveryId, notes)
            deliveryDao.updateDeliveryNotes(deliveryId, notes)
        } catch (e: Exception) {
            throw e
        }
    }

    fun observeDeliveryStatus(deliveryId: String): Flow<DeliveryStatus> {
        return deliveryDao.observeDeliveryStatus(deliveryId)
    }

    fun observeDeliveryLocation(deliveryId: String): Flow<String> {
        return deliveryDao.observeDeliveryLocation(deliveryId)
    }

    suspend fun getDeliveriesByOrderId(orderId: String): List<Delivery> {
        return try {
            val deliveries = deliveryApi.getDeliveriesByOrderId(orderId)
            deliveryDao.insertDeliveries(deliveries)
            deliveries
        } catch (e: Exception) {
            deliveryDao.getDeliveriesByOrderId(orderId)
        }
    }

    suspend fun cancelDelivery(deliveryId: String) {
        try {
            deliveryApi.cancelDelivery(deliveryId)
            deliveryDao.updateDeliveryStatus(deliveryId, DeliveryStatus.FAILED)
        } catch (e: Exception) {
            throw e
        }
    }
} 