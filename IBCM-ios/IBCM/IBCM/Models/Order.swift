import Foundation

struct Order: Identifiable, Codable {
    let id: String
    let userId: String
    let items: [OrderItem]
    let status: OrderStatus
    let totalAmount: Double
    let paymentStatus: PaymentStatus
    let createdAt: Date
    let updatedAt: Date
    let shippingAddress: Address?
    let billingAddress: Address?
    let trackingNumber: String?
    let estimatedDeliveryDate: Date?
    let notes: String?
    
    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: totalAmount)) ?? "$\(totalAmount)"
    }
}

struct OrderItem: Identifiable, Codable {
    let id: String
    let productId: String
    let name: String
    let quantity: Int
    let price: Double
    let imageUrl: String?
    var subtotal: Double {
        Double(quantity) * price
    }
}

struct Address: Codable {
    let street: String
    let city: String
    let state: String
    let zipCode: String
    let country: String
    
    var formattedAddress: String {
        "\(street)\n\(city), \(state) \(zipCode)\n\(country)"
    }
}

enum OrderStatus: String, Codable, CaseIterable {
    case pending = "PENDING"
    case confirmed = "CONFIRMED"
    case processing = "PROCESSING"
    case shipped = "SHIPPED"
    case delivered = "DELIVERED"
    case cancelled = "CANCELLED"
    case refunded = "REFUNDED"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .pending: return "clock"
        case .confirmed: return "checkmark.circle"
        case .processing: return "gear"
        case .shipped: return "shippingbox"
        case .delivered: return "checkmark.circle.fill"
        case .cancelled: return "xmark.circle"
        case .refunded: return "arrow.counterclockwise.circle"
        }
    }
}

enum PaymentStatus: String, Codable, CaseIterable {
    case pending = "PENDING"
    case authorized = "AUTHORIZED"
    case paid = "PAID"
    case failed = "FAILED"
    case refunded = "REFUNDED"
    
    var displayName: String {
        rawValue.capitalized
    }
    
    var systemImage: String {
        switch self {
        case .pending: return "clock"
        case .authorized: return "checkmark.shield"
        case .paid: return "checkmark.circle.fill"
        case .failed: return "xmark.circle"
        case .refunded: return "arrow.counterclockwise.circle"
        }
    }
}

// MARK: - Response Types
struct OrderResponse: Codable {
    let success: Bool
    let data: Order
    let message: String?
}

struct OrderListResponse: Codable {
    let success: Bool
    let data: [Order]
    let message: String?
    let metadata: ListMetadata
}

struct ListMetadata: Codable {
    let total: Int
    let page: Int
    let limit: Int
} 