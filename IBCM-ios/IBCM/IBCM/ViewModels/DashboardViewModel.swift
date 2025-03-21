import Foundation

@MainActor
class DashboardViewModel: ObservableObject {
    @Published var upcomingEvents: [Event] = []
    @Published var recentOrders: [Order] = []
    @Published var businessStats: BusinessStats = BusinessStats()
    @Published var selectedEvent: Event?
    @Published var selectedOrder: Order?
    @Published var errorMessage = ""
    @Published var showError = false
    
    func fetchDashboardData() async {
        do {
            async let eventsTask = fetchUpcomingEvents()
            async let ordersTask = fetchRecentOrders()
            async let statsTask = fetchBusinessStats()
            
            let (events, orders, stats) = try await (eventsTask, ordersTask, statsTask)
            
            self.upcomingEvents = events
            self.recentOrders = orders
            self.businessStats = stats
            
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    private func fetchUpcomingEvents() async throws -> [Event] {
        let response: EventsResponse = try await NetworkService.shared.request(
            endpoint: "/events/upcoming",
            method: "GET"
        )
        return response.data
    }
    
    private func fetchRecentOrders() async throws -> [Order] {
        let response: OrdersResponse = try await NetworkService.shared.request(
            endpoint: "/orders/recent",
            method: "GET"
        )
        return response.data
    }
    
    private func fetchBusinessStats() async throws -> BusinessStats {
        let response: BusinessStatsResponse = try await NetworkService.shared.request(
            endpoint: "/business/stats",
            method: "GET"
        )
        return response.data
    }
    
    func handleQuickAction(_ action: QuickAction) {
        switch action {
        case .createEvent:
            // Handle create event
            break
        case .addProduct:
            // Handle add product
            break
        case .viewAnalytics:
            // Handle view analytics
            break
        case .manageOrders:
            // Handle manage orders
            break
        }
    }
    
    func selectEvent(_ event: Event) {
        selectedEvent = event
    }
    
    func selectOrder(_ order: Order) {
        selectedOrder = order
    }
}

// MARK: - Models
struct Event: Identifiable, Codable {
    let id: String
    let title: String
    let description: String
    let imageURL: String
    let date: Date
    let location: String
    let price: Double
    let capacity: Int
    let creatorId: String
    
    var formattedDate: String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
}

struct Order: Identifiable, Codable {
    let id: String
    let items: [OrderItem]
    let total: Double
    let status: OrderStatus
    let createdAt: Date
    
    var formattedTotal: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: total)) ?? "$\(total)"
    }
}

struct OrderItem: Codable {
    let productId: String
    let quantity: Int
    let price: Double
}

enum OrderStatus: String, Codable {
    case pending = "Pending"
    case confirmed = "Confirmed"
    case processing = "Processing"
    case shipped = "Shipped"
    case delivered = "Delivered"
    case cancelled = "Cancelled"
    
    var color: Color {
        switch self {
        case .pending: return .orange
        case .confirmed: return .blue
        case .processing: return .purple
        case .shipped: return .yellow
        case .delivered: return .green
        case .cancelled: return .red
        }
    }
}

struct BusinessStats: Codable {
    var revenue: Double = 0
    var totalOrders: Int = 0
    var totalEvents: Int = 0
    var totalCustomers: Int = 0
    
    var formattedRevenue: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        return formatter.string(from: NSNumber(value: revenue)) ?? "$\(revenue)"
    }
}

enum QuickAction: String, CaseIterable, Identifiable {
    case createEvent = "Create Event"
    case addProduct = "Add Product"
    case viewAnalytics = "Analytics"
    case manageOrders = "Orders"
    
    var id: String { rawValue }
    
    var iconName: String {
        switch self {
        case .createEvent: return "calendar.badge.plus"
        case .addProduct: return "cube.box.fill"
        case .viewAnalytics: return "chart.bar.fill"
        case .manageOrders: return "list.bullet.rectangle"
        }
    }
    
    var title: String { rawValue }
    
    var color: Color {
        switch self {
        case .createEvent: return .blue
        case .addProduct: return .green
        case .viewAnalytics: return .purple
        case .manageOrders: return .orange
        }
    }
}

// MARK: - Response Types
struct EventsResponse: Codable {
    let success: Bool
    let data: [Event]
    let message: String?
}

struct OrdersResponse: Codable {
    let success: Bool
    let data: [Order]
    let message: String?
}

struct BusinessStatsResponse: Codable {
    let success: Bool
    let data: BusinessStats
    let message: String?
} 