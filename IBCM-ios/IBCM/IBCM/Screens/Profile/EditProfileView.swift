import SwiftUI
import PhotosUI
import Kingfisher

struct EditProfileView: View {
    // MARK: - Properties
    var user: User?
    var onDismiss: () -> Void
    
    @StateObject private var viewModel = EditProfileViewModel()
    @Environment(\.presentationMode) private var presentationMode
    @State private var showingImagePicker = false
    @State private var showingCoverImagePicker = false
    @State private var showingInterestsSheet = false
    
    // MARK: - Body
    var body: some View {
        NavigationView {
            Form {
                // Profile Images Section
                Section {
                    VStack(spacing: 0) {
                        // Cover photo
                        ZStack(alignment: .bottomTrailing) {
                            if let coverImage = viewModel.coverImage {
                                Image(uiImage: coverImage)
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(height: 120)
                                    .clipped()
                            } else if let coverPhotoUrl = viewModel.coverPhotoUrl, !coverPhotoUrl.isEmpty {
                                KFImage(URL(string: coverPhotoUrl))
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                                    .frame(height: 120)
                                    .clipped()
                            } else {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                                    .frame(height: 120)
                            }
                            
                            Button(action: {
                                showingCoverImagePicker = true
                            }) {
                                Image(systemName: "camera.fill")
                                    .foregroundColor(.white)
                                    .padding(8)
                                    .background(Color.black.opacity(0.6))
                                    .clipShape(Circle())
                            }
                            .padding(8)
                        }
                        
                        // Profile photo
                        ZStack(alignment: .bottomTrailing) {
                            HStack {
                                Spacer()
                                
                                if let profileImage = viewModel.profileImage {
                                    Image(uiImage: profileImage)
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(width: 80, height: 80)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                } else if let profilePhotoUrl = viewModel.profilePhotoUrl, !profilePhotoUrl.isEmpty {
                                    KFImage(URL(string: profilePhotoUrl))
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                        .frame(width: 80, height: 80)
                                        .clipShape(Circle())
                                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                } else {
                                    Image(systemName: "person.circle.fill")
                                        .resizable()
                                        .frame(width: 80, height: 80)
                                        .foregroundColor(.gray)
                                        .overlay(Circle().stroke(Color.white, lineWidth: 3))
                                }
                                
                                Spacer()
                            }
                            .offset(y: -40)
                            
                            Button(action: {
                                showingImagePicker = true
                            }) {
                                Image(systemName: "camera.fill")
                                    .foregroundColor(.white)
                                    .padding(6)
                                    .background(Color.black.opacity(0.6))
                                    .clipShape(Circle())
                            }
                            .padding(8)
                            .offset(x: -40, y: -40)
                        }
                    }
                    .listRowInsets(EdgeInsets())
                }
                
                // Basic Info Section
                Section(header: Text("Basic Information")) {
                    TextField("First Name", text: $viewModel.firstName)
                    TextField("Last Name", text: $viewModel.lastName)
                    TextField("Username", text: $viewModel.username)
                        .autocapitalization(.none)
                    
                    DatePicker(
                        "Date of Birth",
                        selection: $viewModel.dateOfBirth,
                        displayedComponents: .date
                    )
                    
                    Picker("Gender", selection: $viewModel.gender) {
                        Text("Not Specified").tag("NOT_SPECIFIED")
                        Text("Male").tag("MALE")
                        Text("Female").tag("FEMALE")
                        Text("Other").tag("OTHER")
                    }
                }
                
                // Bio Section
                Section(header: Text("Bio")) {
                    TextEditor(text: $viewModel.bio)
                        .frame(minHeight: 100)
                }
                
                // Contact Info Section
                Section(header: Text("Contact Information")) {
                    TextField("Email", text: $viewModel.email)
                        .autocapitalization(.none)
                        .keyboardType(.emailAddress)
                        .disabled(true) // Email should not be editable
                    
                    TextField("Phone Number", text: $viewModel.phoneNumber)
                        .keyboardType(.phonePad)
                }
                
                // Location Section
                Section(header: Text("Location")) {
                    TextField("City", text: $viewModel.city)
                    TextField("Country", text: $viewModel.country)
                }
                
                // Interests Section
                Section(header: Text("Interests")) {
                    Button(action: {
                        showingInterestsSheet = true
                    }) {
                        HStack {
                            Text("Select Interests")
                            Spacer()
                            Text("\(viewModel.selectedInterests.count) selected")
                                .foregroundColor(.gray)
                            Image(systemName: "chevron.right")
                                .foregroundColor(.gray)
                        }
                    }
                    
                    if !viewModel.selectedInterests.isEmpty {
                        ScrollView(.horizontal, showsIndicators: false) {
                            HStack {
                                ForEach(viewModel.selectedInterests, id: \.id) { interest in
                                    Text(interest.name)
                                        .font(.caption)
                                        .padding(.horizontal, 12)
                                        .padding(.vertical, 6)
                                        .background(Color.blue.opacity(0.1))
                                        .foregroundColor(.blue)
                                        .cornerRadius(16)
                                }
                            }
                            .padding(.vertical, 4)
                        }
                    }
                }
                
                // Privacy Section
                Section(header: Text("Privacy")) {
                    Toggle("Private Profile", isOn: $viewModel.isPrivateProfile)
                    Toggle("Show Email", isOn: $viewModel.showEmail)
                    Toggle("Show Phone Number", isOn: $viewModel.showPhoneNumber)
                }
                
                // Save Button
                Section {
                    Button(action: saveProfile) {
                        if viewModel.isSaving {
                            HStack {
                                Spacer()
                                ProgressView()
                                Spacer()
                            }
                        } else {
                            HStack {
                                Spacer()
                                Text("Save Changes")
                                    .fontWeight(.semibold)
                                Spacer()
                            }
                        }
                    }
                    .disabled(viewModel.isSaving)
                }
            }
            .navigationTitle("Edit Profile")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
            }
            .onAppear {
                viewModel.initializeWithUser(user)
            }
            .sheet(isPresented: $showingImagePicker) {
                ImagePicker(image: $viewModel.profileImage)
            }
            .sheet(isPresented: $showingCoverImagePicker) {
                ImagePicker(image: $viewModel.coverImage)
            }
            .sheet(isPresented: $showingInterestsSheet) {
                InterestSelectionView(
                    selectedInterests: $viewModel.selectedInterests,
                    onDismiss: {
                        showingInterestsSheet = false
                    }
                )
            }
            .alert(isPresented: $viewModel.showAlert) {
                Alert(
                    title: Text(viewModel.alertTitle),
                    message: Text(viewModel.alertMessage),
                    dismissButton: .default(Text("OK"))
                )
            }
        }
    }
    
    // MARK: - Actions
    
    private func saveProfile() {
        viewModel.saveProfile { success in
            if success {
                onDismiss()
            }
        }
    }
}

