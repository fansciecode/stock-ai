import Foundation

protocol VerificationRepository {
    func startVerification(type: VerificationType, data: [String: Any]) async throws -> Verification
    func verifyCode(id: String, code: String) async throws -> Verification
    func resendCode(id: String) async throws -> Verification
    func getVerificationStatus(id: String) async throws -> Verification
    func uploadDocument(id: String, documentType: String, document: Data) async throws -> Verification
    func getVerificationHistory() async throws -> [Verification]
}

class VerificationRepositoryImpl: VerificationRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedVerification>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func startVerification(type: VerificationType, data: [String: Any]) async throws -> Verification {
        var requestData = data
        requestData["type"] = type.rawValue
        
        let response: VerificationResponse = try await apiService.request(
            endpoint: "/verifications",
            method: "POST",
            body: try JSONEncoder().encode(requestData)
        )
        
        let verification = response.data
        cache.setObject(CachedVerification(verification: verification, timestamp: Date()), forKey: verification.id as NSString)
        return verification
    }
    
    func verifyCode(id: String, code: String) async throws -> Verification {
        let response: VerificationResponse = try await apiService.request(
            endpoint: "/verifications/\(id)/verify",
            method: "POST",
            body: try JSONEncoder().encode(["code": code])
        )
        
        let verification = response.data
        cache.setObject(CachedVerification(verification: verification, timestamp: Date()), forKey: verification.id as NSString)
        return verification
    }
    
    func resendCode(id: String) async throws -> Verification {
        let response: VerificationResponse = try await apiService.request(
            endpoint: "/verifications/\(id)/resend",
            method: "POST"
        )
        
        let verification = response.data
        cache.setObject(CachedVerification(verification: verification, timestamp: Date()), forKey: verification.id as NSString)
        return verification
    }
    
    func getVerificationStatus(id: String) async throws -> Verification {
        if let cached = cache.object(forKey: id as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 60 { // 1 minute cache
                return cached.verification
            }
        }
        
        let response: VerificationResponse = try await apiService.request(
            endpoint: "/verifications/\(id)",
            method: "GET"
        )
        
        let verification = response.data
        cache.setObject(CachedVerification(verification: verification, timestamp: Date()), forKey: verification.id as NSString)
        return verification
    }
    
    func uploadDocument(id: String, documentType: String, document: Data) async throws -> Verification {
        let response: VerificationResponse = try await apiService.request(
            endpoint: "/verifications/\(id)/document",
            method: "POST",
            multipartData: [
                "document": MultipartData(
                    data: document,
                    mimeType: "application/pdf",
                    filename: "document.pdf"
                ),
                "type": MultipartData(
                    data: documentType.data(using: .utf8)!,
                    mimeType: "text/plain",
                    filename: "type.txt"
                )
            ]
        )
        
        let verification = response.data
        cache.setObject(CachedVerification(verification: verification, timestamp: Date()), forKey: verification.id as NSString)
        return verification
    }
    
    func getVerificationHistory() async throws -> [Verification] {
        let response: VerificationListResponse = try await apiService.request(
            endpoint: "/verifications/history",
            method: "GET"
        )
        return response.data
    }
}

// MARK: - Cache Types
private class CachedVerification {
    let verification: Verification
    let timestamp: Date
    
    init(verification: Verification, timestamp: Date) {
        self.verification = verification
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct VerificationResponse: Codable {
    let success: Bool
    let data: Verification
    let message: String?
}

struct VerificationListResponse: Codable {
    let success: Bool
    let data: [Verification]
    let message: String?
    let metadata: ListMetadata?
}

// MARK: - Errors
enum VerificationError: LocalizedError {
    case invalidCode
    case expired
    case tooManyAttempts
    case invalidDocumentType
    case documentUploadFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidCode:
            return "Invalid verification code"
        case .expired:
            return "Verification code has expired"
        case .tooManyAttempts:
            return "Too many verification attempts"
        case .invalidDocumentType:
            return "Invalid document type"
        case .documentUploadFailed:
            return "Failed to upload document"
        }
    }
} 