package com.example.ibcmserver_init.data.model.package

data class EventPackage(
    val id: String,
    val name: String,
    val description: String,
    val price: Int,
    val eventLimit: Int,
    val validityDays: Int,
    val features: List<String>
)

data class UserEventLimit(
    val totalEvents: Int,
    val usedEvents: Int,
    val remainingEvents: Int,
    val hasActivePackage: Boolean,
    val packageExpiryDate: String?
) 