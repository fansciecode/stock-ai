data class Report(
    val id: String,
    val type: String, // "EVENT", "USER", "CHAT", "MESSAGE"
    val targetId: String,
    val reason: String,
    val reporterId: String,
    val timestamp: Long,
    val status: String, // "PENDING", "REVIEWED", "RESOLVED", "REJECTED"
    val reviewerNotes: String? = null,
    val reviewedAt: Long? = null,
    val reviewerId: String? = null
) 