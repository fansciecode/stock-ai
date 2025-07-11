import SwiftUI

struct ExploreView: View {
    @State private var searchText = ""
    @State private var selectedCategory: Category? = nil
    
    // Sample data
    private let categories = [
        Category(id: "1", name: "Food", icon: "fork.knife"),
        Category(id: "2", name: "Shopping", icon: "bag"),
        Category(id: "3", name: "Services", icon: "wrench.and.screwdriver"),
        Category(id: "4", name: "Entertainment", icon: "film"),
        Category(id: "5", name: "Health", icon: "heart"),
        Category(id: "6", name: "Education", icon: "book")
    ]
    
    private let items = [
        ExploreItem(id: "1", name: "Italian Restaurant", category: "Food", rating: 4.5, imageColor: .red),
        ExploreItem(id: "2", name: "Clothing Store", category: "Shopping", rating: 4.2, imageColor: .blue),
        ExploreItem(id: "3", name: "Plumbing Service", category: "Services", rating: 4.8, imageColor: .green),
        ExploreItem(id: "4", name: "Movie Theater", category: "Entertainment", rating: 4.0, imageColor: .purple),
        ExploreItem(id: "5", name: "Fitness Center", category: "Health", rating: 4.7, imageColor: .orange),
        ExploreItem(id: "6", name: "Language School", category: "Education", rating: 4.6, imageColor: .yellow),
        ExploreItem(id: "7", name: "Coffee Shop", category: "Food", rating: 4.3, imageColor: .brown),
        ExploreItem(id: "8", name: "Electronics Store", category: "Shopping", rating: 4.1, imageColor: .gray)
    ]
    
    var filteredItems: [ExploreItem] {
        items.filter { item in
            (selectedCategory == nil || item.category == selectedCategory?.name) &&
            (searchText.isEmpty || item.name.localizedCaseInsensitiveContains(searchText))
        }
    }
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)
                    
                    TextField("Search", text: $searchText)
                        .textFieldStyle(PlainTextFieldStyle())
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(10)
                .padding(.horizontal)
                
                // Categories
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 15) {
                        ForEach(categories) { category in
                            CategoryButton(
                                category: category,
                                isSelected: selectedCategory?.id == category.id,
                                action: {
                                    if selectedCategory?.id == category.id {
                                        selectedCategory = nil
                                    } else {
                                        selectedCategory = category
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Results
                if filteredItems.isEmpty {
                    VStack(spacing: 20) {
                        Image(systemName: "magnifyingglass")
                            .font(.system(size: 60))
                            .foregroundColor(.gray)
                        
                        Text("No results found")
                            .font(.headline)
                        
                        Text("Try adjusting your search or filters")
                            .font(.subheadline)
                            .foregroundColor(.gray)
                    }
                    .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVGrid(columns: [GridItem(.flexible()), GridItem(.flexible())], spacing: 15) {
                            ForEach(filteredItems) { item in
                                ExploreItemView(item: item)
                            }
                        }
                        .padding()
                    }
                }
            }
            .navigationTitle("Explore")
        }
    }
}

struct Category: Identifiable {
    let id: String
    let name: String
    let icon: String
}

struct ExploreItem: Identifiable {
    let id: String
    let name: String
    let category: String
    let rating: Double
    let imageColor: Color
}

struct CategoryButton: View {
    let category: Category
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack(spacing: 8) {
                Image(systemName: category.icon)
                    .font(.system(size: 20))
                    .foregroundColor(isSelected ? .white : .blue)
                    .frame(width: 40, height: 40)
                    .background(isSelected ? Color.blue : Color.blue.opacity(0.1))
                    .clipShape(Circle())
                
                Text(category.name)
                    .font(.caption)
                    .foregroundColor(isSelected ? .blue : .primary)
            }
        }
    }
}

struct ExploreItemView: View {
    let item: ExploreItem
    
    var body: some View {
        VStack(alignment: .leading) {
            Rectangle()
                .fill(item.imageColor)
                .frame(height: 120)
                .cornerRadius(10)
            
            Text(item.name)
                .font(.headline)
                .lineLimit(1)
            
            Text(item.category)
                .font(.caption)
                .foregroundColor(.secondary)
            
            HStack {
                ForEach(1...5, id: \.self) { index in
                    Image(systemName: index <= Int(item.rating) ? "star.fill" : "star")
                        .font(.caption)
                        .foregroundColor(.yellow)
                }
                
                Text(String(format: "%.1f", item.rating))
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(10)
        .background(Color.white)
        .cornerRadius(10)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
}

struct ExploreView_Previews: PreviewProvider {
    static var previews: some View {
        ExploreView()
    }
} 