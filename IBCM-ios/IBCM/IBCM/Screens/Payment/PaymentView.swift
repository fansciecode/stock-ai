import SwiftUI
import PassKit

struct PaymentView: View {
    @StateObject private var viewModel = PaymentViewModel()
    @Environment(\.dismiss) private var dismiss

    let event: Event?
    let subscription: SubscriptionPlan?
    let amount: Double
    let currency: String

    @State private var selectedPaymentMethod: PaymentMethod = .razorpay
    @State private var showingApplePay = false
    @State private var showingPaymentSuccess = false
    @State private var showingPaymentFailure = false
    @State private var customerName = ""
    @State private var customerEmail = ""
    @State private var customerPhone = ""
    @State private var billingAddress = ""
    @State private var agreedToTerms = false
    @State private var currentStep = 0

    private let steps = ["Details", "Payment", "Confirmation"]

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Progress indicator
                ProgressView(value: Double(currentStep), total: Double(steps.count - 1))
                    .tint(.blue)
                    .padding(.horizontal, 16)
                    .padding(.top, 8)

                // Step indicator
                HStack {
                    ForEach(0..<steps.count, id: \.self) { index in
                        HStack {
                            Circle()
                                .fill(index <= currentStep ? Color.blue : Color.gray.opacity(0.3))
                                .frame(width: 24, height: 24)
                                .overlay(
                                    Text("\(index + 1)")
                                        .font(.caption)
                                        .fontWeight(.medium)
                                        .foregroundColor(index <= currentStep ? .white : .gray)
                                )

                            if index < steps.count - 1 {
                                Rectangle()
                                    .fill(index < currentStep ? Color.blue : Color.gray.opacity(0.3))
                                    .frame(height: 2)
                                    .frame(maxWidth: .infinity)
                            }
                        }
                    }
                }
                .padding(.horizontal, 16)
                .padding(.vertical, 12)

                ScrollView {
                    VStack(spacing: 24) {
                        switch currentStep {
                        case 0:
                            customerDetailsStep
                        case 1:
                            paymentMethodStep
                        case 2:
                            confirmationStep
                        default:
                            EmptyView()
                        }
                    }
                    .padding(.horizontal, 16)
                    .padding(.bottom, 24)
                }

