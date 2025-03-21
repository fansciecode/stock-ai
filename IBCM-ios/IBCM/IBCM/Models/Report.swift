import Foundation

struct Report: Codable {
    let id: String
    let targetId: String
    let targetType: String // "user", "event", "comment", etc.
    let reason: String
    let description: String
    let reporterId: String
    let status: String // "pending", "resolved", "rejected"
    let createdAt: Date
    let updatedAt: Date
    let evidence: [String]? // URLs to evidence (screenshots, etc.)
}

extension Report {
    static let validTargetTypes = ["user", "event", "comment", "message", "product", "review"]
    static let validReasons = ["spam", "harassment", "inappropriate", "hate_speech", "violence", "fraud", "impersonation", "other"]
    static let validStatuses = ["pending", "resolved", "rejected"]
} 