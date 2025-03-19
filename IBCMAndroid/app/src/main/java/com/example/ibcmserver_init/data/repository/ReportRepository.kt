interface ReportRepository {
    suspend fun submitReport(report: Report): Boolean
    suspend fun getReportStatus(reportId: String): String
    suspend fun updateReportStatus(reportId: String, status: String): Boolean
    suspend fun getReportsByUser(userId: String): List<Report>
    suspend fun getReportsByTarget(targetId: String, type: String): List<Report>
} 