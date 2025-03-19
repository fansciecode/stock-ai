@Singleton
class ReportRepositoryImpl @Inject constructor(
    private val firestore: FirebaseFirestore
) : ReportRepository {
    
    override suspend fun submitReport(report: Report): Boolean = withContext(Dispatchers.IO) {
        try {
            firestore.collection("reports")
                .document(report.id)
                .set(report)
            true
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun getReportStatus(reportId: String): String = withContext(Dispatchers.IO) {
        val report = firestore.collection("reports")
            .document(reportId)
            .get()
            .await()
        report.getString("status") ?: "PENDING"
    }

    override suspend fun updateReportStatus(reportId: String, status: String): Boolean = 
        withContext(Dispatchers.IO) {
            try {
                firestore.collection("reports")
                    .document(reportId)
                    .update("status", status)
                true
            } catch (e: Exception) {
                false
            }
        }

    override suspend fun getReportsByUser(userId: String): List<Report> = withContext(Dispatchers.IO) {
        firestore.collection("reports")
            .whereEqualTo("reporterId", userId)
            .get()
            .await()
            .toObjects(Report::class.java)
    }

    override suspend fun getReportsByTarget(targetId: String, type: String): List<Report> = 
        withContext(Dispatchers.IO) {
            firestore.collection("reports")
                .whereEqualTo("targetId", targetId)
                .whereEqualTo("type", type)
                .get()
                .await()
                .toObjects(Report::class.java)
        }
} 