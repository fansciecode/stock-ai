//
//  ExternalEventDetailView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import MapKit

struct ExternalEventDetailView: View {
    let event: ExternalEvent
    let onRegister: () -> Void
    @Environment(\.dismiss) private var dismiss
    @State private var showingShareSheet = false
    @State private var showingMapView = false
    @State private var region = MKCoordinateRegion()

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Event Image
                    AsyncImage(url: URL(string: event.imageUrl ?? "")) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    } placeholder: {
                        Rectangle()
                            .fill(Color(.systemGray5))
                            .overlay(
                                VStack {
                                    Image(systemName: "photo")
                                        .font(.system(size: 40))
                                        .foregroundColor(.gray)
                                    Text("No Image Available")
                                        .font(.caption)
                                        .foregroundColor(.gray)
                                }
                            )
                    }
                    .frame(height: 250)
                    .clipped()
                    .cornerRadius(12)
                    .padding(.horizontal)

                    VStack(alignment: .leading, spacing: 16) {
                        // Event Header
                        VStack(alignment: .leading, spacing: 8) {
                            // Category Badge
                            HStack {
                                Text(event.category.capitalized)
                                    .font(.caption)
                                    .fontWeight(.medium)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.blue.opacity(0.2))
                                    .foregroundColor(.blue)
                                    .cornerRadius(6)

                                Spacer()

                                Text("External Event")
                                    .font(.caption2)
                                    .padding(.horizontal, 6)
                                    .padding(.vertical, 2)
                                    .background(Color.orange.opacity(0.2))
                                    .foregroundColor(.orange)
                                    .cornerRadius(4)
                            }

                            // Title
                            Text(event.title)
                                .font(.title2)
                                .fontWeight(.bold)
                                .fixedSize(horizontal: false, vertical: true)

                            // Organizer
                            Text("Organized by \(event.organizer)")
                                .font(.subheadline)
                                .foregroundColor(.secondary)
                        }

                        // Description
                        Text(event.description)
                            .font(.body)
                            .lineSpacing(4)
                            .fixedSize(horizontal: false, vertical: true)

                        Divider()

                        // Event Details
                        VStack(spacing: 16) {
                            // Date & Time
                            DetailRow(
                                icon: "calendar",
                                iconColor: .blue,
                                title: "Date & Time",
                                value: event.formattedDate,
                                subtitle: "All day event"
                            )

                            // Location
                            if let location = event.location {
                                DetailRow(
                                    icon: "location",
                                    iconColor: .red,
                                    title: "Location",
                                    value: location.address,
                                    subtitle: location.venue,
                                    actionIcon: "map",
                                    action: {
                                        showingMapView = true
                                    }
                                )
                            }

                            // Price
                            DetailRow(
                                icon: "dollarsign.circle",
                                iconColor: .green,
                                title: "Price",
                                value: event.formattedPrice,
                                subtitle: event.price == 0 ? "No cost to attend" : "Per ticket"
                            )

                            // Source
                            DetailRow(
                                icon: "link",
                                iconColor: .purple,
                                title: "Event Source",
                                value: event.source.capitalized,
                                subtitle: "External platform"
                            )
                        }

                        Divider()

                        // Action Buttons
                        VStack(spacing: 12) {
                            // Register Button
                            Button(action: onRegister) {
                                HStack {
                                    Image(systemName: "person.badge.plus")
                                    Text(event.price > 0 ? "Register & Pay" : "Register (Free)")
                                        .fontWeight(.semibold)
                                }
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                            }

                            // Secondary Actions
                            HStack(spacing: 12) {
                                // Share Button
                                Button {
                                    showingShareSheet = true
                                } label: {
                                    HStack {
                                        Image(systemName: "square.and.arrow.up")
                                        Text("Share")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .foregroundColor(.primary)
                                    .cornerRadius(12)
                                }

                                // Save Button
                                Button {
                                    // TODO: Implement save functionality
                                } label: {
                                    HStack {
                                        Image(systemName: "bookmark")
                                        Text("Save")
                                    }
                                    .frame(maxWidth: .infinity)
                                    .padding()
                                    .background(Color(.systemGray6))
                                    .foregroundColor(.primary)
                                    .cornerRadius(12)
                                }
                            }
                        }

                        // Event Information Footer
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Event Information")
                                .font(.headline)
                                .fontWeight(.semibold)

                            Text("This is an external event hosted on \(event.source.capitalized). Registration and payment will be handled through their platform.")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .padding()
                                .background(Color(.systemGray6))
                                .cornerRadius(8)
                        }
                    }
                    .padding(.horizontal)
                    .padding(.bottom, 20)
                }
            }
            .navigationTitle("Event Details")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button {
                        showingShareSheet = true
                    } label: {
                        Image(systemName: "square.and.arrow.up")
                    }
                }
            }
            .sheet(isPresented: $showingShareSheet) {
                if let url = URL(string: "https://ibcm.app/external-events/\(event.id)") {
                    ActivityViewController(activityItems: [
                        event.title,
                        event.description,
                        url
                    ])
                }
            }
            .sheet(isPresented: $showingMapView) {
                if let location = event.location {
                    MapView(
                        location: location,
                        eventTitle: event.title
                    )
                }
            }
        }
        .onAppear {
            setupMapRegion()
        }
    }

    private func setupMapRegion() {
        if let location = event.location,
           let latitude = location.latitude,
           let longitude = location.longitude {
            region = MKCoordinateRegion(
                center: CLLocationCoordinate2D(latitude: latitude, longitude: longitude),
                span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
            )
        }
    }
}

