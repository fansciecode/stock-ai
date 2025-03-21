import SwiftUI

struct AuthView: View {
    @State private var showingLogin = true
    
    var body: some View {
        NavigationView {
            VStack {
                // Header
                Image("logo")
                    .resizable()
                    .scaledToFit()
                    .frame(width: 120, height: 120)
                    .padding(.top, 50)
                
                Text("IBCM")
                    .font(.largeTitle)
                    .fontWeight(.bold)
                    .padding(.bottom, 50)
                
                // Content
                if showingLogin {
                    LoginView()
                } else {
                    SignupView()
                }
                
                // Switch between login and signup
                Button(action: {
                    withAnimation {
                        showingLogin.toggle()
                    }
                }) {
                    Text(showingLogin ? "Don't have an account? Sign up" : "Already have an account? Log in")
                        .foregroundColor(.blue)
                }
                .padding()
            }
            .padding()
        }
    }
}

struct AuthView_Previews: PreviewProvider {
    static var previews: some View {
        AuthView()
            .environmentObject(AppState())
    }
} 