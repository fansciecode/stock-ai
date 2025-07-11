import SwiftUI

struct EventsView: View {
    @StateObject private var viewModel = EventsViewModel()
    @State private var showingCreateEvent = false
    @State private var showingFilters = false
    @State private var searchText = ""
    @State private var selectedCategory: EventCategory?
    @State private var showingEventDetail = false
    @State private var selectedEvent: Event?

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and filter bar
                VStack(spacing: 12) {
                    // Search bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.secondary)

                        TextField("Search events...", text: $searchText)
                            .textFieldStyle(PlainTextFieldStyle())

                        if !searchText.isEmpty {
                            Button(action: {
                                searchText = ""
                            }) {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.secondary)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)

                    // Filter and sort buttons
                    HStack {
                        Button(action: {
                            showingFilters = true
                        }) {
                            HStack {
                                Image(systemName: "line.3.horizontal.decrease.circle")
                                Text("Filters")
                            }
                            .font(.subheadline)
                            .foregroundColor(.blue)
                        }

                        Spacer()

                        Menu {
                            Button("Date") {
                                viewModel.sortBy = .date
                            }
                            Button("Price") {
                                viewModel.sortBy = .price
                            }
                            Button("Popularity") {
                                viewModel.sortBy = .popularity
                            }
                            Button("Distance") {
                                viewModel.sortBy = .distance
                            }
                        } label: {
                            HStack {
                                Image(systemName: "arrow.up.arrow.down")
                                Text("Sort")
                            }
                            .font(.subheadline)
                            .foregroundColor(.blue)
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.top, 8)

                // Category filter
                if !viewModel.categories.isEmpty {
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            // All categories button
                            Button(action: {
                                selectedCategory = nil
                                viewModel.filterByCategory(nil)
                            }) {
                                Text("All")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        selectedCategory == nil ? Color.blue : Color(.systemGray6)
                                    )
                                    .foregroundColor(
                                        selectedCategory == nil ? .white : .primary
                                    )
                                    .cornerRadius(20)
                            }

                            ForEach(viewModel.categories) { category in
                                Button(action: {
                                    selectedCategory = category
                                    viewModel.filterByCategory(category.id)
                                }) {
                                    HStack {
                                        if !category.icon.isEmpty {
                                            Text(category.icon)
                                                .font(.caption)
                                        }
                                        Text(category.name)
                                            .font(.subheadline)
                                            .fontWeight(.medium)
                                    }
                                    .padding(.horizontal, 16)
                                    .padding(.vertical, 8)
                                    .background(
                                        selectedCategory?.id == category.id ? Color.blue : Color(.systemGray6)
                                    )
                                    .foregroundColor(
                                        selectedCategory?.id == category.id ? .white : .primary
                                    )
                                    .cornerRadius(20)
                                }
                            }
                        }
                        .padding(.horizontal, 16)
                    }
                    .padding(.vertical, 8)
                }

                // Content
                if viewModel.isLoading && viewModel.events.isEmpty {
                    VStack {
                        Spacer()
                        ProgressView()
                            .scaleEffect(1.2)
                        Text("Loading events...")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                            .padding(.top, 8)
                        Spacer()
                    }
                } else if viewModel.events.isEmpty {
                    VStack {
                        Spacer()
                        Image(systemName: "calendar.badge.exclamationmark")
                            .font(.system(size: 48))
                            .foregroundColor(.secondary)
                        Text("No events found")
                            .font(.headline)
                            .padding(.top, 8)
                        Text("Try adjusting your search or filters")
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        Spacer()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.events) { event in
                                EventCard(event: event)
                                    .onTapGesture {
                                        selectedEvent = event
                                        showingEventDetail = true
                                    }
                                    .onAppear {
                                        if event.id == viewModel.events.last?.id {
                                            Task {
                                                await viewModel.loadMoreEvents()
                                            }
                                        }
                                    }
                            }

                            if viewModel.isLoadingMore {
                                HStack {
                                    Spacer()
                                    ProgressView()
                                        .scaleEffect(0.8)
                                    Text("Loading more...")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                        .padding(.leading, 8)
                                    Spacer()
                                }
                                .padding(.vertical, 8)
                            }
                        }
                        .padding(.horizontal, 16)
                        .padding(.top, 8)
                    }
                    .refreshable {
                        await viewModel.refreshEvents()
                    }
                }
            }
            .navigationTitle("Events")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(action: {
                        showingCreateEvent = true
                    }) {
                        Image(systemName: "plus")
                            .font(.title2)
                            .foregroundColor(.blue)
                    }
                }
            }
        }
        .sheet(isPresented: $showingCreateEvent) {
            CreateEventView()
        }
        .sheet(isPresented: $showingFilters) {
            EventFiltersView(
                filters: $viewModel.filters,
                onApply: {
                    Task {
                        await viewModel.applyFilters()
                    }
                }
            )
        }
        .sheet(isPresented: $showingEventDetail) {
            if let event = selectedEvent {
                EventDetailView(event: event)
            }
        }
        .onAppear {
            Task {
                await viewModel.loadEvents()
                await viewModel.loadCategories()
            }
        }
        .onChange(of: searchText) { newValue in
            viewModel.searchText = newValue
            Task {
                await viewModel.searchEvents()
            }
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK") {}
        } message: {
            Text(viewModel.errorMessage)
        }
    }
}

