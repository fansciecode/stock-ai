package com.example.ibcmserver_init.data.model.review

import java.text.SimpleDateFormat
import java.util.*

data class ProductReview(
    val id: String,
    val productId: String,
    val userId: String,
    val userName: String,
    val userAvatar: String?,
    val rating: Int,
    val title: String,
    val comment: String,
    val media: List<String>,
    val createdAt: Date,
    val updatedAt: Date,
    val helpfulCount: Int,
    val reportedCount: Int,
    val response: ReviewResponse?,
    val status: ReviewStatus
) {
    val formattedDate: String
        get() = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(createdAt)
}

data class ReviewResponse(
    val comment: String,
    val createdAt: Date,
    val updatedAt: Date
)

enum class ReviewStatus {
    PENDING,
    APPROVED,
    REJECTED,
    HIDDEN
}

data class ReviewStats(
    val averageRating: Double,
    val totalReviews: Int,
    val ratingDistribution: Map<Int, Int> // Rating -> Count
) 