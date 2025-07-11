//
//  PackageView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct PackageView: View {
    @StateObject private var viewModel = PackageViewModel()
    @State private var selectedPackage: EventPackage?
    @State private var showingPurchaseSheet = false
    @State private var showingPackageDetails = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header Section
                VStack(alignment: .leading, spacing: 16) {
                    Text("Event Packages")
                        .font(.largeTitle)
                        .fontWeight(.bold)
                        .foregroundColor(.primary)

                    Text("Choose the perfect package for your event management needs")
                        .font(.body)
                        .foregroundColor(.secondary)
                }
                .padding(.horizontal)
                .padding(.top, 8)

                // Current Package Info
                if let currentPackage = viewModel.currentPackage {
                    CurrentPackageCard(package: currentPackage)
                        .padding(.horizontal)
                        .padding(.top, 16)
                }

                // Package List
                if viewModel.isLoading {
                    ProgressView("Loading packages...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage) {
                        viewModel.loadAvailablePackages()
                    }
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.packages) { package in
                                PackageCard(
                                    package: package,
                                    isSelected: selectedPackage?.id == package.id,
                                    isCurrent: viewModel.currentPackage?.id == package.id,
                                    onSelect: {
                                        selectedPackage = package
                                        showingPackageDetails = true
                                    },
                                    onPurchase: {
                                        selectedPackage = package
                                        showingPurchaseSheet = true
                                    }
                                )
                            }
                        }
                        .padding(.horizontal)
                        .padding(.top, 20)
                    }
                }

                Spacer()
            }
            .navigationBarHidden(true)
            .onAppear {
                viewModel.loadAvailablePackages()
            }
            .sheet(isPresented: $showingPurchaseSheet) {
                if let package = selectedPackage {
                    PurchasePackageSheet(package: package) {
                        viewModel.loadAvailablePackages()
                    }
                }
            }
            .sheet(isPresented: $showingPackageDetails) {
                if let package = selectedPackage {
                    PackageDetailsSheet(package: package) {
                        selectedPackage = package
                        showingPurchaseSheet = true
                    }
                }
            }
        }
    }
}

// MARK: - Current Package Card
struct CurrentPackageCard: View {
    let package: EventPackage

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("Current Package")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .textCase(.uppercase)

                    Text(package.name)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .foregroundColor(.primary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    Text("Valid Until")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Text(package.expiryDate, style: .date)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                }
            }

            // Usage Progress
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Text("Events Created")
                        .font(.caption)
                        .foregroundColor(.secondary)

                    Spacer()

                    Text("\(package.eventsUsed)/\(package.eventsLimit)")
                        .font(.caption)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                }

                GeometryReader { geometry in
                    ZStack(alignment: .leading) {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .frame(height: 6)
                            .cornerRadius(3)

                        Rectangle()
                            .fill(package.usageColor)
                            .frame(width: geometry.size.width * package.usagePercentage, height: 6)
                            .cornerRadius(3)
                    }
                }
                .frame(height: 6)
            }
        }
        .padding()
        .background(Color.blue.opacity(0.1))
        .cornerRadius(12)
        .overlay(
            RoundedRectangle(cornerRadius: 12)
                .stroke(Color.blue.opacity(0.3), lineWidth: 1)
        )
    }
}