// MARK: - Event Card
struct EventCard: View {
    let event: Event

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Event image
            AsyncImage(url: URL(string: event.imageUrl ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "photo")
                            .font(.title)
                            .foregroundColor(.secondary)
                    )
            }
            .frame(height: 200)
            .clipped()
            .overlay(
                VStack {
                    HStack {
                        if event.isFeatured {
                            Text("Featured")
                                .font(.caption)
                                .fontWeight(.medium)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.orange)
                                .foregroundColor(.white)
                                .cornerRadius(4)
                        }

                        Spacer()

                        Button(action: {
                            // Handle favorite
                        }) {
                            Image(systemName: "heart")
                                .font(.title2)
                                .foregroundColor(.white)
                                .padding(8)
                                .background(Color.black.opacity(0.3))
                                .cornerRadius(20)
                        }
                    }
                    .padding(.top, 12)
                    .padding(.horizontal, 12)

                    Spacer()

                    HStack {
                        if event.price > 0 {
                            Text("₹\(Int(event.price))")
                                .font(.headline)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.green)
                                .foregroundColor(.white)
                                .cornerRadius(4)
                        } else {
                            Text("Free")
                                .font(.headline)
                                .fontWeight(.bold)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(4)
                        }

                        Spacer()
                    }
                    .padding(.bottom, 12)
                    .padding(.horizontal, 12)
                }
            )

            // Event details
            VStack(alignment: .leading, spacing: 8) {
                Text(event.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                Text(event.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(3)

                HStack {
                    Label(event.dateString, systemImage: "calendar")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Label(event.location?.city ?? "Unknown", systemImage: "location")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    // Event status
                    Text(event.status.rawValue)
                        .font(.caption)
                        .fontWeight(.medium)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(statusColor(for: event.status))
                        .foregroundColor(.white)
                        .cornerRadius(4)

                    Spacer()

                    // Attendees
                    if event.maxAttendees > 0 {
                        HStack {
                            Image(systemName: "person.2")
                                .font(.caption)
                                .foregroundColor(.secondary)
                            Text("\(event.currentAttendees)/\(event.maxAttendees)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
            }
            .padding(16)
        }
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }

    private func statusColor(for status: EventStatus) -> Color {
        switch status {
        case .upcoming:
            return .blue
        case .ongoing:
            return .green
        case .completed:
            return .gray
        case .cancelled:
            return .red
        case .draft:
            return .orange
        }
    }
}

// MARK: - Event Filters View
struct EventFiltersView: View {
    @Binding var filters: EventFilter
    let onApply: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Price range
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Price Range")
                            .font(.headline)

                        if let priceRange = filters.priceRange {
                            HStack {
                                Text("₹\(Int(priceRange.min))")
                                Spacer()
                                Text("₹\(Int(priceRange.max))")
                            }
                            .font(.subheadline)
                            .foregroundColor(.secondary)
                        }

                        // Price range slider would go here
                        // This is a simplified version
                        HStack {
                            Button("Free") {
                                filters.priceRange = PriceRange(min: 0, max: 0)
                            }
                            .buttonStyle(.bordered)

                            Button("Paid") {
                                filters.priceRange = PriceRange(min: 1, max: 10000)
                            }
                            .buttonStyle(.bordered)

                            Button("All") {
                                filters.priceRange = nil
                            }
                            .buttonStyle(.bordered)
                        }
                    }

                    // Event types
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Event Types")
                            .font(.headline)

                        LazyVGrid(columns: Array(repeating: GridItem(.flexible()), count: 2), spacing: 8) {
                            ForEach(EventType.allCases, id: \.self) { type in
                                Button(action: {
                                    if filters.eventTypes.contains(type) {
                                        filters.eventTypes.removeAll { $0 == type }
                                    } else {
                                        filters.eventTypes.append(type)
                                    }
                                }) {
                                    HStack {
                                        Image(systemName: filters.eventTypes.contains(type) ? "checkmark.square" : "square")
                                        Text(type.rawValue)
                                            .font(.subheadline)
                                        Spacer()
                                    }
                                    .foregroundColor(filters.eventTypes.contains(type) ? .blue : .primary)
                                }
                                .buttonStyle(.plain)
                            }
                        }
                    }

                    // Date range
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Date Range")
                            .font(.headline)

                        HStack {
                            Button("Today") {
                                let today = Date()
                                filters.dateRange = DateRange(
                                    startDate: ISO8601DateFormatter().string(from: today),
                                    endDate: ISO8601DateFormatter().string(from: today)
                                )
                            }
                            .buttonStyle(.bordered)

                            Button("This Week") {
                                let today = Date()
                                let weekFromNow = Calendar.current.date(byAdding: .day, value: 7, to: today) ?? today
                                filters.dateRange = DateRange(
                                    startDate: ISO8601DateFormatter().string(from: today),
                                    endDate: ISO8601DateFormatter().string(from: weekFromNow)
                                )
                            }
                            .buttonStyle(.bordered)

                            Button("This Month") {
                                let today = Date()
                                let monthFromNow = Calendar.current.date(byAdding: .month, value: 1, to: today) ?? today
                                filters.dateRange = DateRange(
                                    startDate: ISO8601DateFormatter().string(from: today),
                                    endDate: ISO8601DateFormatter().string(from: monthFromNow)
                                )
                            }
                            .buttonStyle(.bordered)
                        }
                    }
                }
                .padding()
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
                        onApply()
                        dismiss()
                    }
                }
            }
        }
    }
}

#Preview {
    EventsView()
}
