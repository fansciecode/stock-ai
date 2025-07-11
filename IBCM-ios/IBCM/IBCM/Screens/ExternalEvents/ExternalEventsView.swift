//
//  ExternalEventsView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct ExternalEventsView: View {
    @StateObject private var viewModel = ExternalEventsViewModel()
    @State private var searchText = ""
    @State private var selectedCategory = "all"
    @State private var selectedLocation = ""
    @State private var selectedDate = Date()
    @State private var showingFilters = false
    @State private var showingEventDetail = false
    @State private var selectedEvent: ExternalEvent?
    @State private var showingRegistrationSheet = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Search and Filter Bar
                VStack(spacing: 12) {
                    // Search Bar
                    HStack {
                        Image(systemName: "magnifyingglass")
                            .foregroundColor(.gray)

                        TextField("Search external events...", text: $searchText)
                            .textFieldStyle(.plain)
                            .onSubmit {
                                viewModel.searchEvents(query: searchText)
                            }

                        if !searchText.isEmpty {
                            Button {
                                searchText = ""
                                viewModel.searchEvents(query: "")
                            } label: {
                                Image(systemName: "xmark.circle.fill")
                                    .foregroundColor(.gray)
                            }
                        }
                    }
                    .padding(.horizontal, 12)
                    .padding(.vertical, 8)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)

                    // Filter Pills
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 12) {
                            // Category Filter
                            FilterPill(
                                title: categoryDisplayName(selectedCategory),
                                icon: "tag",
                                isSelected: selectedCategory != "all"
                            ) {
                                showingFilters = true
                            }

                            // Location Filter
                            if !selectedLocation.isEmpty {
                                FilterPill(
                                    title: selectedLocation,
                                    icon: "location",
                                    isSelected: true
                                ) {
                                    selectedLocation = ""
                                    viewModel.filterByLocation("")
                                }
                            }

                            // Date Filter
                            FilterPill(
                                title: "Date",
                                icon: "calendar",
                                isSelected: !Calendar.current.isDateInToday(selectedDate)
                            ) {
                                showingFilters = true
                            }

                            // Clear All Button
                            if selectedCategory != "all" || !selectedLocation.isEmpty || !Calendar.current.isDateInToday(selectedDate) {
                                Button("Clear All") {
                                    clearAllFilters()
                                }
                                .foregroundColor(.red)
                                .font(.caption)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 4)
                                .background(Color.red.opacity(0.1))
                                .cornerRadius(6)
                            }
                        }
                        .padding(.horizontal)
                    }
                }
                .padding(.vertical, 8)
                .background(Color(.systemBackground))
                .shadow(color: .black.opacity(0.05), radius: 2, x: 0, y: 1)

                // Content Area
                if viewModel.isLoading {
                    LoadingView(message: "Loading external events...")
                } else if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage) {
                        viewModel.loadEvents()
                    }
                } else if viewModel.events.isEmpty {
                    EmptyStateView(
                        icon: "calendar.badge.plus",
                        title: "No External Events Found",
                        subtitle: "Try adjusting your search criteria or check back later for new events."
                    )
                } else {
                    // Events List
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.events) { event in
                                ExternalEventCard(event: event) {
                                    selectedEvent = event
                                    showingEventDetail = true
                                }
                            }

                            // Load More Button
                            if viewModel.canLoadMore {
                                Button("Load More Events") {
                                    viewModel.loadMoreEvents()
                                }
                                .padding()
                                .frame(maxWidth: .infinity)
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(10)
                                .padding(.horizontal)
                            }
                        }
                        .padding(.vertical)
                    }
                }
            }
            .navigationTitle("External Events")
            .navigationBarTitleDisplayMode(.large)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingFilters = true
                    } label: {
                        Image(systemName: "line.3.horizontal.decrease.circle")
                    }
                }
            }
            .sheet(isPresented: $showingFilters) {
                ExternalEventsFilterView(
                    selectedCategory: $selectedCategory,
                    selectedLocation: $selectedLocation,
                    selectedDate: $selectedDate,
                    categories: viewModel.categories
                ) { category, location, date in
                    applyFilters(category: category, location: location, date: date)
                }
            }
            .sheet(isPresented: $showingEventDetail) {
                if let event = selectedEvent {
                    ExternalEventDetailView(event: event) {
                        showingRegistrationSheet = true
                    }
                }
            }
            .sheet(isPresented: $showingRegistrationSheet) {
                if let event = selectedEvent {
                    ExternalEventRegistrationView(event: event) { success in
                        showingRegistrationSheet = false
                        if success {
                            // Handle successful registration
                            showSuccessAlert()
                        }
                    }
                }
            }
        }
        .onAppear {
            viewModel.loadInitialData()
        }
    }

    private func categoryDisplayName(_ category: String) -> String {
        switch category {
        case "all": return "All Categories"
        case "music": return "Music"
        case "tech": return "Technology"
        case "art": return "Art & Culture"
        case "food": return "Food & Drink"
        case "sports": return "Sports"
        case "business": return "Business"
        default: return category.capitalized
        }
    }

    private func clearAllFilters() {
        selectedCategory = "all"
        selectedLocation = ""
        selectedDate = Date()
        viewModel.clearFilters()
    }

    private func applyFilters(category: String, location: String, date: Date) {
        selectedCategory = category
        selectedLocation = location
        selectedDate = date

        viewModel.applyFilters(
            category: category == "all" ? nil : category,
            location: location.isEmpty ? nil : location,
            date: Calendar.current.isDateInToday(date) ? nil : date
        )
    }

    private func showSuccessAlert() {
        // Show success message for registration
        let alert = UIAlertController(
            title: "Registration Successful",
            message: "You have successfully registered for the external event.",
            preferredStyle: .alert
        )
        alert.addAction(UIAlertAction(title: "OK", style: .default))

        if let windowScene = UIApplication.shared.connectedScenes.first as? UIWindowScene,
           let window = windowScene.windows.first {
            window.rootViewController?.present(alert, animated: true)
        }
    }
}

