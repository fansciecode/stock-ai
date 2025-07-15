import Foundation
import Combine

class CategoryService {
    // API endpoints
    private let categoriesEndpoint = "/api/categories"
    
    // MARK: - Category Methods
    
    func getCategories() -> AnyPublisher<[Category], Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<[Category], Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
                promise(.success(self.generateMockCategories()))
            }
        }.eraseToAnyPublisher()
    }
    
    func getCategoryById(categoryId: String) -> AnyPublisher<Category, Error> {
        // In a real app, this would make an API call
        // For now, we'll return mock data
        return Future<Category, Error> { promise in
            // Simulate network delay
            DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
                if let category = self.generateMockCategories().first(where: { $0.id == categoryId }) {
                    promise(.success(category))
                } else {
                    promise(.failure(NSError(
                        domain: "CategoryService",
                        code: 404,
                        userInfo: [NSLocalizedDescriptionKey: "Category not found"]
                    )))
                }
            }
        }.eraseToAnyPublisher()
    }
    
    // MARK: - Private Methods
    
    private func generateMockCategories() -> [Category] {
        return [
            Category(id: "1", name: "Music", iconName: "music.note"),
            Category(id: "2", name: "Sports", iconName: "sportscourt"),
            Category(id: "3", name: "Food", iconName: "fork.knife"),
            Category(id: "4", name: "Art", iconName: "paintpalette"),
            Category(id: "5", name: "Technology", iconName: "laptopcomputer"),
            Category(id: "6", name: "Business", iconName: "briefcase"),
            Category(id: "7", name: "Education", iconName: "book"),
            Category(id: "8", name: "Health", iconName: "heart"),
            Category(id: "9", name: "Travel", iconName: "airplane"),
            Category(id: "10", name: "Entertainment", iconName: "film")
        ]
    }
} 