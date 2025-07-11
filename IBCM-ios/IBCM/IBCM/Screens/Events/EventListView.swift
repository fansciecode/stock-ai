//
//  EventListView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct EventListView: View {
    @StateObject private var eventService = EventService.shared
    @StateObject private var categoryService = CategoryService.shared
    @StateObject private var locationManager = LocationManager.shared

    @State private var searchText = ""
    @State private var selectedCategory: Category?
    @State private var showingFilters = false
    @State private var showingCreateEvent = false
    @State private var eventFilter = EventFilter()
    @State private var viewMode: ViewMode = .grid
    @State private var isRefreshing = false
    @State private var page = 1
    @State private var hasMoreEvents = true
    @State private var selectedEvent: Event?
    @State private var showingEventDetail = false
    @State private var favorites = Set<String>()
    @State private var cancellables = Set<AnyCancellable>()

    // Search and filter states
    @State private var priceRange: ClosedRange<Double> = 0...10000
    @State private var dateRange: ClosedRange<Date>?
    @State private var selectedEventTypes: Set<EventType> = []
    @State private var showOnlineOnly = false
    @State private var showFeaturedOnly = false
    @State private var radiusFilter: Double = 10.0
    @State private var sortOption: EventFilter.SortOption = .date
    @State private var sortOrder: EventFilter.SortOrder = .asc

    enum ViewMode: String, CaseIterable {
        case grid = "grid"
        case list = "list"
        case map = "map"

        var icon: String {
            switch self {
            case .grid: return "square.grid.2x2"
            case .list: return "list.bullet"
            case .map: return "map"
            }
        }
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header with search and filters
                headerView

                // Quick filter chips
                quickFiltersView

                // Main content
                mainContentView
            }
            .navigationTitle("Events")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItemGroup(placement: .navigationBarTrailing) {
                    Button(action: { showingFilters = true }) {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                            .font(.title2)
                    }

                    Button(action: { showingCreateEvent = true }) {
                        Image(systemName: "plus")
                            .font(.title2)
                    }
                }
            }
        }
        .sheet(isPresented: $showingFilters) {
            EventFiltersView(
                filter: $eventFilter,
                priceRange: $priceRange,
                dateRange: $dateRange,
                selectedEventTypes: $selectedEventTypes,
                showOnlineOnly: $showOnlineOnly,
                showFeaturedOnly: $showFeaturedOnly,
                radiusFilter: $radiusFilter,
                sortOption: $sortOption,
                sortOrder: $sortOrder
            ) {
                applyFilters()
            }
        }
        .sheet(isPresented: $showingCreateEvent) {
            EventCreationView()
        }
        .sheet(item: $selectedEvent) { event in
            EventDetailView(event: event)
        }
        .onAppear {
            loadInitialData()
        }
        .refreshable {
            await refreshEvents()
        }
    }

    // MARK: - Header View
    private var headerView: some View {
        VStack(spacing: 12) {
            // Search bar
            HStack {
                HStack {
                    Image(systemName: "magnifyingglass")
                        .foregroundColor(.gray)

                    TextField("Search events...", text: $searchText)
                        .textFieldStyle(RoundedBorderTextFieldStyle())
                        .onSubmit {
                            searchEvents()
                        }
                }

                // View mode toggle
                Picker("View Mode", selection: $viewMode) {
                    ForEach(ViewMode.allCases, id: \.self) { mode in
                        Image(systemName: mode.icon)
                            .tag(mode)
                    }
                }
                .pickerStyle(SegmentedPickerStyle())
                .frame(width: 120)
            }
            .padding(.horizontal)

            // Location and refresh
            HStack {
                if let location = locationManager.currentLocation {
                    HStack {
                        Image(systemName: "location.fill")
                            .foregroundColor(.blue)
                        Text(locationManager.currentCity ?? "Unknown Location")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                Button(action: { refreshEvents() }) {
                    HStack {
                        Image(systemName: "arrow.clockwise")
                        Text("Refresh")
                    }
                    .font(.caption)
                    .foregroundColor(.blue)
                }
                .disabled(eventService.isLoading)
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
        .background(Color(.systemBackground))
    }

    // MARK: - Quick Filters
    private var quickFiltersView: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            HStack(spacing: 12) {
                // All Events
                FilterChip(
                    title: "All Events",
                    isSelected: selectedCategory == nil,
                    action: {
                        selectedCategory = nil
                        applyFilters()
                    }
                )

                // Category filters
                ForEach(categoryService.categories.prefix(6), id: \.id) { category in
                    FilterChip(
                        title: category.name,
                        icon: category.icon,
                        isSelected: selectedCategory?.id == category.id,
                        action: {
                            selectedCategory = selectedCategory?.id == category.id ? nil : category
                            applyFilters()
                        }
                    )
                }

                // Special filters
                FilterChip(
                    title: "Featured",
                    icon: "star.fill",
                    isSelected: showFeaturedOnly,
                    action: {
                        showFeaturedOnly.toggle()
                        applyFilters()
                    }
                )

                FilterChip(
                    title: "Online",
                    icon: "video.fill",
                    isSelected: showOnlineOnly,
                    action: {
                        showOnlineOnly.toggle()
                        applyFilters()
                    }
                )

                FilterChip(
                    title: "Free",
                    icon: "gift.fill",
                    isSelected: priceRange.upperBound == 0,
                    action: {
                        if priceRange.upperBound == 0 {
                            priceRange = 0...10000
                        } else {
                            priceRange = 0...0
                        }
                        applyFilters()
                    }
                )
            }
            .padding(.horizontal)
        }
        .padding(.vertical, 8)
    }

    // MARK: - Main Content
    private var mainContentView: some View {
        Group {
            if eventService.isLoading && eventService.events.isEmpty {
                LoadingView()
            } else if eventService.events.isEmpty {
                EmptyStateView(
                    title: "No Events Found",
                    subtitle: "Try adjusting your filters or search criteria",
                    systemImage: "calendar.badge.exclamationmark",
                    primaryAction: {
                        clearFilters()
                    },
                    primaryActionTitle: "Clear Filters"
                )
            } else {
                switch viewMode {
                case .grid:
                    gridView
                case .list:
                    listView
                case .map:
                    mapView
                }
            }
        }
    }

    // MARK: - Grid View
    private var gridView: some View {
        ScrollView {
            LazyVGrid(columns: [
                GridItem(.flexible()),
                GridItem(.flexible())
            ], spacing: 16) {
                ForEach(eventService.events) { event in
                    EventCardView(
                        event: event,
                        isFavorited: favorites.contains(event.id),
                        onTap: {
                            selectedEvent = event
                            showingEventDetail = true
                        },
                        onFavorite: {
                            toggleFavorite(event.id)
                        },
                        onShare: {
                            shareEvent(event)
                        }
                    )
                    .onAppear {
                        if event.id == eventService.events.last?.id {
                            loadMoreEvents()
                        }
                    }
                }

                if eventService.isLoading && !eventService.events.isEmpty {
                    HStack {
                        ProgressView()
                            .scaleEffect(0.8)
                        Text("Loading more...")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                    .frame(maxWidth: .infinity)
                    .gridCellColumns(2)
                }
            }
            .padding()
        }
    }

    // MARK: - List View
    private var listView: some View {
        List {
            ForEach(eventService.events) { event in
                EventListItemView(
                    event: event,
                    isFavorited: favorites.contains(event.id),
                    onTap: {
                        selectedEvent = event
                        showingEventDetail = true
                    },
                    onFavorite: {
                        toggleFavorite(event.id)
                    },
                    onShare: {
                        shareEvent(event)
                    }
                )
                .onAppear {
                    if event.id == eventService.events.last?.id {
                        loadMoreEvents()
                    }
                }
            }

            if eventService.isLoading && !eventService.events.isEmpty {
                HStack {
                    ProgressView()
                        .scaleEffect(0.8)
                    Text("Loading more...")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                .frame(maxWidth: .infinity)
            }
        }
        .listStyle(PlainListStyle())
    }

    // MARK: - Map View
    private var mapView: some View {
        EventMapView(
            events: eventService.events,
            selectedEvent: $selectedEvent,
            onEventTap: { event in
                selectedEvent = event
                showingEventDetail = true
            }
        )
    }

    // MARK: - Methods
    private func loadInitialData() {
        // Load categories first
        categoryService.loadCategories()

        // Load featured events
        eventService.getFeaturedEvents()
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)

        // Load trending events
        eventService.getTrendingEvents()
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { _ in }
            )
            .store(in: &cancellables)

        // Load main events
        loadEvents()

        // Load user favorites
        loadFavorites()
    }

    private func loadEvents() {
        page = 1
        hasMoreEvents = true

        let filter = buildEventFilter()

        eventService.getAllEvents(page: page, limit: 20, filters: filter)
            .sink(
                receiveCompletion: { completion in
                    if case .failure(let error) = completion {
                        print("Error loading events: \(error)")
                    }
                },
                receiveValue: { response in
                    if response.success, let eventsData = response.data {
                        hasMoreEvents = eventsData.hasMore
                    }
                }
            )
            .store(in: &cancellables)
    }

    private func loadMoreEvents() {
        guard hasMoreEvents && !eventService.isLoading else { return }

        page += 1
        let filter = buildEventFilter()

        eventService.getAllEvents(page: page, limit: 20, filters: filter)
            .sink(
                receiveCompletion: { _ in },
                receiveValue: { response in
                    if response.success, let eventsData = response.data {
                        hasMoreEvents = eventsData.hasMore
                    }
                }
            )
            .store(in: &cancellables)
    }

    @MainActor
    private func refreshEvents() async {
        isRefreshing = true
        defer { isRefreshing = false }

        // Refresh categories
        categoryService.loadCategories()

        // Refresh events
        loadEvents()

        // Small delay for better UX
        try? await Task.sleep(nanoseconds: 500_000_000)
    }

    private func searchEvents() {
        eventFilter.search = searchText.isEmpty ? nil : searchText
        loadEvents()
    }

    private func applyFilters() {
        eventFilter.categoryId = selectedCategory?.id
        eventFilter.minPrice = priceRange.lowerBound
        eventFilter.maxPrice = priceRange.upperBound
        eventFilter.isOnline = showOnlineOnly ? true : nil
        eventFilter.isFeatured = showFeaturedOnly ? true : nil
        eventFilter.sortBy = sortOption
        eventFilter.sortOrder = sortOrder

        if let dateRange = dateRange {
            eventFilter.startDate = dateRange.lowerBound
            eventFilter.endDate = dateRange.upperBound
        }

        if let location = locationManager.currentLocation {
            eventFilter.latitude = location.coordinate.latitude
            eventFilter.longitude = location.coordinate.longitude
            eventFilter.radius = radiusFilter
        }

        loadEvents()
    }

    private func clearFilters() {
        searchText = ""
        selectedCategory = nil
        priceRange = 0...10000
        dateRange = nil
        selectedEventTypes = []
        showOnlineOnly = false
        showFeaturedOnly = false
        radiusFilter = 10.0
        sortOption = .date
        sortOrder = .asc
        eventFilter = EventFilter()

        loadEvents()
    }

    private func buildEventFilter() -> EventFilter {
        var filter = eventFilter
        filter.search = searchText.isEmpty ? nil : searchText
        filter.categoryId = selectedCategory?.id
        filter.minPrice = priceRange.lowerBound
        filter.maxPrice = priceRange.upperBound
        filter.isOnline = showOnlineOnly ? true : nil
        filter.isFeatured = showFeaturedOnly ? true : nil

        if let dateRange = dateRange {
            filter.startDate = dateRange.lowerBound
            filter.endDate = dateRange.upperBound
        }

        if let location = locationManager.currentLocation {
            filter.latitude = location.coordinate.latitude
            filter.longitude = location.coordinate.longitude
            filter.radius = radiusFilter
        }

        return filter
    }

    private func toggleFavorite(_ eventId: String) {
        if favorites.contains(eventId) {
            favorites.remove(eventId)
        } else {
            favorites.insert(eventId)
        }

        // Save to UserDefaults
        let favoritesArray = Array(favorites)
        UserDefaults.standard.set(favoritesArray, forKey: "user_favorites")
    }

    private func loadFavorites() {
        if let favoritesArray = UserDefaults.standard.array(forKey: "user_favorites") as? [String] {
            favorites = Set(favoritesArray)
        }
    }

    private func shareEvent(_ event: Event) {
        let shareText = "Check out this event: \(event.title)"
        let shareURL = URL(string: "https://ibcm-events.com/events/\(event.id)")!

        let activityVC = UIActivityViewController(
            activityItems: [shareText, shareURL],
            applicationActivities: nil
        )

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(activityVC, animated: true)
        }
    }
}

