import SwiftUI
import CoreLocation
import MapKit

struct HomeView: View {
    @StateObject private var viewModel = HomeViewModel()
    @State private var showMapView = false
    @State private var searchText = ""
    @StateObject private var aiViewModel = AIViewModel()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 16) {
                // Search Bar
                SearchBar(text: $searchText, onSearch: {
                    viewModel.searchEvents(query: searchText)
                })
                
                // View Toggle
                HStack {
                    Text("Events")
                        .font(.title2)
                        .fontWeight(.bold)
                    
                    Spacer()
                    
                    Button(action: {
                        withAnimation {
                            showMapView.toggle()
                        }
                    }) {
                        HStack {
                            Image(systemName: showMapView ? "list.bullet" : "map")
                                .foregroundColor(.blue)
                            Text(showMapView ? "List View" : "Map View")
                                .foregroundColor(.blue)
                        }
                    }
                }
                .padding(.horizontal)
                
                // Categories
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 16) {
                        ForEach(viewModel.categories) { category in
                            CategoryItem(category: category)
                                .onTapGesture {
                                    viewModel.selectCategory(category: category)
                                }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Quick Actions
                HStack(spacing: 20) {
                    QuickActionButton(icon: "plus.circle.fill", title: "Create Event") {
                        viewModel.navigateToCreateEvent()
                    }
                    
                    QuickActionButton(icon: "calendar", title: "My Events") {
                        viewModel.navigateToMyEvents()
                    }
                    
                    QuickActionButton(icon: "ticket", title: "Tickets") {
                        viewModel.navigateToTickets()
                    }
                    
                    QuickActionButton(icon: "heart.fill", title: "Favorites") {
                        viewModel.navigateToFavorites()
                    }
                }
                .padding(.horizontal)
                
                // Recommended for You
                Section(header: Text("Recommended for You")) {
                    if aiViewModel.isLoading {
                        ProgressView()
                            .frame(maxWidth: .infinity, alignment: .center)
                    } else if aiViewModel.recommendations.isEmpty {
                        Text("No recommendations available")
                            .frame(maxWidth: .infinity, alignment: .center)
                            .foregroundColor(.secondary)
                    } else {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack(spacing: 16) {
                                ForEach(aiViewModel.recommendations) { item in
                                    RecommendationCard(item: item)
                                        .frame(width: 200, height: 240)
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                
                // Events View (Map or List)
                if showMapView {
                    MapView(events: viewModel.nearbyEvents)
                        .cornerRadius(12)
                        .padding(.horizontal)
                        .frame(height: 300)
                } else {
                    // List View
                    List {
                        Section(header: Text("Nearby Events")) {
                            ForEach(viewModel.nearbyEvents) { event in
                                EventRow(event: event)
                                    .onTapGesture {
                                        viewModel.selectEvent(event: event)
                                    }
                            }
                        }
                        
                        Section(header: Text("Upcoming Events")) {
                            ForEach(viewModel.upcomingEvents) { event in
                                EventRow(event: event)
                                    .onTapGesture {
                                        viewModel.selectEvent(event: event)
                                    }
                            }
                        }
                    }
                    .listStyle(InsetGroupedListStyle())
                }
            }
            .navigationTitle("Home")
            .onAppear {
                viewModel.fetchCategories()
                viewModel.fetchNearbyEvents()
                viewModel.fetchUpcomingEvents()
                viewModel.requestLocationPermission()
                aiViewModel.loadPersonalizedRecommendations(userId: userViewModel.currentUser?.id ?? "")
            }
        }
    }
}

// MARK: - Supporting Views

struct SearchBar: View {
    @Binding var text: String
    var onSearch: () -> Void
    
    var body: some View {
        HStack {
            Image(systemName: "magnifyingglass")
                .foregroundColor(.gray)
            
            TextField("Search events, categories...", text: $text)
                .foregroundColor(.primary)
            
            if !text.isEmpty {
                Button(action: {
                    text = ""
                }) {
                    Image(systemName: "xmark.circle.fill")
                        .foregroundColor(.gray)
                }
            }
            
            Button(action: onSearch) {
                Text("Search")
                    .foregroundColor(.blue)
            }
        }
        .padding(8)
        .background(Color(.systemGray6))
        .cornerRadius(10)
        .padding(.horizontal)
    }
}

struct CategoryItem: View {
    let category: Category
    
    var body: some View {
        VStack {
            Image(systemName: category.iconName)
                .font(.system(size: 30))
                .foregroundColor(.white)
                .frame(width: 60, height: 60)
                .background(Color.blue)
                .cornerRadius(30)
            
            Text(category.name)
                .font(.caption)
                .foregroundColor(.primary)
        }
    }
}

struct QuickActionButton: View {
    let icon: String
    let title: String
    let action: () -> Void
    
    var body: some View {
        Button(action: action) {
            VStack {
                Image(systemName: icon)
                    .font(.system(size: 24))
                    .foregroundColor(.blue)
                
                Text(title)
                    .font(.caption)
                    .foregroundColor(.primary)
            }
        }
    }
}

struct EventRow: View {
    let event: Event
    
    var body: some View {
        HStack {
            if let imageUrl = event.imageUrl {
                AsyncImage(url: URL(string: imageUrl)) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Color.gray
                }
                .frame(width: 60, height: 60)
                .cornerRadius(8)
            } else {
                Image(systemName: "calendar")
                    .font(.system(size: 30))
                    .foregroundColor(.white)
                    .frame(width: 60, height: 60)
                    .background(Color.blue)
                    .cornerRadius(8)
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text(event.location)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
                
                Text(event.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            if let distance = event.distance {
                Text(String(format: "%.1f km", distance))
                    .font(.caption)
                    .foregroundColor(.blue)
            }
        }
        .padding(.vertical, 4)
    }
}

struct MapView: View {
    let events: [Event]
    @State private var region = MKCoordinateRegion(
        center: CLLocationCoordinate2D(latitude: 37.7749, longitude: -122.4194),
        span: MKCoordinateSpan(latitudeDelta: 0.1, longitudeDelta: 0.1)
    )
    
    var body: some View {
        Map(coordinateRegion: $region, annotationItems: events) { event in
            MapAnnotation(coordinate: event.coordinate) {
                VStack {
                    Image(systemName: "mappin.circle.fill")
                        .font(.title)
                        .foregroundColor(.red)
                    
                    Text(event.title)
                        .font(.caption)
                        .background(Color.white.opacity(0.7))
                        .cornerRadius(4)
                }
            }
        }
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
} 