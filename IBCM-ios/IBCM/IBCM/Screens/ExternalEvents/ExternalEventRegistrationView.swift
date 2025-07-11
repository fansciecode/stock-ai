//
//  ExternalEventRegistrationView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI

struct ExternalEventRegistrationView: View {
    let event: ExternalEvent
    let onComplete: (Bool) -> Void

    @StateObject private var viewModel = RegistrationViewModel()
    @Environment(\.dismiss) private var dismiss

    @State private var name = ""
    @State private var email = ""
    @State private var phone = ""
    @State private var numberOfTickets = 1
    @State private var agreeToTerms = false
    @State private var showingTerms = false
    @State private var showingConfirmation = false

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 24) {
                    // Event Summary
                    EventSummaryCard(event: event, numberOfTickets: numberOfTickets)

                    // Registration Form
                    VStack(alignment: .leading, spacing: 20) {
                        Text("Registration Information")
                            .font(.title2)
                            .fontWeight(.bold)

                        VStack(spacing: 16) {
                            // Name Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Full Name")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)

                                TextField("Enter your full name", text: $name)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .autocapitalization(.words)
                                    .disableAutocorrection(true)
                            }

                            // Email Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Email Address")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)

                                TextField("Enter your email", text: $email)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.emailAddress)
                                    .autocapitalization(.none)
                                    .disableAutocorrection(true)
                            }

                            // Phone Field
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Phone Number (Optional)")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)

                                TextField("Enter your phone number", text: $phone)
                                    .textFieldStyle(RoundedBorderTextFieldStyle())
                                    .keyboardType(.phonePad)
                            }

                            // Number of Tickets
                            VStack(alignment: .leading, spacing: 8) {
                                Text("Number of Tickets")
                                    .font(.subheadline)
                                    .fontWeight(.medium)
                                    .foregroundColor(.primary)

                                HStack {
                                    Button {
                                        if numberOfTickets > 1 {
                                            numberOfTickets -= 1
                                        }
                                    } label: {
                                        Image(systemName: "minus.circle.fill")
                                            .foregroundColor(numberOfTickets > 1 ? .blue : .gray)
                                            .font(.title2)
                                    }
                                    .disabled(numberOfTickets <= 1)

                                    Text("\(numberOfTickets)")
                                        .font(.title2)
                                        .fontWeight(.semibold)
                                        .frame(minWidth: 40)

                                    Button {
                                        if numberOfTickets < 10 {
                                            numberOfTickets += 1
                                        }
                                    } label: {
                                        Image(systemName: "plus.circle.fill")
                                            .foregroundColor(numberOfTickets < 10 ? .blue : .gray)
                                            .font(.title2)
                                    }
                                    .disabled(numberOfTickets >= 10)

                                    Spacer()

                                    Text("Max 10 tickets")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                .padding(.vertical, 4)
                            }
                        }
                    }

                    // Terms and Conditions
                    VStack(alignment: .leading, spacing: 12) {
                        Toggle(isOn: $agreeToTerms) {
                            VStack(alignment: .leading, spacing: 4) {
                                Text("I agree to the terms and conditions")
                                    .font(.subheadline)

                                Button("View Terms & Conditions") {
                                    showingTerms = true
                                }
                                .font(.caption)
                                .foregroundColor(.blue)
                            }
                        }
                        .toggleStyle(CheckboxToggleStyle())

                        Text("By registering, you agree to share your information with the event organizer (\(event.organizer)) and the external platform (\(event.source.capitalized)).")
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .padding()
                            .background(Color(.systemGray6))
                            .cornerRadius(8)
                    }

                    // Register Button
                    Button {
                        register()
                    } label: {
                        HStack {
                            if viewModel.isRegistering {
                                ProgressView()
                                    .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                    .scaleEffect(0.8)
                            } else {
                                Image(systemName: "person.badge.plus")
                            }

                            Text(viewModel.isRegistering ? "Registering..." : "Complete Registration")
                                .fontWeight(.semibold)
                        }
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(isFormValid ? Color.blue : Color.gray)
                        .foregroundColor(.white)
                        .cornerRadius(12)
                    }
                    .disabled(!isFormValid || viewModel.isRegistering)

                    // Error Message
                    if let errorMessage = viewModel.errorMessage {
                        Text(errorMessage)
                            .font(.caption)
                            .foregroundColor(.red)
                            .padding()
                            .background(Color.red.opacity(0.1))
                            .cornerRadius(8)
                    }
                }
                .padding()
            }
            .navigationTitle("Event Registration")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
            .sheet(isPresented: $showingTerms) {
                TermsAndConditionsView()
            }
            .alert("Registration Successful!", isPresented: $showingConfirmation) {
                Button("OK") {
                    onComplete(true)
                }
            } message: {
                if let response = viewModel.registrationResponse {
                    Text("Your confirmation code is: \(response.confirmationCode)")
                }
            }
            .onChange(of: viewModel.registrationResponse) { response in
                if response != nil {
                    showingConfirmation = true
                }
            }
        }
    }

    private var isFormValid: Bool {
        !name.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        !email.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        email.contains("@") &&
        agreeToTerms
    }

    private func register() {
        let request = EventRegistrationRequest(
            name: name.trimmingCharacters(in: .whitespacesAndNewlines),
            email: email.trimmingCharacters(in: .whitespacesAndNewlines),
            phone: phone.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty ? nil : phone.trimmingCharacters(in: .whitespacesAndNewlines),
            numberOfTickets: numberOfTickets
        )

        viewModel.registerForEvent(eventId: event.id, registration: request)
    }
}

