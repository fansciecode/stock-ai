import SwiftUI

struct EventSearchView: View {
    @StateObject private var viewModel = EventSearchViewModel()
    @State private var showFilters = false
    
    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search Bar
                SearchBar(text: $viewModel.searchQuery)
                    .padding()
                
                // Category Filters
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(EventType.Category.allCases, id: \.rawValue) { category in
                            CategoryButton(
                                category: category,
                                isSelected: viewModel.selectedCategory == category,
                                action: {
                                    if viewModel.selectedCategory == category {
                                        viewModel.selectedCategory = nil
                                    } else {
                                        viewModel.selectedCategory = category
                                    }
                                    Task {
                                        await viewModel.fetchEvents()
                                    }
                                }
                            )
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.vertical, 8)
                
                // Results List
                List {
                    ForEach(viewModel.searchResults) { event in
                        NavigationLink(destination: EventDetailView(eventId: event.id)) {
                            EventRowView(event: event)
                        }
                    }
                }
                .listStyle(PlainListStyle())
                .refreshable {
                    await viewModel.fetchEvents()
                }
                .overlay {
                    if viewModel.isLoading {
                        ProgressView()
                    } else if viewModel.searchResults.isEmpty {
                        ContentUnavailableView(
                            label: {
                                Label(
                                    "No Events Found",
                                    systemImage: "calendar.badge.exclamationmark"
                                )
                            },
                            description: {
                                Text("Try adjusting your search or filters")
                            }
                        )
                    }
                }
            }
            .navigationTitle("Events")
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: { showFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showFilters) {
                FilterView(
                    selectedDate: $viewModel.selectedDate,
                    selectedLocation: $viewModel.selectedLocation,
                    onApply: {
                        showFilters = false
                        Task {
                            await viewModel.fetchEvents()
                        }
                    }
                )
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage)
            }
        }
        .task {
            await viewModel.fetchEvents()
        }
    }
}

// MARK: - Search Bar
struct SearchBar: View {
    @Binding var text: String
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField("Search events...", text: $text)
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

// MARK: - Category Button
struct CategoryButton: View {
    let category: EventType.Category
    let isSelected: Bool
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            Text(category.rawValue)
                .font(.subheadline)
                .padding(.horizontal, 16)
                .padding(.vertical, 8)
                .background(isSelected ? Color.blue : Color(.systemGray6))
                .foregroundColor(isSelected ? .white : .primary)
                .cornerRadius(20)
        }
    }
}

// MARK: - Event Row View
struct EventRowView: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(event.title)
                .font(.headline)
            
            Text(event.description)
                .font(.subheadline)
                .foregroundColor(.secondary)
                .lineLimit(2)
            
            HStack {
                Label(event.category, systemImage: "tag")
                Spacer()
                Label("\(event.attendees.count)/\(event.maxAttendees)", systemImage: "person.2")
            }
            .font(.caption)
            .foregroundColor(.secondary)
            
            HStack {
                Label(event.formattedDate, systemImage: "calendar")
                Spacer()
                Label(event.formattedTime, systemImage: "clock")
            }
            .font(.caption)
            .foregroundColor(.secondary)
        }
        .padding(.vertical, 8)
    }
}

// MARK: - Filter View
struct FilterView: View {
    @Environment(\.dismiss) private var dismiss
    @Binding var selectedDate: Date?
    @Binding var selectedLocation: String?
    let onApply: () -> Void
    
    var body: some View {
        NavigationView {
            Form {
                Section("Date") {
                    if let date = selectedDate {
                        DatePicker("Selected Date", selection: .constant(date), displayedComponents: .date)
                        Button("Clear Date", role: .destructive) {
                            selectedDate = nil
                        }
                    } else {
                        Button("Select Date") {
                            selectedDate = Date()
                        }
                    }
                }
                
                Section("Location") {
                    TextField("Enter location", text: Binding(
                        get: { selectedLocation ?? "" },
                        set: { selectedLocation = $0.isEmpty ? nil : $0 }
                    ))
                }
            }
            .navigationTitle("Filters")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Reset") {
                        selectedDate = nil
                        selectedLocation = nil
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Apply") {
                        onApply()
                    }
                }
            }
        }
    }
}

#Preview {
    EventSearchView()
} 