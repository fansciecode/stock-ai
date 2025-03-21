package com.example.ibcmserver_init.data.model.review

data class ReviewSettings(
    val notifyNewReviews: Boolean = true,
    val notifyReviewResponses: Boolean = true,
    val notifyReviewReports: Boolean = true,
    val autoApproveReviews: Boolean = false,
    val requirePurchase: Boolean = true,
    val enableProfanityFilter: Boolean = true,
    val enableSpamDetection: Boolean = true
) 