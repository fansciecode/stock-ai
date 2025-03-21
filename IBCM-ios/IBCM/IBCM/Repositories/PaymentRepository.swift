import Foundation
import PassKit

protocol PaymentRepository {
    func processPayment(request: PaymentRequest) async throws -> Payment
    func getPaymentMethods() async throws -> [PaymentMethod]
    func addPaymentMethod(method: PaymentMethod, details: [String: Any]) async throws -> Bool
    func removePaymentMethod(id: String) async throws -> Bool
    func getPaymentHistory(page: Int, limit: Int) async throws -> ([Payment], ListMetadata)
    func getPaymentDetails(id: String) async throws -> Payment
    func refundPayment(id: String, reason: String?) async throws -> Payment
    func setupApplePay() async throws -> PKPaymentRequest
    func confirmApplePayment(token: PKPaymentToken) async throws -> Payment
}

class PaymentRepositoryImpl: PaymentRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedPayment>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func processPayment(request: PaymentRequest) async throws -> Payment {
        let response: PaymentResponse = try await apiService.request(
            endpoint: "/payments",
            method: "POST",
            body: try JSONEncoder().encode(request)
        )
        
        let payment = response.data
        cache.setObject(CachedPayment(payment: payment, timestamp: Date()), forKey: payment.id as NSString)
        return payment
    }
    
    func getPaymentMethods() async throws -> [PaymentMethod] {
        let response: PaymentMethodListResponse = try await apiService.request(
            endpoint: "/payments/methods",
            method: "GET"
        )
        return response.data
    }
    
    func addPaymentMethod(method: PaymentMethod, details: [String: Any]) async throws -> Bool {
        var requestData = details
        requestData["type"] = method.rawValue
        
        let response: BasicResponse = try await apiService.request(
            endpoint: "/payments/methods",
            method: "POST",
            body: try JSONEncoder().encode(requestData)
        )
        return response.success
    }
    
    func removePaymentMethod(id: String) async throws -> Bool {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/payments/methods/\(id)",
            method: "DELETE"
        )
        return response.success
    }
    
    func getPaymentHistory(page: Int, limit: Int) async throws -> ([Payment], ListMetadata) {
        let response: PaymentListResponse = try await apiService.request(
            endpoint: "/payments/history",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
    
    func getPaymentDetails(id: String) async throws -> Payment {
        if let cached = cache.object(forKey: id as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.payment
            }
        }
        
        let response: PaymentResponse = try await apiService.request(
            endpoint: "/payments/\(id)",
            method: "GET"
        )
        
        let payment = response.data
        cache.setObject(CachedPayment(payment: payment, timestamp: Date()), forKey: payment.id as NSString)
        return payment
    }
    
    func refundPayment(id: String, reason: String?) async throws -> Payment {
        let response: PaymentResponse = try await apiService.request(
            endpoint: "/payments/\(id)/refund",
            method: "POST",
            body: try JSONEncoder().encode(["reason": reason])
        )
        
        let payment = response.data
        cache.setObject(CachedPayment(payment: payment, timestamp: Date()), forKey: payment.id as NSString)
        return payment
    }
    
    func setupApplePay() async throws -> PKPaymentRequest {
        let response: ApplePayConfigResponse = try await apiService.request(
            endpoint: "/payments/apple-pay/config",
            method: "GET"
        )
        
        let paymentRequest = PKPaymentRequest()
        paymentRequest.merchantIdentifier = response.merchantId
        paymentRequest.countryCode = response.countryCode
        paymentRequest.currencyCode = response.currencyCode
        paymentRequest.supportedNetworks = response.supportedNetworks.compactMap { PKPaymentNetwork(rawValue: $0) }
        paymentRequest.merchantCapabilities = .capability3DS
        
        return paymentRequest
    }
    
    func confirmApplePayment(token: PKPaymentToken) async throws -> Payment {
        let response: PaymentResponse = try await apiService.request(
            endpoint: "/payments/apple-pay/confirm",
            method: "POST",
            body: try JSONEncoder().encode([
                "token": token.paymentData.base64EncodedString(),
                "transactionIdentifier": token.transactionIdentifier
            ])
        )
        
        let payment = response.data
        cache.setObject(CachedPayment(payment: payment, timestamp: Date()), forKey: payment.id as NSString)
        return payment
    }
}

// MARK: - Cache Types
private class CachedPayment {
    let payment: Payment
    let timestamp: Date
    
    init(payment: Payment, timestamp: Date) {
        self.payment = payment
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct PaymentMethodListResponse: Codable {
    let success: Bool
    let data: [PaymentMethod]
    let message: String?
}

struct PaymentListResponse: Codable {
    let success: Bool
    let data: [Payment]
    let message: String?
    let metadata: ListMetadata
}

struct ApplePayConfigResponse: Codable {
    let merchantId: String
    let countryCode: String
    let currencyCode: String
    let supportedNetworks: [String]
}

// MARK: - Errors
enum PaymentError: LocalizedError {
    case invalidPaymentMethod
    case paymentFailed
    case refundFailed
    case applePayNotAvailable
    case applePayConfigurationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidPaymentMethod:
            return "Invalid payment method"
        case .paymentFailed:
            return "Payment failed to process"
        case .refundFailed:
            return "Failed to process refund"
        case .applePayNotAvailable:
            return "Apple Pay is not available"
        case .applePayConfigurationFailed:
            return "Failed to configure Apple Pay"
        }
    }
} 