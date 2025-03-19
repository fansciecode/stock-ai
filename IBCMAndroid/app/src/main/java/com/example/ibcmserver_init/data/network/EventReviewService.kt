package com.example.ibcmserver_init.data.network

import com.example.ibcmserver_init.data.model.review.EventReview
import com.example.ibcmserver_init.data.model.review.ReviewStats
import retrofit2.http.*

interface EventReviewService {
    @GET("events/{eventId}/reviews")
    suspend fun getEventReviews(@Path("eventId") eventId: String): List<EventReview>

    @GET("events/{eventId}/reviews/analytics")
    suspend fun getReviewAnalytics(@Path("eventId") eventId: String): ReviewStats

    @POST("events/{eventId}/reviews")
    suspend fun createEventReview(
        @Path("eventId") eventId: String,
        @Body review: CreateReviewRequest
    ): EventReview

    @POST("events/{eventId}/reviews/{reviewId}/helpful")
    suspend fun markReviewHelpful(
        @Path("eventId") eventId: String,
        @Path("reviewId") reviewId: String
    )

    @POST("events/{eventId}/reviews/{reviewId}/report")
    suspend fun reportReview(
        @Path("eventId") eventId: String,
        @Path("reviewId") reviewId: String,
        @Body report: ReportReviewRequest
    )

    @POST("events/{eventId}/reviews/{reviewId}/respond")
    suspend fun respondToReview(
        @Path("eventId") eventId: String,
        @Path("reviewId") reviewId: String,
        @Body response: RespondToReviewRequest
    )
}

data class CreateReviewRequest(
    val rating: Int,
    val comment: String
)

data class ReportReviewRequest(
    val reason: String
)

data class RespondToReviewRequest(
    val comment: String
) 