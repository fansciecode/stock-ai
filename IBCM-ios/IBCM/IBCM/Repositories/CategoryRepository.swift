import Foundation

protocol CategoryRepository {
    func getCategories() async throws -> [Category]
    func getCategory(id: String) async throws -> Category
    func getCategoryItems(id: String, page: Int, limit: Int) async throws -> ([Item], ListMetadata)
    func getFeaturedCategories() async throws -> [Category]
    func searchCategories(query: String) async throws -> [Category]
    func getCategoryFilters(id: String) async throws -> [CategoryFilter]
}

class CategoryRepositoryImpl: CategoryRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedCategory>
    private var categoriesCache: CachedCategories?
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func getCategories() async throws -> [Category] {
        if let cached = categoriesCache,
           Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
            return cached.categories
        }
        
        let response: CategoryListResponse = try await apiService.request(
            endpoint: "/categories",
            method: "GET"
        )
        
        categoriesCache = CachedCategories(categories: response.data, timestamp: Date())
        return response.data
    }
    
    func getCategory(id: String) async throws -> Category {
        if let cached = cache.object(forKey: id as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 300 { // 5 minutes cache
                return cached.category
            }
        }
        
        let response: CategoryResponse = try await apiService.request(
            endpoint: "/categories/\(id)",
            method: "GET"
        )
        
        let category = response.data
        cache.setObject(CachedCategory(category: category, timestamp: Date()), forKey: category.id as NSString)
        return category
    }
    
    func getCategoryItems(id: String, page: Int, limit: Int) async throws -> ([Item], ListMetadata) {
        let response: ItemListResponse = try await apiService.request(
            endpoint: "/categories/\(id)/items",
            method: "GET",
            queryItems: [
                URLQueryItem(name: "page", value: "\(page)"),
                URLQueryItem(name: "limit", value: "\(limit)")
            ]
        )
        return (response.data, response.metadata)
    }
    
    func getFeaturedCategories() async throws -> [Category] {
        let response: CategoryListResponse = try await apiService.request(
            endpoint: "/categories/featured",
            method: "GET"
        )
        return response.data
    }
    
    func searchCategories(query: String) async throws -> [Category] {
        let response: CategoryListResponse = try await apiService.request(
            endpoint: "/categories/search",
            method: "GET",
            queryItems: [URLQueryItem(name: "query", value: query)]
        )
        return response.data
    }
    
    func getCategoryFilters(id: String) async throws -> [CategoryFilter] {
        let response: CategoryFilterResponse = try await apiService.request(
            endpoint: "/categories/\(id)/filters",
            method: "GET"
        )
        return response.data
    }
}

// MARK: - Cache Types
private class CachedCategory {
    let category: Category
    let timestamp: Date
    
    init(category: Category, timestamp: Date) {
        self.category = category
        self.timestamp = timestamp
    }
}

private class CachedCategories {
    let categories: [Category]
    let timestamp: Date
    
    init(categories: [Category], timestamp: Date) {
        self.categories = categories
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct CategoryResponse: Codable {
    let success: Bool
    let data: Category
    let message: String?
}

struct CategoryListResponse: Codable {
    let success: Bool
    let data: [Category]
    let message: String?
}

struct CategoryFilterResponse: Codable {
    let success: Bool
    let data: [CategoryFilter]
    let message: String?
}

struct ItemListResponse: Codable {
    let success: Bool
    let data: [Item]
    let message: String?
    let metadata: ListMetadata
}

// MARK: - Errors
enum CategoryError: LocalizedError {
    case invalidCategory
    case categoryNotFound
    case invalidFilter
    
    var errorDescription: String? {
        switch self {
        case .invalidCategory:
            return "Invalid category"
        case .categoryNotFound:
            return "Category not found"
        case .invalidFilter:
            return "Invalid category filter"
        }
    }
} 