// MARK: - Image Picker
struct ImagePicker: UIViewControllerRepresentable {
    @Binding var image: UIImage?
    @Environment(\.presentationMode) private var presentationMode
    
    func makeUIViewController(context: Context) -> PHPickerViewController {
        var config = PHPickerConfiguration()
        config.filter = .images
        config.selectionLimit = 1
        
        let picker = PHPickerViewController(configuration: config)
        picker.delegate = context.coordinator
        return picker
    }
    
    func updateUIViewController(_ uiViewController: PHPickerViewController, context: Context) {}
    
    func makeCoordinator() -> Coordinator {
        Coordinator(self)
    }
    
    class Coordinator: NSObject, PHPickerViewControllerDelegate {
        let parent: ImagePicker
        
        init(_ parent: ImagePicker) {
            self.parent = parent
        }
        
        func picker(_ picker: PHPickerViewController, didFinishPicking results: [PHPickerResult]) {
            parent.presentationMode.wrappedValue.dismiss()
            
            guard let provider = results.first?.itemProvider else { return }
            
            if provider.canLoadObject(ofClass: UIImage.self) {
                provider.loadObject(ofClass: UIImage.self) { image, error in
                    DispatchQueue.main.async {
                        self.parent.image = image as? UIImage
                    }
                }
            }
        }
    }
}

// MARK: - Interest Selection View
struct InterestSelectionView: View {
    @Binding var selectedInterests: [Category]
    var onDismiss: () -> Void
    
    @State private var allCategories: [Category] = []
    @State private var searchText = ""
    @Environment(\.presentationMode) private var presentationMode
    
