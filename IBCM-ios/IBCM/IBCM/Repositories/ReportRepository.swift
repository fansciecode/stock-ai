import Foundation

protocol ReportRepository {
    func submitReport(report: Report) async throws -> Bool
    func getReportStatus(reportId: String) async throws -> String
    func updateReportStatus(reportId: String, status: String) async throws -> Bool
    func getReportsByUser(userId: String) async throws -> [Report]
    func getReportsByTarget(targetId: String, type: String) async throws -> [Report]
}

class ReportRepositoryImpl: ReportRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedReport>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func submitReport(report: Report) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/reports",
            method: "POST",
            body: try JSONEncoder().encode(report)
        )
        
        if response.success {
            cache.setObject(CachedReport(report: report, timestamp: Date()), forKey: report.id as NSString)
        }
        
        return response.success
    }
    
    func getReportStatus(reportId: String) async throws -> String {
        if let cached = cache.object(forKey: reportId as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.report.status
            }
        }
        
        let response: ReportResponse = try await apiService.request(
            endpoint: "/reports/\(reportId)/status",
            method: "GET"
        )
        
        let report = response.data
        cache.setObject(CachedReport(report: report, timestamp: Date()), forKey: report.id as NSString)
        return report.status
    }
    
    func updateReportStatus(reportId: String, status: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/reports/\(reportId)/status",
            method: "PUT",
            body: try JSONEncoder().encode(["status": status])
        )
        
        if response.success {
            cache.removeObject(forKey: reportId as NSString)
        }
        
        return response.success
    }
    
    func getReportsByUser(userId: String) async throws -> [Report] {
        let response: ReportListResponse = try await apiService.request(
            endpoint: "/reports/user/\(userId)",
            method: "GET"
        )
        
        response.data.forEach { report in
            cache.setObject(CachedReport(report: report, timestamp: Date()), forKey: report.id as NSString)
        }
        
        return response.data
    }
    
    func getReportsByTarget(targetId: String, type: String) async throws -> [Report] {
        let response: ReportListResponse = try await apiService.request(
            endpoint: "/reports/target",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "targetId", value: targetId),
                URLQueryItem(name: "type", value: type)
            ]
        )
        
        response.data.forEach { report in
            cache.setObject(CachedReport(report: report, timestamp: Date()), forKey: report.id as NSString)
        }
        
        return response.data
    }
}

// MARK: - Cache Types
private class CachedReport {
    let report: Report
    let timestamp: Date
    
    init(report: Report, timestamp: Date) {
        self.report = report
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct ReportResponse: Codable {
    let success: Bool
    let data: Report
    let message: String?
}

struct ReportListResponse: Codable {
    let success: Bool
    let data: [Report]
    let message: String?
}

// MARK: - Errors
enum ReportError: LocalizedError {
    case invalidReport
    case reportNotFound
    case invalidStatus
    case submissionFailed
    case updateFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidReport:
            return "Invalid report"
        case .reportNotFound:
            return "Report not found"
        case .invalidStatus:
            return "Invalid report status"
        case .submissionFailed:
            return "Failed to submit report"
        case .updateFailed:
            return "Failed to update report"
        }
    }
} 