import SwiftUI

struct AuthView: View {
    @State private var email = ""
    @State private var password = ""
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        VStack(spacing: 20) {
            Text("IBCM")
                .font(.largeTitle)
                .fontWeight(.bold)
            
            TextField("Email", text: $email)
                .textFieldStyle(RoundedBorderTextFieldStyle())
                .autocapitalization(.none)
                .keyboardType(.emailAddress)
            
            SecureField("Password", text: $password)
                .textFieldStyle(RoundedBorderTextFieldStyle())
            
            Button(action: {
                // Simulate login
                appState.isAuthenticated = true
            }) {
                Text("Sign In")
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(Color.blue)
                    .foregroundColor(.white)
                    .cornerRadius(10)
            }
            
            Button(action: {
                // Handle sign up
            }) {
                Text("Create Account")
                    .foregroundColor(.blue)
            }
            .padding(.top, 10)
        }
        .padding(.horizontal, 30)
    }
}

struct AuthView_Previews: PreviewProvider {
    static var previews: some View {
        AuthView()
            .environmentObject(AppState())
    }
} 