    var body: some View {
        NavigationView {
            VStack {
                // Search bar
                TextField("Search interests", text: $searchText)
                    .padding(10)
                    .background(Color(.systemGray6))
                    .cornerRadius(10)
                    .padding(.horizontal)
                
                List {
                    ForEach(filteredCategories, id: \.id) { category in
                        Button(action: {
                            toggleCategory(category)
                        }) {
                            HStack {
                                Text(category.name)
                                Spacer()
                                if isSelected(category) {
                                    Image(systemName: "checkmark")
                                        .foregroundColor(.blue)
                                }
                            }
                        }
                        .foregroundColor(.primary)
                    }
                }
            }
            .navigationTitle("Select Interests")
            .navigationBarTitleDisplayMode(.inline)
            .toolbar {
                ToolbarItem(placement: .navigationBarLeading) {
                    Button("Cancel") {
                        presentationMode.wrappedValue.dismiss()
                    }
                }
                
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button("Done") {
                        onDismiss()
                    }
                }
            }
            .onAppear {
                loadCategories()
            }
        }
    }
    
    private var filteredCategories: [Category] {
        if searchText.isEmpty {
            return allCategories
        } else {
            return allCategories.filter { $0.name.localizedCaseInsensitiveContains(searchText) }
        }
    }
    
    private func isSelected(_ category: Category) -> Bool {
        return selectedInterests.contains { $0.id == category.id }
    }
    
    private func toggleCategory(_ category: Category) {
        if let index = selectedInterests.firstIndex(where: { $0.id == category.id }) {
            selectedInterests.remove(at: index)
        } else {
            selectedInterests.append(category)
        }
    }
    
    private func loadCategories() {
        // In a real app, you would fetch categories from an API
        allCategories = [
            Category.mock(name: "Music"),
            Category.mock(name: "Sports"),
            Category.mock(name: "Food"),
            Category.mock(name: "Art"),
            Category.mock(name: "Technology"),
            Category.mock(name: "Business"),
            Category.mock(name: "Education"),
            Category.mock(name: "Health"),
            Category.mock(name: "Travel"),
            Category.mock(name: "Entertainment")
        ]
    }
}

// MARK: - View Model
class EditProfileViewModel: ObservableObject {
    // Basic Info
    @Published var firstName = ""
    @Published var lastName = ""
    @Published var username = ""
    @Published var dateOfBirth = Date()
    @Published var gender = "NOT_SPECIFIED"
    @Published var bio = ""
    
    // Contact Info
    @Published var email = ""
    @Published var phoneNumber = ""
    
    // Location
    @Published var city = ""
    @Published var country = ""
    
    // Images
    @Published var profileImage: UIImage?
    @Published var coverImage: UIImage?
    @Published var profilePhotoUrl: String?
    @Published var coverPhotoUrl: String?
    
    // Interests
    @Published var selectedInterests: [Category] = []
    
    // Privacy
    @Published var isPrivateProfile = false
    @Published var showEmail = true
    @Published var showPhoneNumber = false
    
    // State
    @Published var isSaving = false
    @Published var showAlert = false
    @Published var alertTitle = ""
    @Published var alertMessage = ""
    
    func initializeWithUser(_ user: User?) {
        guard let user = user else { return }
        
        firstName = user.firstName
        lastName = user.lastName
        username = user.username ?? ""
        
        if let dobString = user.dateOfBirth {
            let formatter = DateFormatter()
            formatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
            if let date = formatter.date(from: dobString) {
                dateOfBirth = date
            }
        }
        
        gender = user.gender ?? "NOT_SPECIFIED"
        bio = user.bio ?? ""
        email = user.email
        phoneNumber = user.phoneNumber ?? ""
        
        if let location = user.location {
            city = location.city
            country = location.country ?? ""
        }
        
        profilePhotoUrl = user.profilePhotoUrl
        coverPhotoUrl = user.coverPhotoUrl
        
        selectedInterests = user.interests ?? []
        
        // In a real app, you would fetch privacy settings from the user's preferences
        isPrivateProfile = user.isPrivate ?? false
        showEmail = user.showEmail ?? true
        showPhoneNumber = user.showPhoneNumber ?? false
    }
    
    func saveProfile(completion: @escaping (Bool) -> Void) {
        isSaving = true
        
        // In a real app, you would upload the images first, then update the profile
        // For this example, we'll simulate an API call
        
        DispatchQueue.main.asyncAfter(deadline: .now() + 2) {
            // Simulate success
            self.isSaving = false
            
            // Show success alert
            self.alertTitle = "Profile Updated"
            self.alertMessage = "Your profile has been successfully updated."
            self.showAlert = true
            
            completion(true)
        }
    }
}

// MARK: - Preview
struct EditProfileView_Previews: PreviewProvider {
    static var previews: some View {
        EditProfileView(
            user: User.mockUser(),
            onDismiss: {}
        )
    }
} 