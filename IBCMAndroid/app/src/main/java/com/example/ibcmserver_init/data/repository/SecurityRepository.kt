package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject

class SecurityRepository @Inject constructor(
    private val securityApi: SecurityApi
) {
    suspend fun reportEvent(
        eventId: String,
        reportType: ReportType,
        description: String,
        evidence: List<String>? = null,
        reporterId: String
    ): Flow<Result<EventReportResponse>> = flow {
        try {
            val request = EventReportRequest(
                eventId = eventId,
                reportType = reportType,
                description = description,
                evidence = evidence,
                reporterId = reporterId
            )
            val response = securityApi.reportEvent(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to submit report: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun verifyEvent(
        eventId: String,
        eventDetails: EventVerificationDetails,
        organizerDetails: OrganizerVerificationDetails
    ): Flow<Result<EventVerificationResponse>> = flow {
        try {
            val request = EventVerificationRequest(
                eventId = eventId,
                eventDetails = eventDetails,
                organizerDetails = organizerDetails
            )
            val response = securityApi.verifyEvent(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to verify event: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun checkSpam(
        content: String,
        contentType: ContentType,
        metadata: Map<String, String>? = null
    ): Flow<Result<SpamCheckResponse>> = flow {
        try {
            val request = SpamCheckRequest(
                content = content,
                contentType = contentType,
                metadata = metadata
            )
            val response = securityApi.checkSpam(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to check spam: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }

    suspend fun detectFraud(
        eventId: String,
        transactionDetails: TransactionDetails? = null,
        organizerHistory: OrganizerHistory? = null,
        riskFactors: List<String>? = null
    ): Flow<Result<FraudDetectionResponse>> = flow {
        try {
            val request = FraudDetectionRequest(
                eventId = eventId,
                transactionDetails = transactionDetails,
                organizerHistory = organizerHistory,
                riskFactors = riskFactors
            )
            val response = securityApi.detectFraud(request)
            if (response.isSuccessful) {
                response.body()?.let { emit(Result.success(it)) }
            } else {
                emit(Result.failure(Exception("Failed to detect fraud: ${response.message()}")))
            }
        } catch (e: Exception) {
            emit(Result.failure(e))
        }
    }
} 