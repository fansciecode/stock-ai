import Foundation

struct Category: Identifiable, Codable {
    let id: String
    let name: String
    let description: String?
    let imageUrl: String?
    let parentId: String?
    let level: Int
    let order: Int
    let isActive: Bool
    let createdAt: Date
    let updatedAt: Date
    var subcategories: [Category]?
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
    let metadata: ListMetadata
} 