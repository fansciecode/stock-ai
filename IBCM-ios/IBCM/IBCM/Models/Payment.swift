import Foundation

// MARK: - Payment Models

// MARK: - Payment Status
enum PaymentStatus: String, Codable, CaseIterable {
    case pending = "PENDING"
    case processing = "PROCESSING"
    case completed = "COMPLETED"
    case failed = "FAILED"
    case cancelled = "CANCELLED"
    case refunded = "REFUNDED"
}

// MARK: - Payment Method
enum PaymentMethod: String, Codable, CaseIterable {
    case razorpay = "RAZORPAY"
    case stripe = "STRIPE"
    case paypal = "PAYPAL"
    case upi = "UPI"
    case netBanking = "NET_BANKING"
    case creditCard = "CREDIT_CARD"
    case debitCard = "DEBIT_CARD"
    case wallet = "WALLET"
}

// MARK: - Payment
struct Payment: Codable, Identifiable {
    let id: String
    let userId: String
    let eventId: String?
    let subscriptionId: String?
    let amount: Double
    let currency: String
    let status: PaymentStatus
    let method: PaymentMethod
    let description: String
    let createdAt: String
    let updatedAt: String
    let completedAt: String?
    let failureReason: String?
    let transactionId: String?
    let razorpayPaymentId: String?
    let razorpayOrderId: String?
    let razorpaySignature: String?
    let stripePaymentIntentId: String?
    let receiptUrl: String?
    let refundAmount: Double?
    let refundReason: String?
    let refundedAt: String?
    let metadata: [String: String]?
}

// MARK: - Payment Request
struct PaymentRequest: Codable {
    let eventId: String?
    let subscriptionId: String?
    let amount: Double
    let currency: String
    let description: String
    let method: PaymentMethod
    let customerName: String
    let customerEmail: String
    let customerPhone: String?
    let metadata: [String: String]?
}

// MARK: - Payment Response
struct PaymentResponse: Codable {
    let success: Bool
    let data: PaymentData?
    let message: String?
    let error: String?
}

struct PaymentData: Codable {
    let paymentId: String
    let orderId: String?
    let amount: Double
    let currency: String
    let status: PaymentStatus
    let clientSecret: String?
    let razorpayKey: String?
    let stripePublishableKey: String?
}

// MARK: - Payment Verification
struct PaymentVerification: Codable {
    let paymentId: String
    let razorpayPaymentId: String?
    let razorpayOrderId: String?
    let razorpaySignature: String?
    let stripePaymentIntentId: String?
}

// MARK: - Payment Intent
struct PaymentIntent: Codable {
    let id: String
    let amount: Double
    let currency: String
    let status: String
    let clientSecret: String
    let description: String?
    let metadata: [String: String]?
}

// MARK: - Razorpay Order
struct RazorpayOrder: Codable {
    let id: String
    let amount: Int
    let currency: String
    let status: String
    let receipt: String?
    let notes: [String: String]?
    let createdAt: Int
}

// MARK: - Subscription Models

// MARK: - Subscription Status
enum SubscriptionStatus: String, Codable, CaseIterable {
    case active = "ACTIVE"
    case inactive = "INACTIVE"
    case cancelled = "CANCELLED"
    case paused = "PAUSED"
    case expired = "EXPIRED"
    case trial = "TRIAL"
}

// MARK: - Billing Cycle
enum BillingCycle: String, Codable, CaseIterable {
    case monthly = "MONTHLY"
    case yearly = "YEARLY"
    case quarterly = "QUARTERLY"
    case weekly = "WEEKLY"
}

// MARK: - Plan Type
enum PlanType: String, Codable, CaseIterable {
    case basic = "BASIC"
    case premium = "PREMIUM"
    case enterprise = "ENTERPRISE"
}

// MARK: - Subscription Plan
struct SubscriptionPlan: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let type: PlanType
    let price: Double
    let currency: String
    let billingCycle: BillingCycle
    let features: [String]
    let eventLimit: Int
    let storageLimit: Int
    let analyticsEnabled: Bool
    let prioritySupport: Bool
    let customBranding: Bool
    let isPopular: Bool
    let isActive: Bool
    let order: Int
    let trialDays: Int?
    let createdAt: String
    let updatedAt: String
}

// MARK: - Subscription
struct Subscription: Codable, Identifiable {
    let id: String
    let userId: String
    let planId: String
    let plan: SubscriptionPlan?
    let status: SubscriptionStatus
    let billingCycle: BillingCycle
    let amount: Double
    let currency: String
    let startDate: String
    let endDate: String
    let nextBillingDate: String?
    let cancelledAt: String?
    let cancelReason: String?
    let trialEndsAt: String?
    let currentPeriodStart: String
    let currentPeriodEnd: String
    let paymentMethod: PaymentMethod?
    let autoRenew: Bool
    let createdAt: String
    let updatedAt: String
    let metadata: [String: String]?
}

// MARK: - Subscription Request
struct SubscriptionRequest: Codable {
    let planId: String
    let billingCycle: BillingCycle
    let paymentMethod: PaymentMethod
    let autoRenew: Bool
    let couponCode: String?
}

// MARK: - Subscription Response
struct SubscriptionResponse: Codable {
    let success: Bool
    let data: Subscription?
    let message: String?
    let error: String?
}

// MARK: - Usage Data
struct UsageData: Codable {
    let userId: String
    let subscriptionId: String
    let eventsCreated: Int
    let eventsLimit: Int
    let storageUsed: Int
    let storageLimit: Int
    let analyticsAccess: Bool
    let prioritySupport: Bool
    let customBranding: Bool
    let period: String
    let updatedAt: String
}

