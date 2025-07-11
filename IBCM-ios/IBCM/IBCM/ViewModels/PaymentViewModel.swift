import Foundation
import Combine
import PassKit

@MainActor
class PaymentViewModel: ObservableObject {
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var paymentSuccessful = false
    @Published var currentPayment: Payment?
    @Published var paymentMethods: [PaymentMethod] = []
    @Published var selectedPaymentMethod: PaymentMethod = .razorpay

    // Razorpay specific
    @Published var razorpayOrderId: String?
    @Published var razorpayKey: String?

    // Stripe specific
    @Published var stripeClientSecret: String?
    @Published var stripePublishableKey: String?

    // Apple Pay
    @Published var isApplePayAvailable = false

    private var cancellables = Set<AnyCancellable>()
    private let networkService = NetworkService.shared

    init() {
        setupApplePay()
        loadPaymentMethods()
    }

    private func setupApplePay() {
        isApplePayAvailable = PKPaymentAuthorizationController.canMakePayments()
    }

    private func loadPaymentMethods() {
        paymentMethods = [.razorpay, .stripe, .upi]

        if isApplePayAvailable {
            paymentMethods.insert(.creditCard, at: 0)
        }
    }

    func processPayment(
        eventId: String?,
        subscriptionId: String?,
        amount: Double,
        currency: String,
        method: PaymentMethod,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        isLoading = true
        errorMessage = ""
        paymentSuccessful = false

        do {
            let paymentRequest = PaymentRequest(
                eventId: eventId,
                subscriptionId: subscriptionId,
                amount: amount,
                currency: currency,
                description: createPaymentDescription(eventId: eventId, subscriptionId: subscriptionId),
                method: method,
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone,
                metadata: createMetadata(eventId: eventId, subscriptionId: subscriptionId)
            )

            let response = try await networkService.createPayment(request: paymentRequest).async()

            if response.success, let paymentData = response.data {
                await processPaymentByMethod(
                    method: method,
                    paymentData: paymentData,
                    customerName: customerName,
                    customerEmail: customerEmail,
                    customerPhone: customerPhone
                )
            } else {
                errorMessage = response.message ?? "Payment creation failed"
                showError = true
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    private func processPaymentByMethod(
        method: PaymentMethod,
        paymentData: PaymentData,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        switch method {
        case .razorpay:
            await processRazorpayPayment(
                paymentData: paymentData,
                customerName: customerName,
                customerEmail: customerEmail,
                customerPhone: customerPhone
            )
        case .stripe:
            await processStripePayment(paymentData: paymentData)
        case .creditCard:
            await processApplePayPayment(paymentData: paymentData)
        case .upi:
            await processUPIPayment(paymentData: paymentData)
        default:
            errorMessage = "Payment method not supported"
            showError = true
        }
    }

    private func processRazorpayPayment(
        paymentData: PaymentData,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        // Store Razorpay data for the payment gateway
        razorpayOrderId = paymentData.orderId
        razorpayKey = paymentData.razorpayKey

        // In a real implementation, you would integrate with Razorpay iOS SDK here
        // For now, we'll simulate a successful payment

        // Simulate payment processing delay
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

        // Simulate successful payment
        let verification = PaymentVerification(
            paymentId: paymentData.paymentId,
            razorpayPaymentId: "razorpay_\(UUID().uuidString)",
            razorpayOrderId: paymentData.orderId,
            razorpaySignature: "signature_\(UUID().uuidString)",
            stripePaymentIntentId: nil
        )

        await verifyPayment(verification: verification)
    }

    private func processStripePayment(paymentData: PaymentData) async {
        stripeClientSecret = paymentData.clientSecret
        stripePublishableKey = paymentData.stripePublishableKey

        // In a real implementation, you would integrate with Stripe iOS SDK here
        // For now, we'll simulate a successful payment

        // Simulate payment processing delay
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

        // Simulate successful payment
        let verification = PaymentVerification(
            paymentId: paymentData.paymentId,
            razorpayPaymentId: nil,
            razorpayOrderId: nil,
            razorpaySignature: nil,
            stripePaymentIntentId: "pi_\(UUID().uuidString)"
        )

        await verifyPayment(verification: verification)
    }

    private func processApplePayPayment(paymentData: PaymentData) async {
        guard isApplePayAvailable else {
            errorMessage = "Apple Pay is not available on this device"
            showError = true
            return
        }

        // Create Apple Pay request
        let request = PKPaymentRequest()
        request.merchantIdentifier = "merchant.com.ibcm.app"
        request.supportedNetworks = [.visa, .masterCard, .amex]
        request.merchantCapabilities = .capability3DS
        request.countryCode = "IN"
        request.currencyCode = "INR"

        let paymentItem = PKPaymentSummaryItem(
            label: "IBCM Payment",
            amount: NSDecimalNumber(value: paymentData.amount)
        )
        request.paymentSummaryItems = [paymentItem]

        // In a real implementation, you would present the Apple Pay controller here
        // For now, we'll simulate a successful payment

        // Simulate payment processing delay
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

        // Simulate successful payment
        let verification = PaymentVerification(
            paymentId: paymentData.paymentId,
            razorpayPaymentId: nil,
            razorpayOrderId: nil,
            razorpaySignature: nil,
            stripePaymentIntentId: "apple_pay_\(UUID().uuidString)"
        )

        await verifyPayment(verification: verification)
    }

    private func processUPIPayment(paymentData: PaymentData) async {
        // In a real implementation, you would integrate with UPI APIs here
        // For now, we'll simulate a successful payment

        // Simulate payment processing delay
        try? await Task.sleep(nanoseconds: 2_000_000_000) // 2 seconds

        // Simulate successful payment
        let verification = PaymentVerification(
            paymentId: paymentData.paymentId,
            razorpayPaymentId: "upi_\(UUID().uuidString)",
            razorpayOrderId: paymentData.orderId,
            razorpaySignature: "upi_signature_\(UUID().uuidString)",
            stripePaymentIntentId: nil
        )

        await verifyPayment(verification: verification)
    }

    private func verifyPayment(verification: PaymentVerification) async {
        do {
            let response = try await networkService.verifyPayment(verification: verification).async()

            if response.success {
                paymentSuccessful = true
                currentPayment = response.data as? Payment
            } else {
                errorMessage = response.message ?? "Payment verification failed"
                showError = true
            }
        } catch {
            handleError(error)
        }
    }

    func getPaymentHistory() async {
        isLoading = true
        errorMessage = ""

        do {
            let payments = try await networkService.getPaymentHistory().async()
            // Handle payment history
            print("Payment history loaded: \(payments.count) payments")
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func processRefund(paymentId: String, amount: Double, reason: String) async {
        isLoading = true
        errorMessage = ""

        do {
            // Create refund request
            let refundData = [
                "paymentId": paymentId,
                "amount": amount,
                "reason": reason
            ] as [String: Any]

            // This would call a refund API endpoint
            // let response = try await networkService.processRefund(refundData: refundData).async()

            // For now, simulate successful refund
            try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second

            print("Refund processed successfully")
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    private func createPaymentDescription(eventId: String?, subscriptionId: String?) -> String {
        if let eventId = eventId {
            return "Event Registration Payment - \(eventId)"
        } else if let subscriptionId = subscriptionId {
            return "Subscription Payment - \(subscriptionId)"
        } else {
            return "IBCM Payment"
        }
    }

    private func createMetadata(eventId: String?, subscriptionId: String?) -> [String: String] {
        var metadata: [String: String] = [
            "platform": "iOS",
            "version": Bundle.main.infoDictionary?["CFBundleShortVersionString"] as? String ?? "1.0"
        ]

        if let eventId = eventId {
            metadata["eventId"] = eventId
            metadata["type"] = "event_registration"
        }

        if let subscriptionId = subscriptionId {
            metadata["subscriptionId"] = subscriptionId
            metadata["type"] = "subscription"
        }

        return metadata
    }

    private func handleError(_ error: Error) {
        if let networkError = error as? NetworkError {
            switch networkError {
            case .unauthorized:
                errorMessage = "Please log in to continue with payment"
            case .networkError:
                errorMessage = "Network connection error. Please check your internet connection."
            case .serverError(let code):
                errorMessage = "Server error (\(code)). Please try again later."
            default:
                errorMessage = networkError.localizedDescription
            }
        } else {
            errorMessage = "An unexpected error occurred. Please try again."
        }
        showError = true
    }

    // MARK: - Utility Methods
    func formatAmount(_ amount: Double, currency: String = "INR") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(amount)"
    }

    func validatePaymentData(
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) -> Bool {
        return !customerName.isEmpty &&
               !customerEmail.isEmpty &&
               !customerPhone.isEmpty &&
               isValidEmail(customerEmail) &&
               customerPhone.count >= 10
    }

    private func isValidEmail(_ email: String) -> Bool {
        let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
        let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
        return emailPredicate.evaluate(with: email)
    }

    func clearPaymentData() {
        currentPayment = nil
        razorpayOrderId = nil
        razorpayKey = nil
        stripeClientSecret = nil
        stripePublishableKey = nil
        errorMessage = ""
        paymentSuccessful = false
    }
}

// MARK: - Payment Status Tracking
extension PaymentViewModel {
    func trackPaymentStatus(paymentId: String) async {
        do {
            // This would track payment status in real-time
            // For now, we'll simulate status updates

            let statuses: [PaymentStatus] = [.pending, .processing, .completed]

            for status in statuses {
                try? await Task.sleep(nanoseconds: 1_000_000_000) // 1 second delay
                print("Payment status updated: \(status.rawValue)")

                if status == .completed {
                    paymentSuccessful = true
                    break
                } else if status == .failed {
                    errorMessage = "Payment failed"
                    showError = true
                    break
                }
            }
        }
    }
}

// MARK: - Subscription Payment Handling
extension PaymentViewModel {
    func processSubscriptionPayment(
        planId: String,
        billingCycle: BillingCycle,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        isLoading = true
        errorMessage = ""

        do {
            let subscriptionRequest = SubscriptionRequest(
                planId: planId,
                billingCycle: billingCycle,
                paymentMethod: selectedPaymentMethod,
                autoRenew: true,
                couponCode: nil
            )

            let response = try await networkService.createSubscription(request: subscriptionRequest).async()

            if response.success {
                // Process payment for subscription
                if let subscription = response.data {
                    await processPayment(
                        eventId: nil,
                        subscriptionId: subscription.id,
                        amount: subscription.amount,
                        currency: subscription.currency,
                        method: selectedPaymentMethod,
                        customerName: customerName,
                        customerEmail: customerEmail,
                        customerPhone: customerPhone
                    )
                }
            } else {
                errorMessage = response.message ?? "Subscription creation failed"
                showError = true
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }

    func cancelSubscription(subscriptionId: String) async {
        isLoading = true
        errorMessage = ""

        do {
            let response = try await networkService.cancelSubscription(subscriptionId: subscriptionId).async()

            if response.success {
                print("Subscription cancelled successfully")
            } else {
                errorMessage = response.message ?? "Subscription cancellation failed"
                showError = true
            }
        } catch {
            handleError(error)
        }

        isLoading = false
    }
}

// MARK: - Event Payment Handling
extension PaymentViewModel {
    func processEventRegistrationPayment(
        event: Event,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        await processPayment(
            eventId: event.id,
            subscriptionId: nil,
            amount: event.price,
            currency: "INR",
            method: selectedPaymentMethod,
            customerName: customerName,
            customerEmail: customerEmail,
            customerPhone: customerPhone
        )
    }

    func processEventUpgrade(
        eventId: String,
        upgradeType: String,
        customerName: String,
        customerEmail: String,
        customerPhone: String
    ) async {
        // This would handle event upgrade payments
        // Implementation would be similar to regular payments
        // but with upgrade-specific parameters

        print("Processing event upgrade: \(upgradeType) for event: \(eventId)")
    }
}
