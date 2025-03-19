package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.verification.VerificationDetails
import okhttp3.MultipartBody
import okhttp3.RequestBody
import retrofit2.Response
import retrofit2.http.*

interface VerificationApiService {
    @Multipart
    @POST("api/verification/submit")
    suspend fun submitVerification(
        @Part files: List<MultipartBody.Part>,
        @Part("metadata") metadata: RequestBody
    ): Response<VerificationDetails>

    @GET("api/verification/status/{id}")
    suspend fun getVerificationStatus(
        @Path("id") verificationId: String
    ): Response<VerificationDetails>
} 