import Foundation

protocol PaymentAPIService: BaseAPIService {
    func initiatePayment(request: PaymentRequest) async throws -> PaymentResponse
    func confirmPayment(confirmation: PaymentConfirmation) async throws -> PaymentResponse
    func upgradeEvent(eventId: String, request: EventUpgradeRequest) async throws -> PaymentResponse
    func createSubscription(request: SubscriptionRequest) async throws -> PaymentResponse
    func cancelSubscription() async throws -> [String: Any]
    func requestRefund(request: RefundRequest) async throws -> PaymentResponse
    func getPaymentStatus(paymentId: String) async throws -> PaymentVerification
    func verifyPayment(paymentId: String) async throws -> PaymentVerification
    func getPaymentHistory() async throws -> [PaymentResponse]
    func processPayment(request: [String: Any]) async throws -> PaymentResponse
    func createPaymentIntent(request: [String: Any]) async throws -> [String: String]
}

struct PaymentRequest: Codable {
    let amount: Double
    let currency: String
    let paymentMethod: String
    let description: String?
    let metadata: [String: String]?
}

struct PaymentConfirmation: Codable {
    let paymentId: String
    let paymentMethodId: String?
    let savePaymentMethod: Bool?
}

struct EventUpgradeRequest: Codable {
    let planId: String
    let paymentMethodId: String?
    let couponCode: String?
}

struct SubscriptionRequest: Codable {
    let planId: String
    let paymentMethodId: String
    let couponCode: String?
    let metadata: [String: String]?
}

struct RefundRequest: Codable {
    let paymentId: String
    let amount: Double?
    let reason: String?
}

struct PaymentResponse: Codable {
    let id: String
    let amount: Double
    let currency: String
    let status: PaymentStatus
    let paymentMethod: PaymentMethod
    let createdAt: Date
    let metadata: [String: String]?
}

struct PaymentVerification: Codable {
    let paymentId: String
    let status: PaymentStatus
    let verifiedAt: Date?
    let error: String?
}

enum PaymentStatus: String, Codable {
    case pending = "PENDING"
    case processing = "PROCESSING"
    case succeeded = "SUCCEEDED"
    case failed = "FAILED"
    case refunded = "REFUNDED"
    case cancelled = "CANCELLED"
}

struct PaymentMethod: Codable {
    let id: String
    let type: String
    let last4: String?
    let expiryMonth: Int?
    let expiryYear: Int?
    let brand: String?
}

class PaymentAPIServiceImpl: PaymentAPIService {
    func initiatePayment(request: PaymentRequest) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/create",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func confirmPayment(confirmation: PaymentConfirmation) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/confirm",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(confirmation)
        )
    }
    
    func upgradeEvent(eventId: String, request: EventUpgradeRequest) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/upgrade/\(eventId)",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func createSubscription(request: SubscriptionRequest) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/subscription/create",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func cancelSubscription() async throws -> [String: Any] {
        return try await apiService.request(
            endpoint: "payments/subscription/cancel",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func requestRefund(request: RefundRequest) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/refund",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(request)
        )
    }
    
    func getPaymentStatus(paymentId: String) async throws -> PaymentVerification {
        return try await apiService.request(
            endpoint: "payments/status/\(paymentId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func verifyPayment(paymentId: String) async throws -> PaymentVerification {
        return try await apiService.request(
            endpoint: "payments/verify",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(paymentId)
        )
    }
    
    func getPaymentHistory() async throws -> [PaymentResponse] {
        return try await apiService.request(
            endpoint: "payments/history",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func processPayment(request: [String: Any]) async throws -> PaymentResponse {
        return try await apiService.request(
            endpoint: "payments/process",
            method: HTTPMethod.post.rawValue,
            body: try JSONSerialization.data(withJSONObject: request)
        )
    }
    
    func createPaymentIntent(request: [String: Any]) async throws -> [String: String] {
        return try await apiService.request(
            endpoint: "payments/create-payment-intent",
            method: HTTPMethod.post.rawValue,
            body: try JSONSerialization.data(withJSONObject: request)
        )
    }
} 