// MARK: - Filter Chip Component
struct FilterChip: View {
    let title: String
    let icon: String?
    let isSelected: Bool
    let action: () -> Void

    init(title: String, icon: String? = nil, isSelected: Bool, action: @escaping () -> Void) {
        self.title = title
        self.icon = icon
        self.isSelected = isSelected
        self.action = action
    }

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                if let icon = icon {
                    Image(systemName: icon)
                        .font(.caption)
                }
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)
            }
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .clipShape(Capsule())
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Event Card Component
struct EventCardView: View {
    let event: Event
    let isFavorited: Bool
    let onTap: () -> Void
    let onFavorite: () -> Void
    let onShare: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 0) {
            // Event Image
            AsyncImage(url: URL(string: event.primaryImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }
            .frame(height: 120)
            .clipped()
            .overlay(alignment: .topTrailing) {
                HStack {
                    Button(action: onFavorite) {
                        Image(systemName: isFavorited ? "heart.fill" : "heart")
                            .foregroundColor(isFavorited ? .red : .white)
                            .font(.system(size: 16, weight: .medium))
                    }

                    Button(action: onShare) {
                        Image(systemName: "square.and.arrow.up")
                            .foregroundColor(.white)
                            .font(.system(size: 16, weight: .medium))
                    }
                }
                .padding(8)
            }
            .overlay(alignment: .topLeading) {
                if event.isFeatured {
                    Text("Featured")
                        .font(.caption2)
                        .fontWeight(.bold)
                        .padding(.horizontal, 6)
                        .padding(.vertical, 3)
                        .background(Color.orange)
                        .foregroundColor(.white)
                        .clipShape(Capsule())
                        .padding(8)
                }
            }

            // Event Info
            VStack(alignment: .leading, spacing: 8) {
                // Title and Type
                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(2)

                    Text(event.eventTypeIcon + " " + event.eventType.displayName)
                        .font(.caption)
                        .foregroundColor(.blue)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.1))
                        .clipShape(Capsule())
                }

                // Date and Location
                VStack(alignment: .leading, spacing: 2) {
                    HStack {
                        Image(systemName: "calendar")
                            .foregroundColor(.secondary)
                            .font(.caption)
                        Text(event.formattedStartDate)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    HStack {
                        Image(systemName: "location")
                            .foregroundColor(.secondary)
                            .font(.caption)
                        Text(event.location)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }
                }

                // Price and Attendees
                HStack {
                    Text(event.formattedPrice)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(event.price == 0 ? .green : .primary)

                    Spacer()

                    HStack {
                        Image(systemName: "person.2.fill")
                            .font(.caption)
                        Text("\(event.currentAttendees)")
                            .font(.caption)
                    }
                    .foregroundColor(.secondary)
                }
            }
            .padding(12)
        }
        .background(Color(.systemBackground))
        .clipShape(RoundedRectangle(cornerRadius: 12))
        .shadow(color: .black.opacity(0.1), radius: 2, x: 0, y: 1)
        .onTapGesture {
            onTap()
        }
    }
}

