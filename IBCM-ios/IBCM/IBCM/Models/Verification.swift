import Foundation

struct Verification: Identifiable, Codable {
    let id: String
    let userId: String
    let type: VerificationType
    let status: VerificationStatus
    let code: String?
    let expiresAt: Date?
    let verifiedAt: Date?
    let createdAt: Date
    let updatedAt: Date
    let attempts: Int
    let maxAttempts: Int
    let metadata: VerificationMetadata?
}

enum VerificationType: String, Codable, CaseIterable {
    case email = "EMAIL"
    case phone = "PHONE"
    case identity = "IDENTITY"
    case address = "ADDRESS"
    
    var displayName: String {
        switch self {
        case .email: return "Email Verification"
        case .phone: return "Phone Verification"
        case .identity: return "Identity Verification"
        case .address: return "Address Verification"
        }
    }
    
    var systemImage: String {
        switch self {
        case .email: return "envelope"
        case .phone: return "phone"
        case .identity: return "person.text.rectangle"
        case .address: return "location"
        }
    }
}

enum VerificationStatus: String, Codable, CaseIterable {
    case pending = "PENDING"
    case verified = "VERIFIED"
    case failed = "FAILED"
    case expired = "EXPIRED"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .pending: return "clock"
        case .verified: return "checkmark.shield"
        case .failed: return "xmark.circle"
        case .expired: return "timer"
        }
    }
}

struct VerificationMetadata: Codable {
    let email: String?
    let phone: String?
    let documentType: String?
    let documentNumber: String?
    let documentExpiry: Date?
    let address: Address?
}

// MARK: - Request Types
struct VerificationRequest: Codable {
    let type: VerificationType
    let email: String?
    let phone: String?
    let code: String?
    let documentType: String?
    let documentNumber: String?
    let documentExpiry: Date?
    let address: Address?
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
    let metadata: ListMetadata
} 