struct FilterPill: View {
    let title: String
    let icon: String
    let isSelected: Bool
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Image(systemName: icon)
                    .font(.caption)
                Text(title)
                    .font(.caption)
                    .lineLimit(1)
            }
            .padding(.horizontal, 8)
            .padding(.vertical, 4)
            .background(isSelected ? Color.blue : Color(.systemGray5))
            .foregroundColor(isSelected ? .white : .primary)
            .cornerRadius(6)
        }
    }
}

struct ExternalEventCard: View {
    let event: ExternalEvent
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            VStack(alignment: .leading, spacing: 12) {
                // Event Image
                AsyncImage(url: URL(string: event.imageUrl ?? "")) { image in
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
                .frame(height: 160)
                .clipped()
                .cornerRadius(8)

                VStack(alignment: .leading, spacing: 8) {
                    // Event Title
                    Text(event.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(2)
                        .multilineTextAlignment(.leading)

                    // Event Description
                    Text(event.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(3)
                        .multilineTextAlignment(.leading)

                    // Event Details
                    VStack(alignment: .leading, spacing: 4) {
                        HStack {
                            Image(systemName: "calendar")
                                .foregroundColor(.blue)
                                .frame(width: 16)
                            Text(event.formattedDate)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }

                        HStack {
                            Image(systemName: "location")
                                .foregroundColor(.blue)
                                .frame(width: 16)
                            Text(event.location?.address ?? "Location TBD")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .lineLimit(1)
                        }

                        HStack {
                            Image(systemName: "dollarsign.circle")
                                .foregroundColor(.green)
                                .frame(width: 16)
                            Text(event.formattedPrice)
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Category and Organizer
                    HStack {
                        Text(event.category.capitalized)
                            .font(.caption2)
                            .padding(.horizontal, 6)
                            .padding(.vertical, 2)
                            .background(Color.blue.opacity(0.2))
                            .foregroundColor(.blue)
                            .cornerRadius(4)

                        Spacer()

                        Text("by \(event.organizer)")
                            .font(.caption2)
                            .foregroundColor(.secondary)
                    }
                }
                .padding(.horizontal, 12)
                .padding(.bottom, 12)
            }
            .background(Color(.systemBackground))
            .cornerRadius(12)
            .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
        }
        .buttonStyle(.plain)
        .padding(.horizontal)
    }
}

// MARK: - Preview
struct ExternalEventsView_Previews: PreviewProvider {
    static var previews: some View {
        ExternalEventsView()
    }
}