                // Bottom action bar
                VStack(spacing: 16) {
                    Divider()

                    HStack {
                        if currentStep > 0 {
                            Button("Back") {
                                withAnimation {
                                    currentStep -= 1
                                }
                            }
                            .buttonStyle(.bordered)
                        }

                        Spacer()

                        Button(action: {
                            handleNextStep()
                        }) {
                            HStack {
                                if viewModel.isLoading {
                                    ProgressView()
                                        .progressViewStyle(CircularProgressViewStyle(tint: .white))
                                        .scaleEffect(0.8)
                                } else {
                                    Text(currentStep == steps.count - 1 ? "Pay Now" : "Continue")
                                        .fontWeight(.semibold)
                                }
                            }
                            .frame(maxWidth: .infinity)
                            .padding(.vertical, 16)
                            .background(
                                isNextStepValid ? Color.blue : Color.gray.opacity(0.6)
                            )
                            .foregroundColor(.white)
                            .cornerRadius(12)
                        }
                        .disabled(!isNextStepValid || viewModel.isLoading)
                    }
                    .padding(.horizontal, 16)
                }
                .background(Color(.systemBackground))
            }
            .navigationTitle("Payment")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        dismiss()
                    }
                }
            }
        }
        .alert("Payment Successful", isPresented: $showingPaymentSuccess) {
            Button("OK") {
                dismiss()
            }
        } message: {
            Text("Your payment has been processed successfully.")
        }
        .alert("Payment Failed", isPresented: $showingPaymentFailure) {
            Button("Try Again") {
                // Reset to payment step
                currentStep = 1
            }
            Button("Cancel", role: .cancel) {
                dismiss()
            }
        } message: {
            Text(viewModel.errorMessage)
        }
        .onAppear {
            loadUserData()
        }
    }

    // MARK: - Customer Details Step
    private var customerDetailsStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Customer Information")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Please provide your details for the payment")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 16) {
                VStack(alignment: .leading, spacing: 8) {
                    Text("Full Name")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    TextField("Enter your full name", text: $customerName)
                        .textFieldStyle(CustomTextFieldStyle())
                        .textContentType(.name)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Email")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    TextField("Enter your email", text: $customerEmail)
                        .textFieldStyle(CustomTextFieldStyle())
                        .textContentType(.emailAddress)
                        .keyboardType(.emailAddress)
                        .autocapitalization(.none)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Phone Number")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    TextField("Enter your phone number", text: $customerPhone)
                        .textFieldStyle(CustomTextFieldStyle())
                        .textContentType(.telephoneNumber)
                        .keyboardType(.phonePad)
                }

                VStack(alignment: .leading, spacing: 8) {
                    Text("Billing Address")
                        .font(.subheadline)
                        .fontWeight(.medium)

                    TextField("Enter your billing address", text: $billingAddress, axis: .vertical)
                        .textFieldStyle(CustomTextFieldStyle())
                        .textContentType(.fullStreetAddress)
                        .lineLimit(3...5)
                }
            }

            // Order summary
            orderSummaryCard
        }
    }

    // MARK: - Payment Method Step
    private var paymentMethodStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Payment Method")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Choose your preferred payment method")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            VStack(spacing: 12) {
                // Razorpay
                PaymentMethodCard(
                    method: .razorpay,
                    title: "Razorpay",
                    subtitle: "Cards, UPI, Net Banking, Wallets",
                    icon: "creditcard",
                    isSelected: selectedPaymentMethod == .razorpay
                ) {
                    selectedPaymentMethod = .razorpay
                }

                // Apple Pay (if available)
                if PKPaymentAuthorizationController.canMakePayments() {
                    PaymentMethodCard(
                        method: .creditCard,
                        title: "Apple Pay",
                        subtitle: "Touch ID or Face ID",
                        icon: "applelogo",
                        isSelected: selectedPaymentMethod == .creditCard
                    ) {
                        selectedPaymentMethod = .creditCard
                        showingApplePay = true
                    }
                }

                // Stripe
                PaymentMethodCard(
                    method: .stripe,
                    title: "Credit/Debit Card",
                    subtitle: "Visa, Mastercard, Amex",
                    icon: "creditcard.fill",
                    isSelected: selectedPaymentMethod == .stripe
                ) {
                    selectedPaymentMethod = .stripe
                }

                // UPI
                PaymentMethodCard(
                    method: .upi,
                    title: "UPI",
                    subtitle: "Google Pay, PhonePe, Paytm",
                    icon: "indianrupeesign.circle",
                    isSelected: selectedPaymentMethod == .upi
                ) {
                    selectedPaymentMethod = .upi
                }
            }

            // Security notice
            VStack(alignment: .leading, spacing: 8) {
                HStack {
                    Image(systemName: "lock.shield")
                        .foregroundColor(.green)
                    Text("Secure Payment")
                        .font(.subheadline)
                        .fontWeight(.medium)
                }

                Text("Your payment information is encrypted and secure. We never store your card details.")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            .padding(16)
            .background(Color.green.opacity(0.1))
            .cornerRadius(12)

            orderSummaryCard
        }
    }

    // MARK: - Confirmation Step
    private var confirmationStep: some View {
        VStack(alignment: .leading, spacing: 20) {
            VStack(alignment: .leading, spacing: 16) {
                Text("Confirm Payment")
                    .font(.title2)
                    .fontWeight(.bold)

                Text("Please review your order before proceeding")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
            }

            // Customer details summary
            VStack(alignment: .leading, spacing: 12) {
                Text("Customer Details")
                    .font(.headline)

                VStack(alignment: .leading, spacing: 4) {
                    Text(customerName)
                        .font(.subheadline)
                    Text(customerEmail)
                        .font(.caption)
                        .foregroundColor(.secondary)
                    Text(customerPhone)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
            }
            .padding(16)
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Payment method summary
            VStack(alignment: .leading, spacing: 12) {
                Text("Payment Method")
                    .font(.headline)

                HStack {
                    Image(systemName: paymentMethodIcon(selectedPaymentMethod))
                        .foregroundColor(.blue)
                    Text(paymentMethodTitle(selectedPaymentMethod))
                        .font(.subheadline)
                    Spacer()
                }
            }
            .padding(16)
            .background(Color(.systemGray6))
            .cornerRadius(12)

            // Terms and conditions
            HStack(alignment: .top, spacing: 8) {
                Button(action: {
                    agreedToTerms.toggle()
                }) {
                    Image(systemName: agreedToTerms ? "checkmark.square.fill" : "square")
                        .font(.title2)
                        .foregroundColor(agreedToTerms ? .blue : .gray)
                }

                VStack(alignment: .leading, spacing: 4) {
                    Text("I agree to the Terms of Service and Privacy Policy")
                        .font(.subheadline)

                    HStack {
                        Button("Terms of Service") {
                            // Handle terms
                        }
                        .font(.caption)
                        .foregroundColor(.blue)

                        Text("•")
                            .font(.caption)
                            .foregroundColor(.secondary)

                        Button("Privacy Policy") {
                            // Handle privacy policy
                        }
                        .font(.caption)
                        .foregroundColor(.blue)
                    }
                }

                Spacer()
            }

            orderSummaryCard
        }
    }

    // MARK: - Order Summary Card
    private var orderSummaryCard: some View {
        VStack(alignment: .leading, spacing: 16) {
            Text("Order Summary")
                .font(.headline)

            VStack(spacing: 12) {
                if let event = event {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(event.title)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Event Registration")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text("₹\(Int(event.price))")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }

                if let subscription = subscription {
                    HStack {
                        VStack(alignment: .leading) {
                            Text(subscription.name)
                                .font(.subheadline)
                                .fontWeight(.medium)
                            Text("Subscription Plan")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                        Spacer()
                        Text("₹\(Int(subscription.price))")
                            .font(.subheadline)
                            .fontWeight(.medium)
                    }
                }

                Divider()

                HStack {
                    Text("Subtotal")
                        .font(.subheadline)
                    Spacer()
                    Text("₹\(Int(amount))")
                        .font(.subheadline)
                }

                HStack {
                    Text("GST (18%)")
                        .font(.subheadline)
                    Spacer()
                    Text("₹\(Int(amount * 0.18))")
                        .font(.subheadline)
                }

                Divider()

                HStack {
                    Text("Total")
                        .font(.headline)
                        .fontWeight(.bold)
                    Spacer()
                    Text("₹\(Int(amount * 1.18))")
                        .font(.headline)
                        .fontWeight(.bold)
                        .foregroundColor(.blue)
                }
            }
        }
        .padding(16)
        .background(Color(.systemBackground))
        .cornerRadius(12)
        .shadow(color: .black.opacity(0.1), radius: 4, x: 0, y: 2)
    }

    // MARK: - Helper Methods
    private var isNextStepValid: Bool {
        switch currentStep {
        case 0:
            return !customerName.isEmpty &&
                   !customerEmail.isEmpty &&
                   !customerPhone.isEmpty &&
                   isValidEmail(customerEmail)
        case 1:
            return true // Payment method selection is always valid
        case 2:
            return agreedToTerms
        default:
            return false
        }
    }

    private func handleNextStep() {
        switch currentStep {
        case 0, 1:
            withAnimation {
                currentStep += 1
            }
        case 2:
            processPayment()
        default:
            break
        }
    }

    private func processPayment() {
        Task {
            await viewModel.processPayment(
                eventId: event?.id,
                subscriptionId: subscription?.id,
                amount: amount * 1.18, // Including GST
                currency: currency,
                method: selectedPaymentMethod,
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone
            )

            if viewModel.paymentSuccessful {
                showingPaymentSuccess = true
            } else {
                showingPaymentFailure = true
            }
        }
    }

    private func loadUserData() {
        // Load user data from auth service or user defaults
        // This would typically come from the logged-in user's profile
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    private func paymentMethodIcon(_ method: PaymentMethod) -> String {
        switch method {
        case .razorpay:
            return "creditcard"
        case .creditCard:
            return "applelogo"
        case .stripe:
            return "creditcard.fill"
        case .upi:
            return "indianrupeesign.circle"
        default:
            return "creditcard"
        }
    }

    private func paymentMethodTitle(_ method: PaymentMethod) -> String {
        switch method {
        case .razorpay:
            return "Razorpay"
        case .creditCard:
            return "Apple Pay"
        case .stripe:
            return "Credit/Debit Card"
        case .upi:
            return "UPI"
        default:
            return "Payment Method"
        }
    }
}

// MARK: - Payment Method Card
struct PaymentMethodCard: View {
    let method: PaymentMethod
    let title: String
    let subtitle: String
    let icon: String
    let isSelected: Bool
    let onTap: () -> Void

    var body: some View {
        Button(action: onTap) {
            HStack {
                Image(systemName: icon)
                    .font(.title2)
                    .foregroundColor(.blue)
                    .frame(width: 32)

                VStack(alignment: .leading, spacing: 2) {
                    Text(title)
                        .font(.subheadline)
                        .fontWeight(.medium)
                        .foregroundColor(.primary)
                    Text(subtitle)
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                Image(systemName: isSelected ? "checkmark.circle.fill" : "circle")
                    .font(.title2)
                    .foregroundColor(isSelected ? .blue : .gray)
            }
            .padding(16)
            .background(
                RoundedRectangle(cornerRadius: 12)
                    .fill(isSelected ? Color.blue.opacity(0.1) : Color(.systemGray6))
                    .overlay(
                        RoundedRectangle(cornerRadius: 12)
                            .stroke(isSelected ? Color.blue : Color.clear, lineWidth: 2)
                    )
            )
        }
        .buttonStyle(.plain)
    }
}

#Preview {
    PaymentView(
        event: nil,
        subscription: nil,
        amount: 1000,
        currency: "INR"
    )
}
