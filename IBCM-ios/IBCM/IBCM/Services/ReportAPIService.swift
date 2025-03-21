import Foundation

protocol ReportAPIService: BaseAPIService {
    func submitReport(report: Report) async throws -> BasicResponse
    func getReportStatus(reportId: String) async throws -> ReportResponse
    func updateReportStatus(reportId: String, status: String) async throws -> BasicResponse
    func getReportsByUser(userId: String) async throws -> ReportListResponse
    func getReportsByTarget(targetId: String, type: String) async throws -> ReportListResponse
}

class ReportAPIServiceImpl: ReportAPIService {
    private let apiService: APIService
    
    init(apiService: APIService) {
        self.apiService = apiService
    }
    
    func submitReport(report: Report) async throws -> BasicResponse {
        return try await apiService.request(
            endpoint: "reports",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(report)
        )
    }
    
    func getReportStatus(reportId: String) async throws -> ReportResponse {
        return try await apiService.request(
            endpoint: "reports/\(reportId)/status",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateReportStatus(reportId: String, status: String) async throws -> BasicResponse {
        guard Report.validStatuses.contains(status) else {
            throw ReportError.invalidStatus
        }
        
        return try await apiService.request(
            endpoint: "reports/\(reportId)/status",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(["status": status])
        )
    }
    
    func getReportsByUser(userId: String) async throws -> ReportListResponse {
        return try await apiService.request(
            endpoint: "reports/user/\(userId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getReportsByTarget(targetId: String, type: String) async throws -> ReportListResponse {
        guard Report.validTargetTypes.contains(type) else {
            throw ReportError.invalidReport
        }
        
        let queryItems = [
            URLQueryItem(name: "targetId", value: targetId),
            URLQueryItem(name: "type", value: type)
        ]
        
        return try await apiService.request(
            endpoint: "reports/target",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
}

// Helper for creating new reports
extension ReportAPIServiceImpl {
    func createReportRequest(
        targetId: String,
        targetType: String,
        reason: String,
        description: String,
        reporterId: String,
        evidence: [String]? = nil
    ) throws -> Report {
        guard Report.validTargetTypes.contains(targetType) else {
            throw ReportError.invalidReport
        }
        
        guard Report.validReasons.contains(reason) else {
            throw ReportError.invalidReport
        }
        
        return Report(
            id: UUID().uuidString,
            targetId: targetId,
            targetType: targetType,
            reason: reason,
            description: description,
            reporterId: reporterId,
            status: "pending",
            createdAt: Date(),
            updatedAt: Date(),
            evidence: evidence
        )
    }
} 