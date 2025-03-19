package com.example.ibcmserver_init.data.api

import retrofit2.Response
import retrofit2.http.*

interface SecurityApi {
    @POST("api/security/report-event")
    suspend fun reportEvent(@Body request: EventReportRequest): Response<EventReportResponse>

    @POST("api/security/verify-event")
    suspend fun verifyEvent(@Body request: EventVerificationRequest): Response<EventVerificationResponse>

    @POST("api/security/check-spam")
    suspend fun checkSpam(@Body request: SpamCheckRequest): Response<SpamCheckResponse>

    @POST("api/security/detect-fraud")
    suspend fun detectFraud(@Body request: FraudDetectionRequest): Response<FraudDetectionResponse>
}

data class EventReportRequest(
    val eventId: String,
    val reportType: ReportType,
    val description: String,
    val evidence: List<String>? = null,
    val reporterId: String
)

data class EventReportResponse(
    val reportId: String,
    val status: ReportStatus,
    val message: String,
    val actionTaken: String?
)

data class EventVerificationRequest(
    val eventId: String,
    val eventDetails: EventVerificationDetails,
    val organizerDetails: OrganizerVerificationDetails
)

data class EventVerificationResponse(
    val isVerified: Boolean,
    val verificationScore: Double,
    val warnings: List<SecurityWarning>?,
    val recommendations: List<String>?
)

data class SpamCheckRequest(
    val content: String,
    val contentType: ContentType,
    val metadata: Map<String, String>?
)

data class SpamCheckResponse(
    val isSpam: Boolean,
    val spamScore: Double,
    val spamTypes: List<SpamType>?,
    val actionRecommended: SpamAction
)

data class FraudDetectionRequest(
    val eventId: String,
    val transactionDetails: TransactionDetails?,
    val organizerHistory: OrganizerHistory?,
    val riskFactors: List<String>?
)

data class FraudDetectionResponse(
    val isFraudulent: Boolean,
    val riskScore: Double,
    val riskFactors: List<RiskFactor>,
    val recommendedAction: FraudAction
)

data class EventVerificationDetails(
    val title: String,
    val description: String,
    val date: String,
    val location: String,
    val capacity: Int,
    val ticketPrices: List<Double>?,
    val category: String
)

data class OrganizerVerificationDetails(
    val organizerId: String,
    val verificationStatus: String,
    val previousEvents: Int,
    val rating: Double
)

data class SecurityWarning(
    val type: SecurityWarningType,
    val message: String,
    val severity: SecuritySeverity
)

data class TransactionDetails(
    val amount: Double,
    val currency: String,
    val paymentMethod: String,
    val buyerId: String
)

data class OrganizerHistory(
    val totalEvents: Int,
    val successfulEvents: Int,
    val averageRating: Double,
    val verificationLevel: String
)

data class RiskFactor(
    val type: RiskType,
    val description: String,
    val severity: RiskSeverity,
    val probability: Double
)

enum class ReportType {
    INAPPROPRIATE_CONTENT,
    FRAUD,
    SPAM,
    FAKE_EVENT,
    SCAM,
    HARASSMENT,
    OTHER
}

enum class ReportStatus {
    SUBMITTED,
    UNDER_REVIEW,
    RESOLVED,
    REJECTED
}

enum class ContentType {
    EVENT_DESCRIPTION,
    COMMENT,
    MESSAGE,
    REVIEW
}

enum class SpamType {
    PROMOTIONAL,
    MISLEADING,
    REPETITIVE,
    MALICIOUS_LINKS,
    FAKE_REVIEWS
}

enum class SpamAction {
    ALLOW,
    FLAG,
    BLOCK,
    REQUIRE_VERIFICATION
}

enum class SecurityWarningType {
    SUSPICIOUS_PRICING,
    UNUSUAL_LOCATION,
    INCOMPLETE_DETAILS,
    SUSPICIOUS_TIMING,
    POTENTIAL_DUPLICATE
}

enum class SecuritySeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

enum class RiskType {
    FINANCIAL,
    IDENTITY,
    SAFETY,
    REPUTATION
}

enum class RiskSeverity {
    LOW,
    MEDIUM,
    HIGH,
    CRITICAL
}

enum class FraudAction {
    ALLOW,
    FLAG,
    BLOCK,
    REQUIRE_VERIFICATION,
    ESCALATE
} 