// MARK: - Package Card
struct PackageCard: View {
    let package: EventPackage
    let isSelected: Bool
    let isCurrent: Bool
    let onSelect: () -> Void
    let onPurchase: () -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 16) {
            // Header
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    HStack {
                        Text(package.name)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        if package.isPopular {
                            Text("POPULAR")
                                .font(.caption)
                                .fontWeight(.bold)
                                .foregroundColor(.white)
                                .padding(.horizontal, 8)
                                .padding(.vertical, 2)
                                .background(Color.orange)
                                .cornerRadius(4)
                        }
                    }

                    Text(package.description)
                        .font(.body)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    if package.originalPrice > package.price {
                        Text("$\(package.originalPrice, specifier: "%.2f")")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .strikethrough()
                    }

                    Text("$\(package.price, specifier: "%.2f")")
                        .font(.title2)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)

                    Text("per month")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }

            // Features
            VStack(alignment: .leading, spacing: 8) {
                ForEach(package.features, id: \.self) { feature in
                    HStack {
                        Image(systemName: "checkmark.circle.fill")
                            .foregroundColor(.green)
                            .font(.caption)

                        Text(feature)
                            .font(.body)
                            .foregroundColor(.primary)

                        Spacer()
                    }
                }
            }

            // Limits
            VStack(alignment: .leading, spacing: 8) {
                PackageLimitRow(
                    title: "Events per month",
                    value: package.eventsLimit == -1 ? "Unlimited" : "\(package.eventsLimit)"
                )

                PackageLimitRow(
                    title: "Attendees per event",
                    value: package.attendeesLimit == -1 ? "Unlimited" : "\(package.attendeesLimit)"
                )

                PackageLimitRow(
                    title: "Storage",
                    value: package.storageLimit == -1 ? "Unlimited" : "\(package.storageLimit)GB"
                )

                if package.supportLevel.isNotEmpty {
                    PackageLimitRow(
                        title: "Support",
                        value: package.supportLevel
                    )
                }
            }

            // Action Buttons
            HStack(spacing: 12) {
                Button(action: onSelect) {
                    Text("View Details")
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.blue)
                        .frame(maxWidth: .infinity)
                        .padding(.vertical, 12)
                        .background(Color.blue.opacity(0.1))
                        .cornerRadius(8)
                }

                if isCurrent {
                    Button(action: {}) {
                        Text("Current Plan")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.green)
                            .cornerRadius(8)
                    }
                    .disabled(true)
                } else {
                    Button(action: onPurchase) {
                        Text(package.isUpgrade ? "Upgrade" : "Subscribe")
                            .font(.subheadline)
                            .fontWeight(.medium)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 12)
                            .background(Color.blue)
                            .cornerRadius(8)
                    }
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(16)
        .shadow(color: Color.black.opacity(0.1), radius: 8, x: 0, y: 4)
        .overlay(
            RoundedRectangle(cornerRadius: 16)
                .stroke(isCurrent ? Color.blue : Color.clear, lineWidth: 2)
        )
    }
}

// MARK: - Package Limit Row
struct PackageLimitRow: View {
    let title: String
    let value: String

    var body: some View {
        HStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)

            Spacer()

            Text(value)
                .font(.caption)
                .fontWeight(.medium)
                .foregroundColor(.primary)
        }
    }
}

// MARK: - Package Details Sheet
struct PackageDetailsSheet: View {
    let package: EventPackage
    let onPurchase: () -> Void
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Header
                    VStack(alignment: .leading, spacing: 8) {
                        HStack {
                            Text(package.name)
                                .font(.largeTitle)
                                .fontWeight(.bold)

                            if package.isPopular {
                                Text("POPULAR")
                                    .font(.caption)
                                    .fontWeight(.bold)
                                    .foregroundColor(.white)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 2)
                                    .background(Color.orange)
                                    .cornerRadius(4)
                            }
                        }

                        Text(package.description)
                            .font(.body)
                            .foregroundColor(.secondary)

                        HStack {
                            Text("$\(package.price, specifier: "%.2f")")
                                .font(.title)
                                .fontWeight(.bold)
                                .foregroundColor(.blue)

                            Text("per month")
                                .font(.body)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Features
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Features")
                            .font(.headline)
                            .fontWeight(.semibold)

                        ForEach(package.features, id: \.self) { feature in
                            HStack {
                                Image(systemName: "checkmark.circle.fill")
                                    .foregroundColor(.green)

                                Text(feature)
                                    .font(.body)

                                Spacer()
                            }
                        }
                    }

                    // Limits
                    VStack(alignment: .leading, spacing: 12) {
                        Text("Limits & Specifications")
                            .font(.headline)
                            .fontWeight(.semibold)

                        VStack(spacing: 8) {
                            PackageLimitRow(
                                title: "Events per month",
                                value: package.eventsLimit == -1 ? "Unlimited" : "\(package.eventsLimit)"
                            )

                            PackageLimitRow(
                                title: "Attendees per event",
                                value: package.attendeesLimit == -1 ? "Unlimited" : "\(package.attendeesLimit)"
                            )

                            PackageLimitRow(
                                title: "Storage space",
                                value: package.storageLimit == -1 ? "Unlimited" : "\(package.storageLimit)GB"
                            )

                            PackageLimitRow(
                                title: "Support level",
                                value: package.supportLevel
                            )

                            PackageLimitRow(
                                title: "Analytics",
                                value: package.hasAnalytics ? "Advanced" : "Basic"
                            )

                            PackageLimitRow(
                                title: "Custom branding",
                                value: package.hasCustomBranding ? "Yes" : "No"
                            )
                        }
                    }

