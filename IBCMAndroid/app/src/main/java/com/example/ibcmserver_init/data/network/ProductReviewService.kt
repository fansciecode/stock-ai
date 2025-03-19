package com.example.ibcmserver_init.data.network

import com.example.ibcmserver_init.data.model.review.ProductReview
import com.example.ibcmserver_init.data.model.review.ReviewStats
import retrofit2.http.*

interface ProductReviewService {
    @GET("products/{productId}/reviews")
    suspend fun getProductReviews(@Path("productId") productId: String): List<ProductReview>

    @GET("products/{productId}/reviews/analytics")
    suspend fun getReviewAnalytics(@Path("productId") productId: String): ReviewStats

    @POST("products/{productId}/reviews")
    suspend fun createProductReview(
        @Path("productId") productId: String,
        @Body review: CreateProductReviewRequest
    ): ProductReview

    @POST("products/{productId}/reviews/{reviewId}/helpful")
    suspend fun markReviewHelpful(
        @Path("productId") productId: String,
        @Path("reviewId") reviewId: String
    )

    @POST("products/{productId}/reviews/{reviewId}/report")
    suspend fun reportReview(
        @Path("productId") productId: String,
        @Path("reviewId") reviewId: String,
        @Body report: ReportReviewRequest
    )

    @POST("products/{productId}/reviews/{reviewId}/respond")
    suspend fun respondToReview(
        @Path("productId") productId: String,
        @Path("reviewId") reviewId: String,
        @Body response: RespondToReviewRequest
    )
}

data class CreateProductReviewRequest(
    val rating: Int,
    val title: String,
    val comment: String,
    val media: List<String>
)

data class ReportReviewRequest(
    val reason: String
)

data class RespondToReviewRequest(
    val comment: String
) 