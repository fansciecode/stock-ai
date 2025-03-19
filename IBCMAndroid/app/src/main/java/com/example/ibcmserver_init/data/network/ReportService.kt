package com.example.ibcmserver_init.data.network

import com.example.ibcmserver_init.data.model.chat.Report
import com.example.ibcmserver_init.data.model.chat.ReportReason
import com.example.ibcmserver_init.data.model.chat.ReportType
import retrofit2.http.*

interface ReportService {
    @GET("reports/reasons")
    suspend fun getReportReasons(@Query("type") type: ReportType): List<ReportReason>

    @POST("reports")
    suspend fun submitReport(
        @Body report: Report
    ): Report

    @GET("reports")
    suspend fun getReports(
        @Query("type") type: ReportType? = null,
        @Query("status") status: String? = null
    ): List<Report>

    @PUT("reports/{reportId}")
    suspend fun updateReportStatus(
        @Path("reportId") reportId: String,
        @Query("status") status: String
    ): Report

    @DELETE("reports/{reportId}")
    suspend fun deleteReport(@Path("reportId") reportId: String)
} 