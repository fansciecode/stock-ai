import Foundation

protocol VerificationAPIService: BaseAPIService {
    func submitVerification(files: [Data], metadata: VerificationMetadata) async throws -> VerificationDetails
    func getVerificationStatus(verificationId: String) async throws -> VerificationDetails
}

struct VerificationMetadata: Codable {
    let type: String
    let userId: String
    let documentType: String
    let additionalInfo: [String: String]?
}

struct VerificationDetails: Codable {
    let id: String
    let userId: String
    let status: VerificationStatus
    let documentUrls: [String]
    let type: String
    let documentType: String
    let submittedAt: Date
    let updatedAt: Date
    let reviewedAt: Date?
    let reviewerNotes: String?
    let expiresAt: Date?
}

enum VerificationStatus: String, Codable {
    case pending = "PENDING"
    case approved = "APPROVED"
    case rejected = "REJECTED"
    case expired = "EXPIRED"
}

class VerificationAPIServiceImpl: VerificationAPIService {
    func submitVerification(files: [Data], metadata: VerificationMetadata) async throws -> VerificationDetails {
        var multipartData: [String: MultipartData] = [:]
        
        // Add files to multipart data
        for (index, fileData) in files.enumerated() {
            multipartData["file\(index)"] = MultipartData(
                data: fileData,
                mimeType: "application/octet-stream",
                filename: "document\(index).pdf"
            )
        }
        
        // Add metadata to multipart data
        if let metadataData = try? JSONEncoder().encode(metadata) {
            multipartData["metadata"] = MultipartData(
                data: metadataData,
                mimeType: "application/json",
                filename: "metadata.json"
            )
        }
        
        return try await apiService.request(
            endpoint: "api/verification/submit",
            method: HTTPMethod.post.rawValue,
            multipartData: multipartData
        )
    }
    
    func getVerificationStatus(verificationId: String) async throws -> VerificationDetails {
        return try await apiService.request(
            endpoint: "api/verification/status/\(verificationId)",
            method: HTTPMethod.get.rawValue
        )
    }
} 