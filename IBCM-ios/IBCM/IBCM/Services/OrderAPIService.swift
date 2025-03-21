import Foundation

protocol OrderAPIService: BaseAPIService {
    func createOrder(order: Order) async throws -> Order
    func getOrder(orderId: String) async throws -> Order
    func getUserOrders(userId: String, status: OrderStatus?, page: Int, limit: Int) async throws -> [OrderSummary]
    func updateOrderStatus(orderId: String, status: OrderStatus) async throws -> Order
    func processPayment(orderId: String, paymentInfo: PaymentInfo) async throws -> PaymentInfo
    func getPaymentStatus(orderId: String) async throws -> PaymentInfo
    func requestRefund(orderId: String, refundRequest: RefundRequest) async throws -> Order
    func getOrdersSummary(startDate: String, endDate: String) async throws -> [OrderSummary]
    func cancelOrder(orderId: String) async throws -> Order
    func updateDeliveryDetails(orderId: String, details: DeliveryDetails) async throws -> Order
    func processCreatorSettlement(orderId: String) async throws -> SettlementDetails
    func getCreatorSettlements(creatorId: String) async throws -> [SettlementDetails]
    func updateTrackingInfo(orderId: String, trackingInfo: TrackingInfo) async throws -> Order
    func getCustomerOrders(customerId: String) async throws -> [Order]
    func getCreatorOrders(creatorId: String) async throws -> [Order]
    func getTrackingInfo(orderId: String) async throws -> TrackingInfo
    func validateDeliveryAddress(orderId: String, address: Address) async throws -> [String: Bool]
    func getOrderStatistics(creatorId: String?, startDate: Date?, endDate: Date?) async throws -> [String: Any]
    func sendOrderNotification(orderId: String, notification: [String: String]) async throws -> [String: Bool]
}

struct Order: Codable {
    let id: String
    let customerId: String
    let creatorId: String
    let items: [OrderItem]
    let status: OrderStatus
    let totalAmount: Double
    let currency: String
    let paymentStatus: PaymentStatus
    let deliveryDetails: DeliveryDetails?
    let createdAt: Date
    let updatedAt: Date
    let metadata: [String: String]?
}

struct OrderItem: Codable {
    let id: String
    let productId: String
    let quantity: Int
    let price: Double
    let currency: String
    let metadata: [String: String]?
}

enum OrderStatus: String, Codable {
    case pending = "PENDING"
    case confirmed = "CONFIRMED"
    case processing = "PROCESSING"
    case shipped = "SHIPPED"
    case delivered = "DELIVERED"
    case cancelled = "CANCELLED"
    case refunded = "REFUNDED"
}

struct OrderSummary: Codable {
    let id: String
    let customerId: String
    let totalAmount: Double
    let status: OrderStatus
    let createdAt: Date
    let itemCount: Int
}

struct PaymentInfo: Codable {
    let orderId: String
    let amount: Double
    let currency: String
    let status: PaymentStatus
    let paymentMethod: PaymentMethod
    let transactionId: String?
    let error: String?
}

struct DeliveryDetails: Codable {
    let address: Address
    let carrier: String?
    let trackingNumber: String?
    let estimatedDeliveryDate: Date?
    let instructions: String?
}

struct Address: Codable {
    let street: String
    let city: String
    let state: String
    let country: String
    let postalCode: String
    let phoneNumber: String?
}

struct SettlementDetails: Codable {
    let id: String
    let orderId: String
    let creatorId: String
    let amount: Double
    let currency: String
    let status: SettlementStatus
    let paymentMethod: String
    let processedAt: Date?
}

enum SettlementStatus: String, Codable {
    case pending = "PENDING"
    case processing = "PROCESSING"
    case completed = "COMPLETED"
    case failed = "FAILED"
}

struct TrackingInfo: Codable {
    let carrier: String
    let trackingNumber: String
    let status: String
    let location: String?
    let updatedAt: Date
    let estimatedDeliveryDate: Date?
}

