import SwiftUI

struct CategoryView: View {
    @StateObject private var viewModel = CategoryViewModel()
    @Environment(\.dismiss) private var dismiss
    let onSelect: (Category) -> Void
    
    var body: some View {
        NavigationView {
            List {
                // Search Bar
                SearchBar(text: $viewModel.searchQuery)
                    .onChange(of: viewModel.searchQuery) { _ in
                        Task {
                            await viewModel.searchCategories()
                        }
                    }
                
                // Categories
                ForEach(viewModel.filteredCategories) { category in
                    CategoryRow(category: category) {
                        viewModel.selectCategory(category)
                        onSelect(category)
                        dismiss()
                    }
                }
            }
            .navigationTitle("Categories")
            .refreshable {
                await viewModel.loadCategories()
            }
            .overlay {
                if viewModel.filteredCategories.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView(
                        "No Categories Found",
                        systemImage: "list.bullet",
                        description: Text(viewModel.searchQuery.isEmpty ? "No categories available" : "No categories match your search")
                    )
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct CategoryRow: View {
    let category: Category
    let onSelect: () -> Void
    
    var body: some View {
        Button(action: onSelect) {
            HStack {
                if let imageUrl = category.imageUrl {
                    AsyncImage(url: URL(string: imageUrl)) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Color.gray.opacity(0.2)
                    }
                    .frame(width: 40, height: 40)
                    .cornerRadius(8)
                }
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(category.name)
                        .font(.headline)
                    if let description = category.description {
                        Text(description)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
                
                Spacer()
                
                if category.subcategories != nil {
                    Image(systemName: "chevron.right")
                        .foregroundColor(.secondary)
                        .font(.caption)
                }
            }
        }
    }
}

struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.secondary)
            
            TextField("Search categories", text: $text)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.secondary)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

#Preview {
    CategoryView { _ in }
} 