// MARK: - Billing History
struct BillingHistory: Codable, Identifiable {
    let id: String
    let userId: String
    let subscriptionId: String?
    let eventId: String?
    let amount: Double
    let currency: String
    let description: String
    let status: PaymentStatus
    let method: PaymentMethod
    let invoiceUrl: String?
    let receiptUrl: String?
    let paidAt: String?
    let createdAt: String
    let metadata: [String: String]?
}

// MARK: - Invoice
struct Invoice: Codable, Identifiable {
    let id: String
    let userId: String
    let subscriptionId: String?
    let eventId: String?
    let number: String
    let amount: Double
    let currency: String
    let tax: Double
    let total: Double
    let status: InvoiceStatus
    let dueDate: String
    let paidAt: String?
    let downloadUrl: String?
    let items: [InvoiceItem]
    let createdAt: String
    let updatedAt: String
}

enum InvoiceStatus: String, Codable {
    case draft = "DRAFT"
    case sent = "SENT"
    case paid = "PAID"
    case overdue = "OVERDUE"
    case cancelled = "CANCELLED"
}

struct InvoiceItem: Codable, Identifiable {
    let id: String
    let description: String
    let quantity: Int
    let unitPrice: Double
    let total: Double
}

// MARK: - Coupon
struct Coupon: Codable, Identifiable {
    let id: String
    let code: String
    let name: String
    let description: String
    let type: CouponType
    let value: Double
    let maxRedemptions: Int?
    let redemptionsUsed: Int
    let isActive: Bool
    let validFrom: String
    let validUntil: String
    let applicablePlans: [String]?
    let minOrderAmount: Double?
    let createdAt: String
    let updatedAt: String
}

enum CouponType: String, Codable {
    case percentage = "PERCENTAGE"
    case fixed = "FIXED"
}

// MARK: - Refund
struct Refund: Codable, Identifiable {
    let id: String
    let paymentId: String
    let amount: Double
    let currency: String
    let reason: String
    let status: RefundStatus
    let processedAt: String?
    let createdAt: String
    let updatedAt: String
    let metadata: [String: String]?
}

enum RefundStatus: String, Codable {
    case pending = "PENDING"
    case processing = "PROCESSING"
    case completed = "COMPLETED"
    case failed = "FAILED"
    case cancelled = "CANCELLED"
}

// MARK: - Event Upgrade
struct EventUpgrade: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let fromPackage: String
    let toPackage: String
    let price: Double
    let currency: String
    let status: PaymentStatus
    let paymentId: String?
    let createdAt: String
    let completedAt: String?
}

// MARK: - Upgrade Options
struct UpgradeOptions: Codable {
    let eventId: String
    let currentPackage: String
    let availableUpgrades: [UpgradeOption]
}

struct UpgradeOption: Codable, Identifiable {
    let id: String
    let name: String
    let description: String
    let price: Double
    let currency: String
    let features: [String]
    let duration: Int
    let isPopular: Bool
    let savings: Double?
}

// MARK: - Payment Analytics
struct PaymentAnalytics: Codable {
    let totalRevenue: Double
    let totalTransactions: Int
    let successfulTransactions: Int
    let failedTransactions: Int
    let refundedTransactions: Int
    let averageTransactionValue: Double
    let conversionRate: Double
    let topPaymentMethods: [PaymentMethodStats]
    let revenueByMonth: [MonthlyRevenue]
    let subscriptionMetrics: SubscriptionMetrics
}

struct PaymentMethodStats: Codable {
    let method: PaymentMethod
    let count: Int
    let percentage: Double
    let revenue: Double
}

struct MonthlyRevenue: Codable {
    let month: String
    let revenue: Double
    let transactions: Int
}

struct SubscriptionMetrics: Codable {
    let totalSubscriptions: Int
    let activeSubscriptions: Int
    let cancelledSubscriptions: Int
    let monthlyRecurringRevenue: Double
    let averageRevenuePerUser: Double
    let churnRate: Double
    let lifetimeValue: Double
}

// MARK: - Utility Extensions
extension Payment {
    var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(amount)"
    }

    var isCompleted: Bool {
        return status == .completed
    }

    var isPending: Bool {
        return status == .pending || status == .processing
    }

    var isFailed: Bool {
        return status == .failed || status == .cancelled
    }
}

extension Subscription {
    var isActive: Bool {
        return status == .active
    }

    var isExpired: Bool {
        return status == .expired
    }

    var isCancelled: Bool {
        return status == .cancelled
    }

    var formattedAmount: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: amount)) ?? "\(currency) \(amount)"
    }

    var billingCycleDisplay: String {
        switch billingCycle {
        case .monthly:
            return "Monthly"
        case .yearly:
            return "Yearly"
        case .quarterly:
            return "Quarterly"
        case .weekly:
            return "Weekly"
        }
    }
}

extension SubscriptionPlan {
    var formattedPrice: String {
        let formatter = NumberFormatter()
        formatter.numberStyle = .currency
        formatter.currencyCode = currency
        return formatter.string(from: NSNumber(value: price)) ?? "\(currency) \(price)"
    }

    var eventLimitDisplay: String {
        return eventLimit == -1 ? "Unlimited" : "\(eventLimit)"
    }

    var storageLimitDisplay: String {
        return storageLimit == -1 ? "Unlimited" : "\(storageLimit) MB"
    }
}
