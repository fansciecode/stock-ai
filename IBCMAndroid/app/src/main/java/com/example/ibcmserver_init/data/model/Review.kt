package com.example.ibcmserver_init.data.model

import kotlinx.serialization.Serializable

@Serializable
data class Review(
    val id: String = "",
    val userId: String = "",
    val userName: String = "",
    val rating: Int = 0,
    val comment: String = "",
    val createdAt: Long = System.currentTimeMillis()
) {
    fun toMap(): Map<String, Any?> = mapOf(
        "id" to id,
        "userId" to userId,
        "userName" to userName,
        "rating" to rating,
        "comment" to comment,
        "createdAt" to createdAt
    )
} 