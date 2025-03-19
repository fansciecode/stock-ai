interface ReportApiService {
    @POST("reports")
    suspend fun submitReport(@Body report: ReportRequest): Response<Report>

    @GET("reports/{id}")
    suspend fun getReportStatus(@Path("id") reportId: String): Response<Report>

    @PUT("reports/{id}")
    suspend fun updateReportStatus(
        @Path("id") reportId: String,
        @Body status: ReportStatusUpdate
    ): Response<Report>
}

data class ReportRequest(
    val type: String,
    val targetId: String,
    val reason: String,
    val details: String? = null
)

data class ReportStatusUpdate(
    val status: String,
    val reviewerNotes: String? = null
) 