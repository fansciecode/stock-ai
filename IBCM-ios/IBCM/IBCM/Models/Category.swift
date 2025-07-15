import Foundation

struct Category: Codable, Identifiable, Hashable {
    let id: String
    let name: String
    let description: String?
    let iconName: String?
    let color: String?
    let parentId: String?
    let isActive: Bool
    let createdAt: String?
    let updatedAt: String?
    
    enum CodingKeys: String, CodingKey {
        case id
        case name
        case description
        case iconName
        case color
        case parentId
        case isActive
        case createdAt
        case updatedAt
    }
    
    init(id: String, name: String, description: String? = nil, iconName: String? = nil, color: String? = nil, parentId: String? = nil, isActive: Bool = true, createdAt: String? = nil, updatedAt: String? = nil) {
        self.id = id
        self.name = name
        self.description = description
        self.iconName = iconName
        self.color = color
        self.parentId = parentId
        self.isActive = isActive
        self.createdAt = createdAt
        self.updatedAt = updatedAt
    }
    
    // Convenience initializer for creating test data
    static func mock(id: String = UUID().uuidString, name: String) -> Category {
        return Category(
            id: id,
            name: name,
            description: "Description for \(name)",
            iconName: getIconName(for: name),
            color: getColor(for: name),
            isActive: true
        )
    }
    
    static func getIconName(for category: String) -> String {
        switch category.lowercased() {
        case "music": return "music.note"
        case "sports": return "sportscourt"
        case "food": return "fork.knife"
        case "art": return "paintpalette"
        case "technology", "tech": return "laptopcomputer"
        case "business": return "briefcase"
        case "education": return "book"
        case "health": return "heart"
        case "travel": return "airplane"
        case "entertainment": return "film"
        default: return "star"
        }
    }
    
    static func getColor(for category: String) -> String {
        switch category.lowercased() {
        case "music": return "red"
        case "sports": return "blue"
        case "food": return "orange"
        case "art": return "purple"
        case "technology", "tech": return "cyan"
        case "business": return "indigo"
        case "education": return "teal"
        case "health": return "green"
        case "travel": return "yellow"
        case "entertainment": return "pink"
        default: return "gray"
        }
    }
}

// MARK: - API Response Models
struct CategoryResponse: Codable {
    let success: Bool
    let data: Category
    let message: String?
}

struct CategoriesResponse: Codable {
    let success: Bool
    let data: [Category]
    let message: String?
    let pagination: PaginationInfo?
} 