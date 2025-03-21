import SwiftUI

struct VerificationView: View {
    @StateObject private var viewModel = VerificationViewModel()
    @Environment(\.dismiss) private var dismiss
    
    var body: some View {
        NavigationView {
            Form {
                // Verification Type Selection
                Section(header: Text("Verification Type")) {
                    Picker("Type", selection: $viewModel.selectedType) {
                        ForEach(VerificationType.allCases, id: \.self) { type in
                            HStack {
                                Image(systemName: type.systemImage)
                                Text(type.displayName)
                            }
                            .tag(type)
                        }
                    }
                }
                
                // Verification Details
                Section(header: Text("Details")) {
                    switch viewModel.selectedType {
                    case .email:
                        TextField("Email Address", text: $viewModel.email)
                            .textContentType(.emailAddress)
                            .keyboardType(.emailAddress)
                            .autocapitalization(.none)
                    
                    case .phone:
                        TextField("Phone Number", text: $viewModel.phone)
                            .textContentType(.telephoneNumber)
                            .keyboardType(.phonePad)
                            .onChange(of: viewModel.phone) { _ in
                                viewModel.formatPhoneNumber()
                            }
                    
                    case .identity:
                        Picker("Document Type", selection: $viewModel.documentType) {
                            Text("Passport").tag("passport")
                            Text("Driver's License").tag("driver_license")
                            Text("ID Card").tag("id_card")
                        }
                        
                        TextField("Document Number", text: $viewModel.documentNumber)
                            .textContentType(.none)
                            .autocapitalization(.none)
                        
                        DatePicker(
                            "Document Expiry",
                            selection: $viewModel.documentExpiry,
                            in: Date()...,
                            displayedComponents: .date
                        )
                    
                    case .address:
                        TextField("Street", text: $viewModel.address.street)
                            .textContentType(.streetAddressLine1)
                        
                        TextField("City", text: $viewModel.address.city)
                            .textContentType(.addressCity)
                        
                        TextField("State", text: $viewModel.address.state)
                            .textContentType(.addressState)
                        
                        TextField("ZIP Code", text: $viewModel.address.zipCode)
                            .textContentType(.postalCode)
                            .keyboardType(.numberPad)
                        
                        TextField("Country", text: $viewModel.address.country)
                            .textContentType(.countryName)
                    }
                }
                
                // Start Verification Button
                Section {
                    Button(action: {
                        if viewModel.validateInput() {
                            Task {
                                await viewModel.startVerification()
                            }
                        }
                    }) {
                        Text("Start Verification")
                            .frame(maxWidth: .infinity)
                    }
                    .disabled(viewModel.isLoading)
                }
            }
            .navigationTitle("Verification")
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
            .sheet(isPresented: $viewModel.showVerificationSheet) {
                VerificationCodeView(viewModel: viewModel)
            }
            .overlay {
                if viewModel.isLoading {
                    ProgressView()
                }
            }
        }
    }
}

struct VerificationCodeView: View {
    @ObservedObject var viewModel: VerificationViewModel
    @Environment(\.dismiss) private var dismiss
    @State private var remainingTime = 60
    let timer = Timer.publish(every: 1, on: .main, in: .common).autoconnect()
    
    var body: some View {
        NavigationView {
            VStack(spacing: 20) {
                // Verification Type Icon
                Image(systemName: viewModel.verification?.type.systemImage ?? "")
                    .font(.system(size: 48))
                    .foregroundColor(.accentColor)
                
                // Instructions
                Text("Enter Verification Code")
                    .font(.title2)
                    .fontWeight(.semibold)
                
                Text("A verification code has been sent to your \(viewModel.selectedType == .email ? "email" : "phone")")
                    .foregroundColor(.secondary)
                    .multilineTextAlignment(.center)
                    .padding(.horizontal)
                
                // Code Input
                TextField("Enter Code", text: $viewModel.verificationCode)
                    .textFieldStyle(.roundedBorder)
                    .keyboardType(.numberPad)
                    .multilineTextAlignment(.center)
                    .frame(maxWidth: 200)
                
                // Timer and Resend Button
                if remainingTime > 0 {
                    Text("Resend code in \(remainingTime)s")
                        .foregroundColor(.secondary)
                        .onReceive(timer) { _ in
                            if remainingTime > 0 {
                                remainingTime -= 1
                            }
                        }
                } else {
                    Button("Resend Code") {
                        Task {
                            await viewModel.resendCode()
                            remainingTime = 60
                        }
                    }
                }
                
                // Verify Button
                Button(action: {
                    Task {
                        await viewModel.verifyCode()
                    }
                }) {
                    Text("Verify")
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(Color.accentColor)
                        .foregroundColor(.white)
                        .cornerRadius(10)
                }
                .padding(.horizontal)
                .disabled(viewModel.verificationCode.isEmpty || viewModel.isLoading)
            }
            .padding()
            .navigationTitle("Verification")
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

#Preview {
    VerificationView()
} 