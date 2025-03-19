package com.example.ibcmserver_init.data.model.verification

import android.net.Uri

sealed class DocumentType {
    object ID_PROOF : DocumentType()
    object ADDRESS_PROOF : DocumentType()
    object BUSINESS_REGISTRATION : DocumentType()
    object TAX_CERTIFICATE : DocumentType()
    object TRADE_LICENSE : DocumentType()
    object OTHER : DocumentType()
}

data class DocumentFile(
    val uri: Uri,
    val type: DocumentType,
    val metadata: DocumentMetadata
)

data class DocumentMetadata(
    val size: Long,
    val mimeType: String,
    val dimensions: Dimensions?
)

data class Dimensions(
    val width: Int,
    val height: Int
)

enum class VerificationStatus {
    PENDING,
    APPROVED,
    REJECTED,
    MORE_INFO_NEEDED
}

data class VerificationDetails(
    val id: String,
    val status: VerificationStatus,
    val documents: List<DocumentInfo>,
    val remarks: String?,
    val submittedAt: String,
    val processedAt: String?
)

data class DocumentInfo(
    val type: DocumentType,
    val fileUrl: String,
    val isVerified: Boolean,
    val uploadedAt: String
) 