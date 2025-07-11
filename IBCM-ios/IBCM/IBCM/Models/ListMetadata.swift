import Foundation

struct ListMetadata: Codable {
    let total: Int
    let page: Int
    let limit: Int
    let totalPages: Int
    
    enum CodingKeys: String, CodingKey {
        case total, page, limit
        case totalPages = "total_pages"
    }
} 