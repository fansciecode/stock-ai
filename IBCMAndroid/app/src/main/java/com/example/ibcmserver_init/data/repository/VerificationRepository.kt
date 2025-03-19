package com.example.ibcmserver_init.data.repository

import android.content.Context
import android.os.Build
import com.example.ibcmserver_init.data.api.VerificationApiService
import com.example.ibcmserver_init.data.model.verification.DocumentFile
import com.example.ibcmserver_init.data.model.verification.VerificationDetails
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.flow.MutableSharedFlow
import kotlinx.coroutines.flow.asSharedFlow
import kotlinx.coroutines.withContext
import okhttp3.MediaType.Companion.toMediaType
import okhttp3.MultipartBody
import okhttp3.RequestBody.Companion.toRequestBody
import org.json.JSONObject
import retrofit2.HttpException
import java.io.IOException
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class VerificationRepository @Inject constructor(
    private val api: VerificationApiService,
    private val context: Context
) {
    private val _verificationUpdates = MutableSharedFlow<VerificationDetails>()
    val verificationUpdates = _verificationUpdates.asSharedFlow()

    suspend fun submitVerification(
        documents: List<DocumentFile>
    ): Result<VerificationDetails> = withContext(Dispatchers.IO) {
        try {
            val parts = documents.map { document ->
                val uri = document.uri
                val inputStream = context.contentResolver.openInputStream(uri)
                val bytes = inputStream?.readBytes() ?: throw IOException("Could not read file")
                
                MultipartBody.Part.createFormData(
                    "document",
                    "document_${document.type}.jpg",
                    bytes.toRequestBody("image/*".toMediaType())
                )
            }

            val metadata = JSONObject().apply {
                put("deviceInfo", getDeviceInfo())
                put("timestamp", System.currentTimeMillis())
            }.toString().toRequestBody("application/json".toMediaType())

            val response = api.submitVerification(parts, metadata)
            if (response.isSuccessful) {
                Result.success(response.body()!!)
            } else {
                Result.failure(HttpException(response))
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    suspend fun getVerificationStatus(id: String): Result<VerificationDetails> =
        withContext(Dispatchers.IO) {
            try {
                val response = api.getVerificationStatus(id)
                if (response.isSuccessful) {
                    Result.success(response.body()!!)
                } else {
                    Result.failure(HttpException(response))
                }
            } catch (e: Exception) {
                Result.failure(e)
            }
        }

    private fun getDeviceInfo(): JSONObject = JSONObject().apply {
        put("model", Build.MODEL)
        put("manufacturer", Build.MANUFACTURER)
        put("osVersion", Build.VERSION.SDK_INT)
    }
} 