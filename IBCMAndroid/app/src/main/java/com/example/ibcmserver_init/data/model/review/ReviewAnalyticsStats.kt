package com.example.ibcmserver_init.data.model.review

data class ReviewAnalyticsStats(
    val averageRating: Double,
    val totalReviews: Int,
    val ratingDistribution: Map<Int, Int>, // Rating -> Count
    val statusCounts: Map<ReviewStatus, Int>,
    val recentReviews: List<ProductReview>,
    val topReviewers: List<TopReviewer>,
    val reviewTrends: ReviewTrends
)

data class TopReviewer(
    val userId: String,
    val userName: String,
    val userAvatar: String?,
    val reviewCount: Int,
    val averageRating: Double
)

data class ReviewTrends(
    val weeklyAverage: List<WeeklyAverage>,
    val monthlyAverage: List<MonthlyAverage>,
    val yearlyAverage: List<YearlyAverage>
)

data class WeeklyAverage(
    val weekStart: Long,
    val averageRating: Double,
    val reviewCount: Int
)

data class MonthlyAverage(
    val monthStart: Long,
    val averageRating: Double,
    val reviewCount: Int
)

data class YearlyAverage(
    val yearStart: Long,
    val averageRating: Double,
    val reviewCount: Int
) 