import Foundation

@MainActor
class OrderViewModel: ObservableObject {
    @Published var orders: [Order] = []
    @Published var selectedOrder: Order?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var currentPage = 1
    @Published var hasMorePages = true
    
    private let apiService: APIService
    private let limit = 20
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
    }
    
    func loadOrders(refresh: Bool = false) async {
        if refresh {
            currentPage = 1
            hasMorePages = true
        }
        
        guard hasMorePages else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: OrderListResponse = try await apiService.request(
                endpoint: "/orders",
                method: "GET",
                queryItems: [
                    URLQueryItem(name: "page", value: "\(currentPage)"),
                    URLQueryItem(name: "limit", value: "\(limit)")
                ]
            )
            
            if refresh {
                orders = response.data
            } else {
                orders.append(contentsOf: response.data)
            }
            
            hasMorePages = response.data.count >= limit
            if hasMorePages {
                currentPage += 1
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func loadOrderDetails(orderId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: OrderResponse = try await apiService.request(
                endpoint: "/orders/\(orderId)",
                method: "GET"
            )
            selectedOrder = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func cancelOrder(orderId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: OrderResponse = try await apiService.request(
                endpoint: "/orders/\(orderId)/cancel",
                method: "POST"
            )
            
            if let index = orders.firstIndex(where: { $0.id == orderId }) {
                orders[index] = response.data
            }
            selectedOrder = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func requestRefund(orderId: String, reason: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: OrderResponse = try await apiService.request(
                endpoint: "/orders/\(orderId)/refund",
                method: "POST",
                body: try JSONEncoder().encode(["reason": reason])
            )
            
            if let index = orders.firstIndex(where: { $0.id == orderId }) {
                orders[index] = response.data
            }
            selectedOrder = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
} 