                    // Terms
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Terms & Conditions")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Text("• Cancel anytime with 24-hour notice")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("• No setup fees or hidden charges")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("• 30-day money-back guarantee")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Text("• Access to all features during trial period")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    // Purchase Button
                    Button(action: {
                        dismiss()
                        onPurchase()
                    }) {
                        Text("Subscribe Now")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.white)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue)
                            .cornerRadius(12)
                    }
                }
                .padding()
            }
            .navigationBarItems(trailing: Button("Close") { dismiss() })
        }
    }
}

// MARK: - Purchase Package Sheet
struct PurchasePackageSheet: View {
    let package: EventPackage
    let onPurchaseComplete: () -> Void
    @State private var isProcessing = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Package Summary
                VStack(alignment: .leading, spacing: 12) {
                    Text("Purchase Summary")
                        .font(.headline)
                        .fontWeight(.semibold)

                    HStack {
                        Text(package.name)
                            .font(.body)
                            .fontWeight(.medium)

                        Spacer()

                        Text("$\(package.price, specifier: "%.2f")")
                            .font(.body)
                            .fontWeight(.semibold)
                    }

                    HStack {
                        Text("Billing cycle")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Spacer()

                        Text("Monthly")
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }

                    Divider()

                    HStack {
                        Text("Total")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Spacer()

                        Text("$\(package.price, specifier: "%.2f")")
                            .font(.headline)
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }
                .padding()
                .background(Color.gray.opacity(0.1))
                .cornerRadius(12)

                // Payment Information
                VStack(alignment: .leading, spacing: 12) {
                    Text("Payment Information")
                        .font(.headline)
                        .fontWeight(.semibold)

                    Text("Payment will be processed through your default payment method.")
                        .font(.body)
                        .foregroundColor(.secondary)

                    Text("You can cancel your subscription at any time from your account settings.")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                // Purchase Button
                Button(action: {
                    processPurchase()
                }) {
                    HStack {
                        if isProcessing {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        }

                        Text("Confirm Purchase")
                            .font(.headline)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .cornerRadius(12)
                }
                .disabled(isProcessing)
            }
            .padding()
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() }
            )
        }
    }

    private func processPurchase() {
        isProcessing = true

        // Simulate payment processing
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            isProcessing = false
            onPurchaseComplete()
            dismiss()
        }
    }
}

// MARK: - Error View
struct ErrorView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)

            Text("Error")
                .font(.title)
                .fontWeight(.bold)

            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            Button("Retry") {
                onRetry()
            }
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(8)
        }
        .padding()
    }
}

// MARK: - Package View Model
class PackageViewModel: ObservableObject {
    @Published var packages: [EventPackage] = []
    @Published var currentPackage: EventPackage?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let packageService = PackageService()

    func loadAvailablePackages() {
        isLoading = true
        errorMessage = nil

        packageService.getAvailablePackages { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false

                switch result {
                case .success(let packages):
                    self?.packages = packages
                    self?.loadCurrentPackage()
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }

    private func loadCurrentPackage() {
        packageService.getCurrentPackage { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let package):
                    self?.currentPackage = package
                case .failure:
                    // User might not have a current package
                    self?.currentPackage = nil
                }
            }
        }
    }
}

