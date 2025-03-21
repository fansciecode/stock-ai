import Foundation
import PassKit

@MainActor
class PaymentViewModel: ObservableObject {
    @Published var payment: Payment?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var showPaymentSheet = false
    @Published var selectedPaymentMethod: PaymentMethod = .creditCard
    @Published var cardNumber = ""
    @Published var expiryMonth = ""
    @Published var expiryYear = ""
    @Published var cvv = ""
    @Published var cardHolderName = ""
    @Published var isApplePayAvailable = false
    
    private let apiService: APIService
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        checkApplePayAvailability()
    }
    
    private func checkApplePayAvailability() {
        isApplePayAvailable = PKPaymentAuthorizationController.canMakePayments()
    }
    
    func processPayment(request: PaymentRequest) async {
        isLoading = true
        errorMessage = nil
        
        do {
            let response: PaymentResponse = try await apiService.request(
                endpoint: "/payments",
                method: "POST",
                body: try JSONEncoder().encode(request)
            )
            payment = response.data
            showPaymentSheet = false
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func validateCardDetails() -> Bool {
        // Basic validation
        guard !cardNumber.isEmpty,
              cardNumber.count >= 15,
              !expiryMonth.isEmpty,
              !expiryYear.isEmpty,
              !cvv.isEmpty,
              !cardHolderName.isEmpty else {
            errorMessage = "Please fill in all card details"
            showError = true
            return false
        }
        
        // Validate expiry date
        if let month = Int(expiryMonth),
           let year = Int(expiryYear),
           let expiryDate = Calendar.current.date(from: DateComponents(year: year, month: month)) {
            if expiryDate < Date() {
                errorMessage = "Card has expired"
                showError = true
                return false
            }
        } else {
            errorMessage = "Invalid expiry date"
            showError = true
            return false
        }
        
        return true
    }
    
    func formatCardNumber() {
        // Remove non-digits
        let digits = cardNumber.filter { $0.isNumber }
        
        // Limit to 16 digits
        if digits.count > 16 {
            cardNumber = String(digits.prefix(16))
            return
        }
        
        // Add spaces every 4 digits
        var formatted = ""
        for (index, digit) in digits.enumerated() {
            if index > 0 && index % 4 == 0 {
                formatted += " "
            }
            formatted += String(digit)
        }
        
        cardNumber = formatted
    }
    
    func formatExpiryMonth() {
        let digits = expiryMonth.filter { $0.isNumber }
        if let month = Int(digits), month >= 1, month <= 12 {
            expiryMonth = String(format: "%02d", month)
        } else {
            expiryMonth = ""
        }
    }
    
    func formatExpiryYear() {
        let digits = expiryYear.filter { $0.isNumber }
        if digits.count > 4 {
            expiryYear = String(digits.prefix(4))
        } else {
            expiryYear = digits
        }
    }
    
    func formatCVV() {
        let digits = cvv.filter { $0.isNumber }
        if digits.count > 4 {
            cvv = String(digits.prefix(4))
        } else {
            cvv = digits
        }
    }
} 