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
    
    // Added property for icon name used in UI
    var iconName: String {
        // Default icon mapping based on category name
        switch name.lowercased() {
        case let n where n.contains("music"):
            return "music.note"
        case let n where n.contains("sport"):
            return "sportscourt"
        case let n where n.contains("food"):
            return "fork.knife"
        case let n where n.contains("art"):
            return "paintpalette"
        case let n where n.contains("tech"):
            return "laptopcomputer"
        case let n where n.contains("business"):
            return "briefcase"
        case let n where n.contains("education"):
            return "book"
        case let n where n.contains("health"):
            return "heart"
        case let n where n.contains("travel"):
            return "airplane"
        default:
            return "star"
        }
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
    let metadata: ListMetadata
} 