// MARK: - Package Service
class PackageService {
    func getAvailablePackages(completion: @escaping (Result<[EventPackage], Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
            let packages = [
                EventPackage(
                    id: "basic",
                    name: "Basic",
                    description: "Perfect for small events and personal use",
                    price: 9.99,
                    originalPrice: 19.99,
                    eventsLimit: 5,
                    attendeesLimit: 100,
                    storageLimit: 1,
                    supportLevel: "Email support",
                    features: [
                        "Up to 5 events per month",
                        "100 attendees per event",
                        "Basic analytics",
                        "Email support"
                    ],
                    isPopular: false,
                    hasAnalytics: false,
                    hasCustomBranding: false,
                    isUpgrade: false
                ),
                EventPackage(
                    id: "pro",
                    name: "Professional",
                    description: "Great for growing businesses and regular event organizers",
                    price: 29.99,
                    originalPrice: 49.99,
                    eventsLimit: 25,
                    attendeesLimit: 1000,
                    storageLimit: 10,
                    supportLevel: "Priority support",
                    features: [
                        "Up to 25 events per month",
                        "1,000 attendees per event",
                        "Advanced analytics",
                        "Priority support",
                        "Custom branding"
                    ],
                    isPopular: true,
                    hasAnalytics: true,
                    hasCustomBranding: true,
                    isUpgrade: true
                ),
                EventPackage(
                    id: "enterprise",
                    name: "Enterprise",
                    description: "Unlimited power for large organizations and enterprises",
                    price: 99.99,
                    originalPrice: 199.99,
                    eventsLimit: -1,
                    attendeesLimit: -1,
                    storageLimit: -1,
                    supportLevel: "24/7 dedicated support",
                    features: [
                        "Unlimited events",
                        "Unlimited attendees",
                        "Unlimited storage",
                        "24/7 dedicated support",
                        "White-label solution",
                        "API access",
                        "Custom integrations"
                    ],
                    isPopular: false,
                    hasAnalytics: true,
                    hasCustomBranding: true,
                    isUpgrade: true
                )
            ]
            completion(.success(packages))
        }
    }

    func getCurrentPackage(completion: @escaping (Result<EventPackage, Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.5) {
            let currentPackage = EventPackage(
                id: "basic",
                name: "Basic",
                description: "Perfect for small events and personal use",
                price: 9.99,
                originalPrice: 19.99,
                eventsLimit: 5,
                attendeesLimit: 100,
                storageLimit: 1,
                supportLevel: "Email support",
                features: [],
                isPopular: false,
                hasAnalytics: false,
                hasCustomBranding: false,
                isUpgrade: false,
                eventsUsed: 3,
                expiryDate: Date().addingTimeInterval(30 * 24 * 60 * 60) // 30 days
            )
            completion(.success(currentPackage))
        }
    }
}

// MARK: - Event Package Model
struct EventPackage: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let price: Double
    let originalPrice: Double
    let eventsLimit: Int // -1 for unlimited
    let attendeesLimit: Int // -1 for unlimited
    let storageLimit: Int // -1 for unlimited, in GB
    let supportLevel: String
    let features: [String]
    let isPopular: Bool
    let hasAnalytics: Bool
    let hasCustomBranding: Bool
    let isUpgrade: Bool
    let eventsUsed: Int
    let expiryDate: Date

    init(id: String, name: String, description: String, price: Double, originalPrice: Double, eventsLimit: Int, attendeesLimit: Int, storageLimit: Int, supportLevel: String, features: [String], isPopular: Bool, hasAnalytics: Bool, hasCustomBranding: Bool, isUpgrade: Bool, eventsUsed: Int = 0, expiryDate: Date = Date()) {
        self.id = id
        self.name = name
        self.description = description
        self.price = price
        self.originalPrice = originalPrice
        self.eventsLimit = eventsLimit
        self.attendeesLimit = attendeesLimit
        self.storageLimit = storageLimit
        self.supportLevel = supportLevel
        self.features = features
        self.isPopular = isPopular
        self.hasAnalytics = hasAnalytics
        self.hasCustomBranding = hasCustomBranding
        self.isUpgrade = isUpgrade
        self.eventsUsed = eventsUsed
        self.expiryDate = expiryDate
    }

    var usagePercentage: CGFloat {
        guard eventsLimit > 0 else { return 0 }
        return CGFloat(eventsUsed) / CGFloat(eventsLimit)
    }

    var usageColor: Color {
        let percentage = usagePercentage
        if percentage < 0.5 {
            return .green
        } else if percentage < 0.8 {
            return .orange
        } else {
            return .red
        }
    }
}

extension String {
    var isNotEmpty: Bool {
        return !isEmpty
    }
}

#Preview {
    PackageView()
}