// MARK: - Event List Item Component
struct EventListItemView: View {
    let event: Event
    let isFavorited: Bool
    let onTap: () -> Void
    let onFavorite: () -> Void
    let onShare: () -> Void

    var body: some View {
        HStack(spacing: 12) {
            // Event Image
            AsyncImage(url: URL(string: event.primaryImage ?? "")) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color(.systemGray5))
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }
            .frame(width: 80, height: 80)
            .clipShape(RoundedRectangle(cornerRadius: 8))

            // Event Info
            VStack(alignment: .leading, spacing: 4) {
                // Title and Featured Badge
                HStack {
                    Text(event.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(2)

                    Spacer()

                    if event.isFeatured {
                        Image(systemName: "star.fill")
                            .foregroundColor(.orange)
                            .font(.caption)
                    }
                }

                // Event Type
                Text(event.eventTypeIcon + " " + event.eventType.displayName)
                    .font(.caption)
                    .foregroundColor(.blue)

                // Date and Location
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.secondary)
                        .font(.caption)
                    Text(event.formattedStartDate)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                HStack {
                    Image(systemName: "location")
                        .foregroundColor(.secondary)
                        .font(.caption)
                    Text(event.location)
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }

                // Price and Actions
                HStack {
                    Text(event.formattedPrice)
                        .font(.subheadline)
                        .fontWeight(.semibold)
                        .foregroundColor(event.price == 0 ? .green : .primary)

                    Spacer()

                    HStack {
                        Button(action: onFavorite) {
                            Image(systemName: isFavorited ? "heart.fill" : "heart")
                                .foregroundColor(isFavorited ? .red : .gray)
                        }

                        Button(action: onShare) {
                            Image(systemName: "square.and.arrow.up")
                                .foregroundColor(.gray)
                        }
                    }
                }
            }

