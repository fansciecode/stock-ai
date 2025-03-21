import Foundation

struct Payment: Identifiable, Codable {
    let id: String
    let orderId: String
    let amount: Double
    let currency: String
    let status: PaymentStatus
    let method: PaymentMethod
    let createdAt: Date
    let updatedAt: Date
    let transactionId: String?
    let errorMessage: String?
    let billingAddress: Address?
    let cardDetails: CardDetails?
}

struct CardDetails: Codable {
    let last4: String
    let brand: String
    let expiryMonth: Int
    let expiryYear: Int
    
    var formattedExpiry: String {
        String(format: "%02d/%d", expiryMonth, expiryYear % 100)
    }
    
    var formattedCard: String {
        "•••• \(last4)"
    }
}

enum PaymentMethod: String, Codable, CaseIterable {
    case creditCard = "CREDIT_CARD"
    case debitCard = "DEBIT_CARD"
    case bankTransfer = "BANK_TRANSFER"
    case applePay = "APPLE_PAY"
    case paypal = "PAYPAL"
    
    var displayName: String {
        switch self {
        case .creditCard: return "Credit Card"
        case .debitCard: return "Debit Card"
        case .bankTransfer: return "Bank Transfer"
        case .applePay: return "Apple Pay"
        case .paypal: return "PayPal"
        }
    }
    
    var systemImage: String {
        switch self {
        case .creditCard, .debitCard: return "creditcard"
        case .bankTransfer: return "building.columns"
        case .applePay: return "apple.logo"
        case .paypal: return "p.circle"
        }
    }
}

// MARK: - Payment Request Types
struct PaymentRequest: Codable {
    let orderId: String
    let amount: Double
    let currency: String
    let method: PaymentMethod
    let billingAddress: Address?
    let cardDetails: CardDetails?
}

// MARK: - Response Types
struct PaymentResponse: Codable {
    let success: Bool
    let data: Payment
    let message: String?
}

struct PaymentListResponse: Codable {
    let success: Bool
    let data: [Payment]
    let message: String?
    let metadata: ListMetadata
} 