struct DetailRow: View {
    let icon: String
    let iconColor: Color
    let title: String
    let value: String
    let subtitle: String?
    let actionIcon: String?
    let action: (() -> Void)?

    init(
        icon: String,
        iconColor: Color,
        title: String,
        value: String,
        subtitle: String? = nil,
        actionIcon: String? = nil,
        action: (() -> Void)? = nil
    ) {
        self.icon = icon
        self.iconColor = iconColor
        self.title = title
        self.value = value
        self.subtitle = subtitle
        self.actionIcon = actionIcon
        self.action = action
    }

    var body: some View {
        HStack(alignment: .top, spacing: 12) {
            Image(systemName: icon)
                .foregroundColor(iconColor)
                .frame(width: 24, height: 24)
                .background(iconColor.opacity(0.1))
                .cornerRadius(6)

            VStack(alignment: .leading, spacing: 2) {
                Text(title)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .textCase(.uppercase)
                    .tracking(0.5)

                Text(value)
                    .font(.body)
                    .fontWeight(.medium)

                if let subtitle = subtitle {
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            Spacer()

            if let actionIcon = actionIcon, let action = action {
                Button(action: action) {
                    Image(systemName: actionIcon)
                        .foregroundColor(.blue)
                        .padding(8)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }
            }
        }
    }
}

struct MapView: View {
    let location: EventLocation
    let eventTitle: String
    @Environment(\.dismiss) private var dismiss
    @State private var region: MKCoordinateRegion

    init(location: EventLocation, eventTitle: String) {
        self.location = location
        self.eventTitle = eventTitle

        let coordinate = CLLocationCoordinate2D(
            latitude: location.latitude ?? 0,
            longitude: location.longitude ?? 0
        )

        self._region = State(initialValue: MKCoordinateRegion(
            center: coordinate,
            span: MKCoordinateSpan(latitudeDelta: 0.01, longitudeDelta: 0.01)
        ))
    }

    var body: some View {
        NavigationView {
            Map(coordinateRegion: $region, annotationItems: [LocationPin(location: location, title: eventTitle)]) { pin in
                MapMarker(coordinate: pin.coordinate, tint: .red)
            }
            .navigationTitle("Event Location")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Close") {
                        dismiss()
                    }
                }

                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Directions") {
                        openDirections()
                    }
                }
            }
        }
    }

    private func openDirections() {
        guard let latitude = location.latitude,
              let longitude = location.longitude else { return }

        let coordinate = CLLocationCoordinate2D(latitude: latitude, longitude: longitude)
        let placemark = MKPlacemark(coordinate: coordinate)
        let mapItem = MKMapItem(placemark: placemark)
        mapItem.name = eventTitle

        mapItem.openInMaps(launchOptions: [
            MKLaunchOptionsDirectionsModeKey: MKLaunchOptionsDirectionsModeDriving
        ])
    }
}

struct LocationPin: Identifiable {
    let id = UUID()
    let coordinate: CLLocationCoordinate2D
    let title: String

    init(location: EventLocation, title: String) {
        self.coordinate = CLLocationCoordinate2D(
            latitude: location.latitude ?? 0,
            longitude: location.longitude ?? 0
        )
        self.title = title
    }
}

struct ActivityViewController: UIViewControllerRepresentable {
    let activityItems: [Any]

    func makeUIViewController(context: Context) -> UIActivityViewController {
        let controller = UIActivityViewController(
            activityItems: activityItems,
            applicationActivities: nil
        )
        return controller
    }

    func updateUIViewController(_ uiViewController: UIActivityViewController, context: Context) {}
}

// MARK: - Preview
struct ExternalEventDetailView_Previews: PreviewProvider {
    static var previews: some View {
        ExternalEventDetailView(
            event: ExternalEvent(
                id: "preview",
                title: "Sample External Event",
                description: "This is a preview of an external event with detailed information and various features.",
                category: "technology",
                date: "2024-07-15",
                location: EventLocation(
                    address: "123 Main St, San Francisco, CA",
                    city: "San Francisco",
                    state: "CA",
                    country: "USA",
                    latitude: 37.7749,
                    longitude: -122.4194,
                    name: "Convention Center",
                    placeId: "sample",
                    venue: "Main Hall"
                ),
                latitude: 37.7749,
                longitude: -122.4194,
                imageUrl: "https://images.unsplash.com/photo-1540575467063-178a50c2df87?w=800",
                price: 99.99,
                organizer: "Sample Organizer",
                source: "eventbrite",
                externalId: "sample123"
            )
        ) {
            print("Register tapped")
        }
    }
}
