package com.example.ibcmserver_init.data.model.review

import java.time.Instant
import java.time.format.DateTimeFormatter
import java.util.*

data class EventReview(
    val id: String,
    val eventId: String,
    val userId: String,
    val userName: String,
    val userAvatar: String?,
    val rating: Int,
    val comment: String,
    val createdAt: String = Instant.now().toString(),
    val updatedAt: String? = null,
    val helpfulCount: Int = 0,
    val reportedCount: Int = 0,
    val response: ReviewResponse? = null,
    val status: ReviewStatus = ReviewStatus.APPROVED
) {
    val formattedDate: String
        get() = try {
            val instant = Instant.parse(createdAt)
            val date = Date.from(instant)
            DateTimeFormatter.ofPattern("MMM dd, yyyy")
                .withLocale(Locale.getDefault())
                .format(date.toInstant())
        } catch (e: Exception) {
            createdAt
        }
}

data class ReviewResponse(
    val comment: String,
    val respondedBy: String,
    val respondedAt: String
)

enum class ReviewStatus {
    PENDING,
    APPROVED,
    REJECTED,
    HIDDEN
} 