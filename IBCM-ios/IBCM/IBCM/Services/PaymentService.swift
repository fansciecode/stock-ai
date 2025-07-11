//
//  PaymentService.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import Foundation
import Combine
import PassKit

class PaymentService: ObservableObject {
    static let shared = PaymentService()

    @Published var isLoading = false
    @Published var lastError: Error?
    @Published var paymentHistory: [PaymentRecord] = []

    private let networkService = NetworkService.shared
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Payment Configuration
    private let baseURL = APIConfig.baseURL
    private let razorpayKeyId = APIConfig.razorpayKeyId
    private let stripePublishableKey = APIConfig.stripePublishableKey

    private init() {}

    // MARK: - Event Upgrade Payment
    func getEventUpgradePrice(eventId: String) -> AnyPublisher<EventUpgradePriceResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/upgrade-price/\(eventId)")!

        return networkService.request(url: url, method: .GET)
            .decode(type: EventUpgradePriceResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getEventUpgradeOptions(eventId: String) -> AnyPublisher<EventUpgradeOptionsResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/upgrade-options/\(eventId)")!

        return networkService.request(url: url, method: .GET)
            .decode(type: EventUpgradeOptionsResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func processEventUpgrade(eventId: String, upgradeData: EventUpgradeRequest) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/upgrade/\(eventId)")!

        return networkService.request(url: url, method: .POST, body: upgradeData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Payment Intent Management
    func createPaymentIntent(paymentData: PaymentIntentRequest) -> AnyPublisher<PaymentIntentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/create-payment-intent")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: PaymentIntentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func confirmPaymentIntent(confirmationData: PaymentConfirmationRequest) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/confirm")!

        return networkService.request(url: url, method: .POST, body: confirmationData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getPaymentStatus(paymentIntentId: String) -> AnyPublisher<PaymentStatusResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/status/\(paymentIntentId)")!

        return networkService.request(url: url, method: .GET)
            .decode(type: PaymentStatusResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Payment Processing
    func initiatePayment(paymentData: PaymentRequest) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/create")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func verifyPayment(verificationData: PaymentVerificationRequest) -> AnyPublisher<PaymentVerificationResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/verify")!

        return networkService.request(url: url, method: .POST, body: verificationData)
            .decode(type: PaymentVerificationResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Refund Management
    func processRefund(refundData: RefundRequest) -> AnyPublisher<RefundResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/refund")!

        return networkService.request(url: url, method: .POST, body: refundData)
            .decode(type: RefundResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Subscription Management
    func createSubscription(subscriptionData: SubscriptionRequest) -> AnyPublisher<SubscriptionResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/subscribe")!

        return networkService.request(url: url, method: .POST, body: subscriptionData)
            .decode(type: SubscriptionResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func cancelSubscription(subscriptionId: String) -> AnyPublisher<SubscriptionResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/subscribe/\(subscriptionId)")!

        return networkService.request(url: url, method: .DELETE)
            .decode(type: SubscriptionResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func processSubscriptionPayment(subscriptionData: SubscriptionPaymentRequest) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/subscription/payment")!

        return networkService.request(url: url, method: .POST, body: subscriptionData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - External Payment Management
    func createExternalPayment(paymentData: ExternalPaymentRequest) -> AnyPublisher<ExternalPaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/external/create")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: ExternalPaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func verifyExternalPayment(paymentId: String, verificationData: ExternalPaymentVerificationRequest) -> AnyPublisher<ExternalPaymentVerificationResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/external/verify/\(paymentId)")!

        return networkService.request(url: url, method: .POST, body: verificationData)
            .decode(type: ExternalPaymentVerificationResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func getExternalPaymentStatus(paymentId: String) -> AnyPublisher<ExternalPaymentStatusResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/external/\(paymentId)")!

        return networkService.request(url: url, method: .GET)
            .decode(type: ExternalPaymentStatusResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Payment History
    func getPaymentHistory() -> AnyPublisher<PaymentHistoryResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/history")!

        return networkService.request(url: url, method: .GET)
            .decode(type: PaymentHistoryResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .handleEvents(receiveOutput: { [weak self] response in
                if response.success, let payments = response.data {
                    self?.paymentHistory = payments
                }
            })
            .eraseToAnyPublisher()
    }

    // MARK: - Apple Pay Integration
    func canMakeApplePayPayments() -> Bool {
        return PKPaymentAuthorizationController.canMakePayments()
    }

    func canMakeApplePayPaymentsWithSupportedNetworks() -> Bool {
        let supportedNetworks: [PKPaymentNetwork] = [.visa, .masterCard, .amex, .discover]
        return PKPaymentAuthorizationController.canMakePayments(usingNetworks: supportedNetworks)
    }

    func createApplePayRequest(for paymentData: ApplePayRequest) -> PKPaymentRequest {
        let request = PKPaymentRequest()
        request.merchantIdentifier = APIConfig.applePayMerchantId
        request.supportedNetworks = [.visa, .masterCard, .amex, .discover]
        request.merchantCapabilities = .capability3DS
        request.countryCode = paymentData.countryCode
        request.currencyCode = paymentData.currencyCode

        // Payment summary items
        var summaryItems: [PKPaymentSummaryItem] = []

        // Add individual items
        for item in paymentData.items {
            let summaryItem = PKPaymentSummaryItem(
                label: item.name,
                amount: NSDecimalNumber(value: item.amount)
            )
            summaryItems.append(summaryItem)
        }

        // Add taxes if applicable
        if paymentData.taxAmount > 0 {
            let taxItem = PKPaymentSummaryItem(
                label: "Tax",
                amount: NSDecimalNumber(value: paymentData.taxAmount)
            )
            summaryItems.append(taxItem)
        }

        // Add shipping if applicable
        if paymentData.shippingAmount > 0 {
            let shippingItem = PKPaymentSummaryItem(
                label: "Shipping",
                amount: NSDecimalNumber(value: paymentData.shippingAmount)
            )
            summaryItems.append(shippingItem)
        }

        // Total amount
        let totalItem = PKPaymentSummaryItem(
            label: paymentData.merchantName,
            amount: NSDecimalNumber(value: paymentData.totalAmount)
        )
        summaryItems.append(totalItem)

        request.paymentSummaryItems = summaryItems

        // Required billing and shipping contact fields
        request.requiredBillingContactFields = [.emailAddress, .name]
        if paymentData.requiresShipping {
            request.requiredShippingContactFields = [.postalAddress, .name, .phoneNumber]
        }

        return request
    }

    func processApplePayPayment(payment: PKPayment, completion: @escaping (Bool, Error?) -> Void) {
        // Convert PKPayment to your payment format
        let paymentData = ApplePayPaymentData(
            paymentToken: payment.token,
            billingContact: payment.billingContact,
            shippingContact: payment.shippingContact
        )

        // Send to backend for processing
        processApplePayment(paymentData: paymentData)
            .sink(
                receiveCompletion: { completionResult in
                    switch completionResult {
                    case .finished:
                        break
                    case .failure(let error):
                        completion(false, error)
                    }
                },
                receiveValue: { response in
                    completion(response.success, response.success ? nil : NSError(domain: "PaymentError", code: 0, userInfo: [NSLocalizedDescriptionKey: response.message ?? "Payment failed"]))
                }
            )
            .store(in: &cancellables)
    }

    private func processApplePayment(paymentData: ApplePayPaymentData) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/apple-pay")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Razorpay Integration
    func initiateRazorpayPayment(paymentData: RazorpayPaymentRequest) -> AnyPublisher<RazorpayPaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/razorpay/create")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: RazorpayPaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func verifyRazorpayPayment(verificationData: RazorpayVerificationRequest) -> AnyPublisher<PaymentVerificationResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/razorpay/verify")!

        return networkService.request(url: url, method: .POST, body: verificationData)
            .decode(type: PaymentVerificationResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Stripe Integration
    func createStripePaymentIntent(paymentData: StripePaymentRequest) -> AnyPublisher<StripePaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/stripe/create")!

        return networkService.request(url: url, method: .POST, body: paymentData)
            .decode(type: StripePaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    func confirmStripePayment(confirmationData: StripeConfirmationRequest) -> AnyPublisher<PaymentResponse, Error> {
        let url = URL(string: "\(baseURL)/payment/stripe/confirm")!

        return networkService.request(url: url, method: .POST, body: confirmationData)
            .decode(type: PaymentResponse.self, decoder: JSONDecoder())
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Utility Methods
    func formatAmount(_ amount: Double, currency: String = "INR") -> String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(amount)"
    }

    func validatePaymentData(_ paymentData: PaymentRequest) -> ValidationResult {
        var errors: [String] = []

        if paymentData.amount <= 0 {
            errors.append("Amount must be greater than 0")
        }

        if paymentData.currency.isEmpty {
            errors.append("Currency is required")
        }

        if paymentData.description.isEmpty {
            errors.append("Description is required")
        }

        return ValidationResult(isValid: errors.isEmpty, errors: errors)
    }

    func getPaymentMethodIcon(for method: PaymentMethod) -> String {
        switch method {
        case .applePay:
            return "apple.logo"
        case .creditCard:
            return "creditcard"
        case .debitCard:
            return "creditcard"
        case .netBanking:
            return "building.columns"
        case .upi:
            return "indianrupeesign.circle"
        case .wallet:
            return "wallet.pass"
        case .emi:
            return "calendar"
        case .razorpay:
            return "r.square"
        case .stripe:
            return "s.square"
        case .paypal:
            return "p.square"
        case .external:
            return "link"
        }
    }

    func getPaymentStatusColor(for status: PaymentStatus) -> String {
        switch status {
        case .pending:
            return "#F59E0B"
        case .processing:
            return "#3B82F6"
        case .completed:
            return "#10B981"
        case .failed:
            return "#EF4444"
        case .cancelled:
            return "#6B7280"
        case .refunded:
            return "#8B5CF6"
        }
    }

    func calculateProcessingFee(amount: Double, paymentMethod: PaymentMethod) -> Double {
        switch paymentMethod {
        case .applePay:
            return amount * 0.029 // 2.9%
        case .creditCard:
            return amount * 0.029 + 0.30 // 2.9% + $0.30
        case .debitCard:
            return amount * 0.025 // 2.5%
        case .netBanking:
            return amount * 0.020 // 2.0%
        case .upi:
            return amount * 0.015 // 1.5%
        case .wallet:
            return amount * 0.020 // 2.0%
        case .emi:
            return amount * 0.035 // 3.5%
        case .razorpay:
            return amount * 0.025 // 2.5%
        case .stripe:
            return amount * 0.029 + 0.30 // 2.9% + $0.30
        case .paypal:
            return amount * 0.034 + 0.30 // 3.4% + $0.30
        case .external:
            return 0.0
        }
    }

    func getSupportedPaymentMethods(for countryCode: String) -> [PaymentMethod] {
        switch countryCode {
        case "IN":
            return [.applePay, .creditCard, .debitCard, .netBanking, .upi, .wallet, .emi, .razorpay]
        case "US":
            return [.applePay, .creditCard, .debitCard, .stripe, .paypal]
        default:
            return [.applePay, .creditCard, .debitCard, .stripe]
        }
    }

    // MARK: - Error Handling
    func handlePaymentError(_ error: Error) -> String {
        if let paymentError = error as? PaymentError {
            switch paymentError {
            case .invalidAmount:
                return "Invalid payment amount"
            case .paymentFailed:
                return "Payment processing failed"
            case .paymentCancelled:
                return "Payment was cancelled"
            case .networkError:
                return "Network connection error"
            case .authenticationFailed:
                return "Authentication failed"
            case .insufficientFunds:
                return "Insufficient funds"
            case .cardDeclined:
                return "Card was declined"
            case .expiredCard:
                return "Card has expired"
            case .invalidCard:
                return "Invalid card details"
            case .processingError:
                return "Payment processing error"
            case .refundFailed:
                return "Refund processing failed"
            case .subscriptionFailed:
                return "Subscription creation failed"
            case .unknownError:
                return "An unknown error occurred"
            }
        }
        return error.localizedDescription
    }
}

// MARK: - Supporting Models
struct ValidationResult {
    let isValid: Bool
    let errors: [String]
}

enum PaymentError: Error {
    case invalidAmount
    case paymentFailed
    case paymentCancelled
    case networkError
    case authenticationFailed
    case insufficientFunds
    case cardDeclined
    case expiredCard
    case invalidCard
    case processingError
    case refundFailed
    case subscriptionFailed
    case unknownError
}

enum PaymentMethod: String, CaseIterable, Codable {
    case applePay = "apple_pay"
    case creditCard = "credit_card"
    case debitCard = "debit_card"
    case netBanking = "net_banking"
    case upi = "upi"
    case wallet = "wallet"
    case emi = "emi"
    case razorpay = "razorpay"
    case stripe = "stripe"
    case paypal = "paypal"
    case external = "external"

    var displayName: String {
        switch self {
        case .applePay:
            return "Apple Pay"
        case .creditCard:
            return "Credit Card"
        case .debitCard:
            return "Debit Card"
        case .netBanking:
            return "Net Banking"
        case .upi:
            return "UPI"
        case .wallet:
            return "Digital Wallet"
        case .emi:
            return "EMI"
        case .razorpay:
            return "Razorpay"
        case .stripe:
            return "Stripe"
        case .paypal:
            return "PayPal"
        case .external:
            return "External"
        }
    }
}

enum PaymentStatus: String, CaseIterable, Codable {
    case pending = "pending"
    case processing = "processing"
    case completed = "completed"
    case failed = "failed"
    case cancelled = "cancelled"
    case refunded = "refunded"

    var displayName: String {
        switch self {
        case .pending:
            return "Pending"
        case .processing:
            return "Processing"
        case .completed:
            return "Completed"
        case .failed:
            return "Failed"
        case .cancelled:
            return "Cancelled"
        case .refunded:
            return "Refunded"
        }
    }
}