class OrderAPIServiceImpl: OrderAPIService {
    func createOrder(order: Order) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(order)
        )
    }
    
    func getOrder(orderId: String) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getUserOrders(userId: String, status: OrderStatus?, page: Int, limit: Int) async throws -> [OrderSummary] {
        var queryItems = [
            URLQueryItem(name: "page", value: String(page)),
            URLQueryItem(name: "limit", value: String(limit))
        ]
        
        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }
        
        return try await apiService.request(
            endpoint: "orders/user/\(userId)",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func updateOrderStatus(orderId: String, status: OrderStatus) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/status",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(status)
        )
    }
    
    func processPayment(orderId: String, paymentInfo: PaymentInfo) async throws -> PaymentInfo {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/payment",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(paymentInfo)
        )
    }
    
    func getPaymentStatus(orderId: String) async throws -> PaymentInfo {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/payment",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func requestRefund(orderId: String, refundRequest: RefundRequest) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/refund",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(refundRequest)
        )
    }
    
    func getOrdersSummary(startDate: String, endDate: String) async throws -> [OrderSummary] {
        return try await apiService.request(
            endpoint: "orders/summary",
            method: HTTPMethod.get.rawValue,
            queryItems: [
                URLQueryItem(name: "startDate", value: startDate),
                URLQueryItem(name: "endDate", value: endDate)
            ]
        )
    }
    
    func cancelOrder(orderId: String) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)",
            method: HTTPMethod.delete.rawValue
        )
    }
    
    func updateDeliveryDetails(orderId: String, details: DeliveryDetails) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/delivery",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(details)
        )
    }
    
    func processCreatorSettlement(orderId: String) async throws -> SettlementDetails {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/settlement",
            method: HTTPMethod.post.rawValue
        )
    }
    
    func getCreatorSettlements(creatorId: String) async throws -> [SettlementDetails] {
        return try await apiService.request(
            endpoint: "creators/\(creatorId)/settlements",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func updateTrackingInfo(orderId: String, trackingInfo: TrackingInfo) async throws -> Order {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/tracking",
            method: HTTPMethod.put.rawValue,
            body: try JSONEncoder().encode(trackingInfo)
        )
    }
    
    func getCustomerOrders(customerId: String) async throws -> [Order] {
        return try await apiService.request(
            endpoint: "customers/\(customerId)/orders",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getCreatorOrders(creatorId: String) async throws -> [Order] {
        return try await apiService.request(
            endpoint: "creators/\(creatorId)/orders",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func getTrackingInfo(orderId: String) async throws -> TrackingInfo {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/tracking",
            method: HTTPMethod.get.rawValue
        )
    }
    
    func validateDeliveryAddress(orderId: String, address: Address) async throws -> [String: Bool] {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/delivery/validate",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(address)
        )
    }
    
    func getOrderStatistics(creatorId: String?, startDate: Date?, endDate: Date?) async throws -> [String: Any] {
        var queryItems: [URLQueryItem] = []
        
        if let creatorId = creatorId {
            queryItems.append(URLQueryItem(name: "creatorId", value: creatorId))
        }
        
        if let startDate = startDate {
            queryItems.append(URLQueryItem(name: "startDate", value: String(Int(startDate.timeIntervalSince1970))))
        }
        
        if let endDate = endDate {
            queryItems.append(URLQueryItem(name: "endDate", value: String(Int(endDate.timeIntervalSince1970))))
        }
        
        return try await apiService.request(
            endpoint: "orders/statistics",
            method: HTTPMethod.get.rawValue,
            queryItems: queryItems
        )
    }
    
    func sendOrderNotification(orderId: String, notification: [String: String]) async throws -> [String: Bool] {
        return try await apiService.request(
            endpoint: "orders/\(orderId)/notify",
            method: HTTPMethod.post.rawValue,
            body: try JSONEncoder().encode(notification)
        )
    }
} 