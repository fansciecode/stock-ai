import Foundation

protocol OrderRepository {
    func createOrder(request: OrderRequest) async throws -> Order
    func getOrders(status: OrderStatus?, page: Int, limit: Int) async throws -> ([Order], ListMetadata)
    func getOrderDetails(id: String) async throws -> Order
    func updateOrderStatus(id: String, status: OrderStatus) async throws -> Order
    func cancelOrder(id: String, reason: String?) async throws -> Order
    func rateOrder(id: String, rating: Int, review: String?) async throws -> Order
    func getOrderHistory(page: Int, limit: Int) async throws -> ([Order], ListMetadata)
    func getOrderTracking(id: String) async throws -> OrderTracking
    func disputeOrder(id: String, reason: String, details: String?) async throws -> OrderDispute
    func getOrderDisputes(page: Int, limit: Int) async throws -> ([OrderDispute], ListMetadata)
}

class OrderRepositoryImpl: OrderRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedOrder>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func createOrder(request: OrderRequest) async throws -> Order {
        let response: OrderResponse = try await apiService.request(
            endpoint: "/orders",
            method: "POST",
            body: try JSONEncoder().encode(request)
        )
        
        let order = response.data
        cache.setObject(CachedOrder(order: order, timestamp: Date()), forKey: order.id as NSString)
        return order
    }
    
    func getOrders(status: OrderStatus?, page: Int, limit: Int) async throws -> ([Order], ListMetadata) {
        var queryItems = [
            URLQueryItem(name: "page", value: "\(page)"),
            URLQueryItem(name: "limit", value: "\(limit)")
        ]
        
        if let status = status {
            queryItems.append(URLQueryItem(name: "status", value: status.rawValue))
        }
        
        let response: OrderListResponse = try await apiService.request(
            endpoint: "/orders",
            method: "GET",
            queryItems: queryItems
        )
        return (response.data, response.metadata)
    }
    
    func getOrderDetails(id: String) async throws -> Order {
        if let cached = cache.object(forKey: id as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.order
            }
        }
        
        let response: OrderResponse = try await apiService.request(
            endpoint: "/orders/\(id)",
            method: "GET"
        )
        
        let order = response.data
        cache.setObject(CachedOrder(order: order, timestamp: Date()), forKey: order.id as NSString)
        return order
    }
    
    func updateOrderStatus(id: String, status: OrderStatus) async throws -> Order {
        let response: OrderResponse = try await apiService.request(
            endpoint: "/orders/\(id)/status",
            method: "PUT",
            body: try JSONEncoder().encode(["status": status.rawValue])
        )
        
        let order = response.data
        cache.setObject(CachedOrder(order: order, timestamp: Date()), forKey: order.id as NSString)
        return order
    }
    
    func cancelOrder(id: String, reason: String?) async throws -> Order {
        let response: OrderResponse = try await apiService.request(
            endpoint: "/orders/\(id)/cancel",
            method: "POST",
            body: try JSONEncoder().encode(["reason": reason])
        )
        
        let order = response.data
        cache.setObject(CachedOrder(order: order, timestamp: Date()), forKey: order.id as NSString)
        return order
    }
    
    func rateOrder(id: String, rating: Int, review: String?) async throws -> Order {
        let response: OrderResponse = try await apiService.request(
            endpoint: "/orders/\(id)/rate",
            method: "POST",
            body: try JSONEncoder().encode([
                "rating": rating,
                "review": review
            ])
        )
        
        let order = response.data
        cache.setObject(CachedOrder(order: order, timestamp: Date()), forKey: order.id as NSString)
        return order
    }
    
    func getOrderHistory(page: Int, limit: Int) async throws -> ([Order], ListMetadata) {
        let response: OrderListResponse = try await apiService.request(
            endpoint: "/orders/history",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
    
    func getOrderTracking(id: String) async throws -> OrderTracking {
        let response: OrderTrackingResponse = try await apiService.request(
            endpoint: "/orders/\(id)/tracking",
            method: "GET"
        )
        return response.data
    }
    
    func disputeOrder(id: String, reason: String, details: String?) async throws -> OrderDispute {
        let response: OrderDisputeResponse = try await apiService.request(
            endpoint: "/orders/\(id)/dispute",
            method: "POST",
            body: try JSONEncoder().encode([
                "reason": reason,
                "details": details
            ])
        )
        return response.data
    }
    
    func getOrderDisputes(page: Int, limit: Int) async throws -> ([OrderDispute], ListMetadata) {
        let response: OrderDisputeListResponse = try await apiService.request(
            endpoint: "/orders/disputes",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
}

// MARK: - Cache Types
private class CachedOrder {
    let order: Order
    let timestamp: Date
    
    init(order: Order, timestamp: Date) {
        self.order = order
        self.timestamp = timestamp
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

struct OrderTrackingResponse: Codable {
    let success: Bool
    let data: OrderTracking
    let message: String?
}

struct OrderDisputeResponse: Codable {
    let success: Bool
    let data: OrderDispute
    let message: String?
}

struct OrderDisputeListResponse: Codable {
    let success: Bool
    let data: [OrderDispute]
    let message: String?
    let metadata: ListMetadata
}

// MARK: - Errors
enum OrderError: LocalizedError {
    case invalidOrder
    case invalidStatus
    case orderNotFound
    case orderCancellationFailed
    case ratingFailed
    case disputeCreationFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidOrder:
            return "Invalid order"
        case .invalidStatus:
            return "Invalid order status"
        case .orderNotFound:
            return "Order not found"
        case .orderCancellationFailed:
            return "Failed to cancel order"
        case .ratingFailed:
            return "Failed to rate order"
        case .disputeCreationFailed:
            return "Failed to create order dispute"
        }
    }
} 