            Spacer()
        }
        .padding(.vertical, 8)
        .contentShape(Rectangle())
        .onTapGesture {
            onTap()
        }
    }
}

// MARK: - Loading View
struct LoadingView: View {
    var body: some View {
        VStack(spacing: 16) {
            ProgressView()
                .scaleEffect(1.5)

            Text("Loading events...")
                .font(.headline)
                .foregroundColor(.secondary)
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
    }
}

// MARK: - Empty State View
struct EmptyStateView: View {
    let title: String
    let subtitle: String
    let systemImage: String
    let primaryAction: () -> Void
    let primaryActionTitle: String

    var body: some View {
        VStack(spacing: 24) {
            Image(systemName: systemImage)
                .font(.system(size: 60))
                .foregroundColor(.gray)

            VStack(spacing: 8) {
                Text(title)
                    .font(.title2)
                    .fontWeight(.semibold)

                Text(subtitle)
                    .font(.body)
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
            }

            Button(action: primaryAction) {
                Text(primaryActionTitle)
                    .font(.headline)
                    .foregroundColor(.white)
                    .padding(.horizontal, 24)
                    .padding(.vertical, 12)
                    .background(Color.blue)
                    .clipShape(Capsule())
            }
        }
        .frame(maxWidth: .infinity, maxHeight: .infinity)
        .padding()
    }
}

#Preview {
    EventListView()
}