struct EventSummaryCard: View {
    let event: ExternalEvent
    let numberOfTickets: Int

    private var totalPrice: Double {
        event.price * Double(numberOfTickets)
    }

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            Text("Event Summary")
                .font(.title2)
                .fontWeight(.bold)

            HStack(alignment: .top, spacing: 12) {
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
                .frame(width: 80, height: 80)
                .clipped()
                .cornerRadius(8)

                VStack(alignment: .leading, spacing: 4) {
                    Text(event.title)
                        .font(.headline)
                        .fontWeight(.semibold)
                        .lineLimit(2)

                    Text(event.formattedDate)
                        .font(.subheadline)
                        .foregroundColor(.secondary)

                    if let location = event.location {
                        Text(location.address)
                            .font(.caption)
                            .foregroundColor(.secondary)
                            .lineLimit(1)
                    }

                    Text("by \(event.organizer)")
                        .font(.caption)
                        .foregroundColor(.blue)
                }

                Spacer()
            }

            Divider()

            // Pricing Summary
            VStack(spacing: 8) {
                HStack {
                    Text("Tickets (\(numberOfTickets))")
                    Spacer()
                    Text(event.formattedPrice)
                        .fontWeight(.medium)
                }

                if numberOfTickets > 1 {
                    HStack {
                        Text("Total")
                            .fontWeight(.semibold)
                        Spacer()
                        Text(formatPrice(totalPrice))
                            .fontWeight(.bold)
                            .foregroundColor(.blue)
                    }
                }

                if event.price == 0 {
                    Text("This is a free event")
                        .font(.caption)
                        .foregroundColor(.green)
                        .frame(maxWidth: .infinity, alignment: .center)
                }
            }
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }

    private func formatPrice(_ price: Double) -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = "USD"
        return formatter.string(from: NSNumber(value: price)) ?? "$\(price)"
    }
}

struct CheckboxToggleStyle: ToggleStyle {
    func makeBody(configuration: Configuration) -> some View {
        HStack(alignment: .top, spacing: 8) {
            Button {
                configuration.isOn.toggle()
            } label: {
                Image(systemName: configuration.isOn ? "checkmark.square.fill" : "square")
                    .foregroundColor(configuration.isOn ? .blue : .gray)
                    .font(.title3)
            }
            .buttonStyle(.plain)

            configuration.label
                .multilineTextAlignment(.leading)
        }
    }
}

struct TermsAndConditionsView: View {
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 16) {
                    Text("Terms and Conditions")
                        .font(.title2)
                        .fontWeight(.bold)

                    Group {
                        Text("1. Event Registration")
                            .font(.headline)
                        Text("By registering for this external event, you agree to provide accurate information and understand that your registration will be processed through the external platform.")

                        Text("2. Data Sharing")
                            .font(.headline)
                        Text("Your registration information will be shared with the event organizer and the external platform hosting this event. This includes your name, email, and any other information you provide.")

                        Text("3. Payment and Refunds")
                            .font(.headline)
                        Text("All payments are processed through the external platform. Refund policies are determined by the event organizer and external platform, not by IBCM.")

                        Text("4. Event Changes")
                            .font(.headline)
                        Text("The event organizer reserves the right to modify event details, including date, time, location, or cancellation. Any changes will be communicated through the external platform.")

                        Text("5. Liability")
                            .font(.headline)
                        Text("IBCM acts as a discovery platform for external events and is not responsible for the event content, organization, or any issues that may arise during the event.")
                    }
                    .font(.body)
                }
                .padding()
            }
            .navigationTitle("Terms & Conditions")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        dismiss()
                    }
                }
            }
        }
    }
}

@MainActor
class RegistrationViewModel: ObservableObject {
    @Published var isRegistering = false
    @Published var errorMessage: String?
    @Published var registrationResponse: EventRegistrationResponse?

    private let externalEventService = ExternalEventService()

    func registerForEvent(eventId: String, registration: EventRegistrationRequest) {
        Task {
            isRegistering = true
            errorMessage = nil

            do {
                let response = try await externalEventService.registerForEvent(
                    eventId: eventId,
                    registration: registration
                )
                registrationResponse = response
            } catch {
                errorMessage = error.localizedDescription
            }

            isRegistering = false
        }
    }
}

// MARK: - Preview
struct ExternalEventRegistrationView_Previews: PreviewProvider {
    static var previews: some View {
        ExternalEventRegistrationView(
            event: ExternalEvent(
                id: "preview",
                title: "Sample External Event",
                description: "This is a preview event",
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
        ) { success in
            print("Registration completed: \(success)")
        }
    }
}
