import SwiftUI

struct SearchView: View {
    @StateObject private var viewModel = SearchViewModel()
    @State private var showFilters = false
    @StateObject private var aiViewModel = AIViewModel()
    @State private var useAISearch = true
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                SearchBar(
                    text: $viewModel.searchQuery,
                    placeholder: "Search events, users, businesses..."
                )
                .padding()
                
                // Content
                if viewModel.searchQuery.isEmpty {
                    SearchHomeView(viewModel: viewModel)
                } else {
                    SearchResultsView(viewModel: viewModel)
                }
            }
            .navigationTitle("Search")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                SearchFiltersView(viewModel: viewModel)
            }
            .sheet(isPresented: $viewModel.showLocationPicker) {
                LocationPickerView(onLocationSelected: { city in
                    viewModel.updateLocationByCity(city)
                })
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
    }
}

struct SearchHomeView: View {
    @ObservedObject var viewModel: SearchViewModel
    
    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Recent Searches
                if !viewModel.recentSearches.isEmpty {
                    Section(header: SectionHeader(title: "Recent Searches")) {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.recentSearches) { search in
                                Button {
                                    viewModel.searchQuery = search.query
                                    if let filters = search.filters {
                                        viewModel.filters = filters
                                    }
                                } label: {
                                    HStack {
                                        Image(systemName: "clock")
                                            .foregroundColor(.gray)
                                        Text(search.query)
                                            .foregroundColor(.primary)
                                        Spacer()
                                        Text(search.timestamp.timeAgoDisplay())
                                            .font(.caption)
                                            .foregroundColor(.secondary)
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                
                // Suggestions
                if !viewModel.suggestions.isEmpty {
                    Section(header: SectionHeader(title: "Suggestions")) {
                        VStack(alignment: .leading, spacing: 12) {
                            ForEach(viewModel.suggestions) { suggestion in
                                Button {
                                    viewModel.searchQuery = suggestion.text
                                    if let category = suggestion.category {
                                        viewModel.updateCategory(category)
                                    }
                                } label: {
                                    HStack {
                                        Image(systemName: suggestionIcon(for: suggestion.type))
                                            .foregroundColor(suggestionColor(for: suggestion.type))
                                        Text(suggestion.text)
                                            .foregroundColor(.primary)
                                        if let category = suggestion.category {
                                            Text(category)
                                                .font(.caption)
                                                .foregroundColor(.secondary)
                                                .padding(.horizontal, 8)
                                                .padding(.vertical, 4)
                                                .background(Color(.systemGray6))
                                                .cornerRadius(8)
                                        }
                                    }
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .padding(.vertical)
        }
    }
    
    private func suggestionIcon(for type: SearchSuggestionType) -> String {
        switch type {
        case .recent:
            return "clock"
        case .trending:
            return "chart.line.uptrend.xyaxis"
        case .personalized:
            return "star"
        }
    }
    
    private func suggestionColor(for type: SearchSuggestionType) -> Color {
        switch type {
        case .recent:
            return .gray
        case .trending:
            return .blue
        case .personalized:
            return .orange
        }
    }
}

struct SearchResultsView: View {
    @ObservedObject var viewModel: SearchViewModel
    
    var body: some View {
        List {
            ForEach(viewModel.searchResults) { result in
                NavigationLink(destination: destinationView(for: result)) {
                    SearchResultRow(result: result)
                }
            }
            
            if viewModel.hasMore {
                ProgressView()
                    .frame(maxWidth: .infinity)
                    .onAppear {
                        Task {
                            await viewModel.loadMore()
                        }
                    }
            }
        }
        .listStyle(PlainListStyle())
        .overlay {
            if viewModel.isLoading && viewModel.searchResults.isEmpty {
                ProgressView()
            } else if viewModel.searchResults.isEmpty {
                ContentUnavailableView(
                    "No Results",
                    systemImage: "magnifyingglass",
                    description: Text("Try adjusting your search or filters")
                )
            }
        }
    }
    
    @ViewBuilder
    private func destinationView(for result: SearchResult) -> some View {
        switch result.type {
        case .event:
            EventDetailView(eventId: result.id)
        case .user:
            ProfileView(userId: result.id)
        case .business:
            BusinessDetailView(businessId: result.id)
        }
    }
}

struct SearchResultRow: View {
    let result: SearchResult
    
    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: result.imageUrl ?? "")) { image in
                image
                    .resizable()
                    .scaledToFill()
            } placeholder: {
                Image(systemName: resultIcon)
                    .resizable()
                    .foregroundColor(.gray)
            }
            .frame(width: 50, height: 50)
            .clipShape(resultType == .user ? Circle() : RoundedRectangle(cornerRadius: 8))
            
            VStack(alignment: .leading, spacing: 4) {
                Text(result.title)
                    .font(.headline)
                
                if let subtitle = result.subtitle {
                    Text(subtitle)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                }
                
                HStack {
                    if let category = result.category {
                        Text(category)
                            .font(.caption)
                            .padding(.horizontal, 8)
                            .padding(.vertical, 4)
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }
                    
                    if let date = result.date {
                        Text(date.timeAgoDisplay())
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    
                    if let distance = result.distance {
                        Text(String(format: "%.1f km", distance))
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }
            }
        }
        .padding(.vertical, 4)
    }
    
    private var resultType: SearchResultType { result.type }
    
    private var resultIcon: String {
        switch result.type {
        case .event:
            return "calendar"
        case .user:
            return "person.circle.fill"
        case .business:
            return "building.2"
        }
    }
}

struct SearchFiltersView: View {
    @Environment(\.dismiss) private var dismiss
    @ObservedObject var viewModel: SearchViewModel
    @State private var radius: Double = 10
    @State private var sortByTime = false
    @State private var selectedCategory: String?
    
    let categories = [
        "Sports",
        "Music",
        "Technology",
        "Art",
        "Food",
        "Travel",
        "Education",
        "Business",
        "Health",
        "Entertainment"
    ]
    
    var body: some View {
        NavigationView {
            Form {
                Section("Location") {
                    Button(action: { viewModel.showLocationPicker = true }) {
                        HStack {
                            Text("Select City")
                            Spacer()
                            if let city = viewModel.filters.location?.city {
                                Text(city)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    
                    Button(action: viewModel.useCurrentLocation) {
                        Text("Use Current Location")
                    }
                    
                    if viewModel.filters.location != nil {
                        Button(role: .destructive, action: viewModel.clearLocation) {
                            Text("Clear Location")
                        }
                        
                        if viewModel.filters.location?.latitude != nil {
                            VStack {
                                Text("Radius: \(Int(radius))km")
                                Slider(value: $radius, in: 1...50) { _ in
                                    if let lat = viewModel.filters.location?.latitude,
                                       let lon = viewModel.filters.location?.longitude {
                                        viewModel.updateLocation(
                                            latitude: lat,
                                            longitude: lon,
                                            radius: radius
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                
                Section("Category") {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 8) {
                            ForEach(categories, id: \.self) { category in
                                Button {
                                    if selectedCategory == category {
                                        selectedCategory = nil
                                        viewModel.updateCategory(nil)
                                    } else {
                                        selectedCategory = category
                                        viewModel.updateCategory(category)
                                    }
                                } label: {
                                    Text(category)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(selectedCategory == category ? Color.blue : Color(.systemGray6))
                                        .foregroundColor(selectedCategory == category ? .white : .primary)
                                        .cornerRadius(16)
                                }
                            }
                        }
                        .padding(.vertical, 4)
                    }
                }
                
                Section("Sort") {
                    Toggle("Sort by Time", isOn: $sortByTime)
                        .onChange(of: sortByTime) { newValue in
                            viewModel.updateSortByTime(newValue)
                        }
                }
                
                Section {
                    Button(action: {
                        viewModel.clearFilters()
                        dismiss()
                    }) {
                        Text("Clear All Filters")
                            .foregroundColor(.red)
                    }
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        dismiss()
                    }
                }
            }
        }
    }
}

struct SectionHeader: View {
    let title: String
    
    var body: some View {
        Text(title)
            .font(.headline)
            .foregroundColor(.primary)
            .padding(.horizontal)
            .padding(.vertical, 8)
    }
}

struct SearchBar: View {
    @Binding var text: String
    let placeholder: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField(placeholder, text: $text)
                .textFieldStyle(PlainTextFieldStyle())
            
            if !text.isEmpty {
                Button(action: { text = "" }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
    }
}

extension Date {
    func timeAgoDisplay() -> String {
        let formatter = RelativeDateTimeFormatter()
        formatter.unitsStyle = .short
        return formatter.localizedString(for: self, relativeTo: Date())
    }
}

#Preview {
    SearchView()
} 