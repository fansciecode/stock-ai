import SwiftUI
import PassKit

struct PaymentView: View {
    @StateObject private var viewModel = PaymentViewModel()
    let order: Order
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                // Payment Method Selection
                Section(header: Text("Payment Method")) {
                    ForEach(PaymentMethod.allCases, id: \.self) { method in
                        if method != .applePay || viewModel.isApplePayAvailable {
                            Button(action: { viewModel.selectedPaymentMethod = method }) {
                                HStack {
                                    Image(systemName: method.systemImage)
                                        .foregroundColor(.accentColor)
                                    Text(method.displayName)
                                    Spacer()
                                    if viewModel.selectedPaymentMethod == method {
                                        Image(systemName: "checkmark")
                                            .foregroundColor(.accentColor)
                                    }
                                }
                            }
                        }
                    }
                }
                
                // Card Details
                if viewModel.selectedPaymentMethod == .creditCard || viewModel.selectedPaymentMethod == .debitCard {
                    Section(header: Text("Card Details")) {
                        TextField("Card Number", text: $viewModel.cardNumber)
                            .keyboardType(.numberPad)
                            .onChange(of: viewModel.cardNumber) { _ in
                                viewModel.formatCardNumber()
                            }
                        
                        HStack {
                            TextField("MM", text: $viewModel.expiryMonth)
                                .keyboardType(.numberPad)
                                .frame(width: 50)
                                .onChange(of: viewModel.expiryMonth) { _ in
                                    viewModel.formatExpiryMonth()
                                }
                            Text("/")
                            TextField("YYYY", text: $viewModel.expiryYear)
                                .keyboardType(.numberPad)
                                .frame(width: 60)
                                .onChange(of: viewModel.expiryYear) { _ in
                                    viewModel.formatExpiryYear()
                                }
                        }
                        
                        SecureField("CVV", text: $viewModel.cvv)
                            .keyboardType(.numberPad)
                            .onChange(of: viewModel.cvv) { _ in
                                viewModel.formatCVV()
                            }
                        
                        TextField("Cardholder Name", text: $viewModel.cardHolderName)
                            .textContentType(.name)
                    }
                }
                
                // Order Summary
                Section(header: Text("Order Summary")) {
                    HStack {
                        Text("Total Amount")
                        Spacer()
                        Text(order.formattedTotal)
                            .fontWeight(.semibold)
                    }
                }
                
                // Payment Button
                Section {
                    if viewModel.selectedPaymentMethod == .applePay {
                        PaymentButton(action: .buy) {
                            // Handle Apple Pay
                        }
                    } else {
                        Button(action: {
                            Task {
                                if viewModel.validateCardDetails() {
                                    let request = PaymentRequest(
                                        orderId: order.id,
                                        amount: order.totalAmount,
                                        currency: "USD",
                                        method: viewModel.selectedPaymentMethod,
                                        billingAddress: nil,
                                        cardDetails: viewModel.selectedPaymentMethod == .creditCard || viewModel.selectedPaymentMethod == .debitCard ? CardDetails(
                                            last4: String(viewModel.cardNumber.suffix(4)),
                                            brand: "visa", // This should be determined based on the card number
                                            expiryMonth: Int(viewModel.expiryMonth) ?? 0,
                                            expiryYear: Int(viewModel.expiryYear) ?? 0
                                        ) : nil
                                    )
                                    await viewModel.processPayment(request: request)
                                    if viewModel.payment != nil {
                                        dismiss()
                                    }
                                }
                            }
                        }) {
                            Text("Pay \(order.formattedTotal)")
                                .frame(maxWidth: .infinity)
                        }
                        .buttonStyle(.borderedProminent)
                        .disabled(viewModel.isLoading)
                    }
                }
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
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
        }
    }
}

struct PaymentButton: View {
    enum PaymentButtonType {
        case buy
        case setup
        case checkout
        
        var text: String {
            switch self {
            case .buy: return "Buy with"
            case .setup: return "Set up"
            case .checkout: return "Check out with"
            }
        }
    }
    
    let type: PaymentButtonType
    let action: () -> Void
    
    init(action: PaymentButtonType = .buy, action: @escaping () -> Void) {
        self.type = action
        self.action = action
    }
    
    var body: some View {
        HStack {
            Text(type.text)
            Image(systemName: "apple.logo")
            Text("Pay")
        }
        .foregroundColor(.white)
        .padding()
        .frame(maxWidth: .infinity)
        .background(Color.black)
        .cornerRadius(8)
        .onTapGesture(perform: action)
    }
}

#Preview {
    PaymentView(order: Order(
        id: "123",
        userId: "user123",
        items: [],
        status: .pending,
        totalAmount: 99.99,
        paymentStatus: .pending,
        createdAt: Date(),
        updatedAt: Date(),
        shippingAddress: nil,
        billingAddress: nil,
        trackingNumber: nil,
        estimatedDeliveryDate: nil,
        notes: nil
    ))
} 