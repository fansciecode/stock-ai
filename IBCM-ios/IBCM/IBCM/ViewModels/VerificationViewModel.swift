import Foundation

@MainActor
class VerificationViewModel: ObservableObject {
    @Published var verification: Verification?
    @Published var isLoading = false
    @Published var errorMessage: String?
    @Published var showError = false
    @Published var verificationCode = ""
    @Published var showVerificationSheet = false
    @Published var selectedType: VerificationType = .email
    @Published var email = ""
    @Published var phone = ""
    @Published var documentType = ""
    @Published var documentNumber = ""
    @Published var documentExpiry = Date()
    @Published var address = Address(street: "", city: "", state: "", zipCode: "", country: "")
    
    private let apiService: APIService
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
    }
    
    func startVerification() async {
        isLoading = true
        errorMessage = nil
        
        let request = VerificationRequest(
            type: selectedType,
            email: selectedType == .email ? email : nil,
            phone: selectedType == .phone ? phone : nil,
            code: nil,
            documentType: selectedType == .identity ? documentType : nil,
            documentNumber: selectedType == .identity ? documentNumber : nil,
            documentExpiry: selectedType == .identity ? documentExpiry : nil,
            address: selectedType == .address ? address : nil
        )
        
        do {
            let response: VerificationResponse = try await apiService.request(
                endpoint: "/verifications",
                method: "POST",
                body: try JSONEncoder().encode(request)
            )
            verification = response.data
            showVerificationSheet = true
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func verifyCode() async {
        guard let verification = verification else { return }
        
        isLoading = true
        errorMessage = nil
        
        let request = VerificationRequest(
            type: verification.type,
            email: nil,
            phone: nil,
            code: verificationCode,
            documentType: nil,
            documentNumber: nil,
            documentExpiry: nil,
            address: nil
        )
        
        do {
            let response: VerificationResponse = try await apiService.request(
                endpoint: "/verifications/\(verification.id)/verify",
                method: "POST",
                body: try JSONEncoder().encode(request)
            )
            self.verification = response.data
            
            if response.data.status == .verified {
                showVerificationSheet = false
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func resendCode() async {
        guard let verification = verification else { return }
        
        isLoading = true
        errorMessage = nil
        
        do {
            let response: VerificationResponse = try await apiService.request(
                endpoint: "/verifications/\(verification.id)/resend",
                method: "POST"
            )
            self.verification = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func validateInput() -> Bool {
        switch selectedType {
        case .email:
            guard !email.isEmpty else {
                errorMessage = "Please enter your email address"
                showError = true
                return false
            }
            // Basic email validation
            let emailRegex = "[A-Z0-9a-z._%+-]+@[A-Za-z0-9.-]+\\.[A-Za-z]{2,64}"
            let emailPredicate = NSPredicate(format: "SELF MATCHES %@", emailRegex)
            guard emailPredicate.evaluate(with: email) else {
                errorMessage = "Please enter a valid email address"
                showError = true
                return false
            }
            
        case .phone:
            guard !phone.isEmpty else {
                errorMessage = "Please enter your phone number"
                showError = true
                return false
            }
            // Basic phone validation (numbers and + only)
            let phoneRegex = "^[+]?[0-9]{10,15}$"
            let phonePredicate = NSPredicate(format: "SELF MATCHES %@", phoneRegex)
            guard phonePredicate.evaluate(with: phone) else {
                errorMessage = "Please enter a valid phone number"
                showError = true
                return false
            }
            
        case .identity:
            guard !documentType.isEmpty,
                  !documentNumber.isEmpty else {
                errorMessage = "Please fill in all document details"
                showError = true
                return false
            }
            
        case .address:
            guard !address.street.isEmpty,
                  !address.city.isEmpty,
                  !address.state.isEmpty,
                  !address.zipCode.isEmpty,
                  !address.country.isEmpty else {
                errorMessage = "Please fill in all address fields"
                showError = true
                return false
            }
        }
        
        return true
    }
    
    func formatPhoneNumber() {
        // Remove non-digits and +
        let filtered = phone.filter { $0.isNumber || $0 == "+" }
        
        // Ensure only one + at the start
        if filtered.hasPrefix("+") {
            phone = "+" + filtered.dropFirst().filter { $0.isNumber }
        } else {
            phone = filtered
        }
    }
} 