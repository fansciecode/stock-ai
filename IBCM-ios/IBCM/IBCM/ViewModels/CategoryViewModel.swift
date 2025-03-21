import Foundation

@MainActor
class CategoryViewModel: ObservableObject {
    @Published var categories: [Category] = []
    @Published var selectedCategory: Category?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var searchQuery = ""
    
    private let apiService: APIService
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        Task {
            await loadCategories()
        }
    }
    
    func loadCategories() async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: CategoryListResponse = try await apiService.request(
                endpoint: "/categories",
                method: "GET"
            )
            categories = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func loadSubcategories(for categoryId: String) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: CategoryListResponse = try await apiService.request(
                endpoint: "/categories/\(categoryId)/subcategories",
                method: "GET"
            )
            
            if let index = categories.firstIndex(where: { $0.id == categoryId }) {
                categories[index].subcategories = response.data
            }
            
            if selectedCategory?.id == categoryId {
                selectedCategory?.subcategories = response.data
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func searchCategories() async {
        guard !searchQuery.isEmpty else {
            await loadCategories()
            return
        }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: CategoryListResponse = try await apiService.request(
                endpoint: "/categories/search",
                method: "GET",
                queryItems: [URLQueryItem(name: "query", value: searchQuery)]
            )
            categories = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    var filteredCategories: [Category] {
        guard !searchQuery.isEmpty else { return categories }
        return categories.filter { category in
            category.name.localizedCaseInsensitiveContains(searchQuery)
        }
    }
    
    func selectCategory(_ category: Category) {
        selectedCategory = category
        if category.subcategories == nil {
            Task {
                await loadSubcategories(for: category.id)
            }
        }
    }
} 