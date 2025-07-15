import SwiftUI
import Kingfisher

struct ProfileView: View {
    // MARK: - Properties
    var userId: String?
    var onNavigateBack: () -> Void
    var onNavigateToSettings: () -> Void
    
    @StateObject private var viewModel = ProfileViewModel()
    @State private var showingEditProfile = false
    @State private var showingActionSheet = false
    
    // MARK: - Body
    var body: some View {
        ScrollView {
            VStack(spacing: 0) {
                // Header with profile image and cover photo
                headerSection
                
                // User info section
                userInfoSection
                
                // Stats section
                statsSection
                
                // Action buttons
                actionButtonsSection
                
                // Content tabs
                tabsSection
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            ToolbarItem(placement: .navigationBarLeading) {
                Button(action: onNavigateBack) {
                    Image(systemName: "arrow.left")
                        .foregroundColor(.primary)
                }
            }
            
            ToolbarItem(placement: .navigationBarTrailing) {
                Button(action: {
                    showingActionSheet = true
                }) {
                    Image(systemName: "ellipsis")
                        .foregroundColor(.primary)
                }
            }
        }
        .onAppear {
            viewModel.loadProfile(userId: userId)
        }
        .sheet(isPresented: $showingEditProfile) {
            EditProfileView(user: viewModel.user, onDismiss: {
                showingEditProfile = false
                viewModel.loadProfile(userId: userId)
            })
        }
        .actionSheet(isPresented: $showingActionSheet) {
            ActionSheet(
                title: Text("Profile Options"),
                buttons: [
                    .default(Text("Settings")) { onNavigateToSettings() },
                    .default(Text("Share Profile")) { viewModel.shareProfile() },
                    .default(Text("Report User")) { viewModel.reportUser() },
                    .cancel()
                ]
            )
        }
    }
    
    // MARK: - UI Components
    
    private var headerSection: some View {
        ZStack(alignment: .bottom) {
            // Cover photo
            if let coverPhotoUrl = viewModel.user?.coverPhotoUrl, !coverPhotoUrl.isEmpty {
                KFImage(URL(string: coverPhotoUrl))
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 180)
                    .clipped()
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 180)
            }
            
            // Profile photo
            VStack {
                if let profilePhotoUrl = viewModel.user?.profilePhotoUrl, !profilePhotoUrl.isEmpty {
                    KFImage(URL(string: profilePhotoUrl))
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 100, height: 100)
                        .clipShape(Circle())
                        .overlay(Circle().stroke(Color.white, lineWidth: 4))
                        .shadow(radius: 3)
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 100, height: 100)
                        .foregroundColor(.gray)
                        .overlay(Circle().stroke(Color.white, lineWidth: 4))
                        .shadow(radius: 3)
                }
                
                // Edit profile button if it's the user's own profile
                if viewModel.isCurrentUserProfile {
                    Button(action: {
                        showingEditProfile = true
                    }) {
                        Text("Edit Profile")
                            .font(.system(size: 14, weight: .medium))
                            .padding(.horizontal, 16)
                            .padding(.vertical, 8)
                            .background(Color.blue)
                            .foregroundColor(.white)
                            .cornerRadius(20)
                    }
                    .padding(.top, 8)
                }
            }
            .offset(y: 50)
        }
        .padding(.bottom, 60)
    }
    
    private var userInfoSection: some View {
        VStack(spacing: 4) {
            Text(viewModel.user?.fullName ?? "Loading...")
                .font(.title2)
                .fontWeight(.bold)
            
            Text(viewModel.user?.username ?? "@username")
                .font(.subheadline)
                .foregroundColor(.gray)
            
            if let bio = viewModel.user?.bio, !bio.isEmpty {
                Text(bio)
                    .font(.body)
                    .multilineTextAlignment(.center)
                    .padding(.top, 8)
                    .padding(.horizontal)
            }
            
            HStack {
                if let location = viewModel.user?.location?.city, !location.isEmpty {
                    HStack(spacing: 4) {
                        Image(systemName: "mappin.and.ellipse")
                            .foregroundColor(.gray)
                        Text(location)
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                if let joinDate = viewModel.user?.createdAt {
                    HStack(spacing: 4) {
                        Image(systemName: "calendar")
                            .foregroundColor(.gray)
                        Text("Joined \(formatDate(date: joinDate))")
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
            }
            .padding(.top, 4)
        }
        .padding(.top, 40)
        .padding(.horizontal)
    }
    
    private var statsSection: some View {
        HStack(spacing: 24) {
            VStack {
                Text("\(viewModel.user?.eventCount ?? 0)")
                    .font(.headline)
                Text("Events")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            VStack {
                Text("\(viewModel.user?.followerCount ?? 0)")
                    .font(.headline)
                Text("Followers")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
            
            VStack {
                Text("\(viewModel.user?.followingCount ?? 0)")
                    .font(.headline)
                Text("Following")
                    .font(.caption)
                    .foregroundColor(.gray)
            }
        }
        .padding(.vertical, 16)
    }
    
    private var actionButtonsSection: some View {
        HStack(spacing: 16) {
            if !viewModel.isCurrentUserProfile {
                Button(action: {
                    viewModel.toggleFollow()
                }) {
                    Text(viewModel.isFollowing ? "Following" : "Follow")
                        .font(.system(size: 14, weight: .medium))
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(viewModel.isFollowing ? Color.gray.opacity(0.2) : Color.blue)
                        .foregroundColor(viewModel.isFollowing ? .primary : .white)
                        .cornerRadius(20)
                }
                
                Button(action: {
                    viewModel.startChat()
                }) {
                    Text("Message")
                        .font(.system(size: 14, weight: .medium))
                        .padding(.horizontal, 20)
                        .padding(.vertical, 8)
                        .background(Color.gray.opacity(0.2))
                        .foregroundColor(.primary)
                        .cornerRadius(20)
                }
            }
        }
        .padding(.vertical, 8)
    }
    
    private var tabsSection: some View {
        VStack(spacing: 0) {
            // Tab headers
            HStack(spacing: 0) {
                ForEach(ProfileTab.allCases, id: \.self) { tab in
                    Button(action: {
                        viewModel.selectedTab = tab
                    }) {
                        VStack(spacing: 8) {
                            Text(tab.title)
                                .font(.subheadline)
                                .fontWeight(viewModel.selectedTab == tab ? .semibold : .regular)
                                .foregroundColor(viewModel.selectedTab == tab ? .primary : .gray)
                            
                            Rectangle()
                                .fill(viewModel.selectedTab == tab ? Color.blue : Color.clear)
                                .frame(height: 2)
                        }
                        .frame(maxWidth: .infinity)
                    }
                }
            }
            .padding(.top, 8)
            
            // Tab content
            switch viewModel.selectedTab {
            case .events:
                eventsTab
            case .about:
                aboutTab
            case .reviews:
                reviewsTab
            }
        }
        .padding(.top, 16)
    }
    
    private var eventsTab: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView()
                    .padding()
            } else if viewModel.events.isEmpty {
                emptyStateView(
                    icon: "calendar",
                    title: "No Events",
                    message: "No events have been created yet."
                )
            } else {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.events, id: \.id) { event in
                        EventCardView(event: event)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
        }
        .frame(minHeight: 300)
    }
    
    private var aboutTab: some View {
        VStack(alignment: .leading, spacing: 16) {
            if let user = viewModel.user {
                // Bio section
                VStack(alignment: .leading, spacing: 8) {
                    Text("Bio")
                        .font(.headline)
                    
                    Text(user.bio ?? "No bio provided")
                        .font(.body)
                }
                
                Divider()
                
                // Interests section
                VStack(alignment: .leading, spacing: 8) {
                    Text("Interests")
                        .font(.headline)
                    
                    if let interests = user.interests, !interests.isEmpty {
                        FlowLayout(spacing: 8) {
                            ForEach(interests, id: \.id) { category in
                                Text(category.name)
                                    .font(.caption)
                                    .padding(.horizontal, 12)
                                    .padding(.vertical, 6)
                                    .background(Color.blue.opacity(0.1))
                                    .foregroundColor(.blue)
                                    .cornerRadius(16)
                            }
                        }
                    } else {
                        Text("No interests specified")
                            .font(.body)
                            .foregroundColor(.gray)
                    }
                }
                
                Divider()
                
                // Contact info
                VStack(alignment: .leading, spacing: 8) {
                    Text("Contact")
                        .font(.headline)
                    
                    HStack {
                        Image(systemName: "envelope")
                            .foregroundColor(.gray)
                        Text(user.email)
                            .font(.body)
                    }
                    
                    if let phone = user.phoneNumber, !phone.isEmpty {
                        HStack {
                            Image(systemName: "phone")
                                .foregroundColor(.gray)
                            Text(phone)
                                .font(.body)
                        }
                    }
                }
            } else {
                ProgressView()
            }
        }
        .padding()
        .frame(minHeight: 300)
    }
    
    private var reviewsTab: some View {
        VStack {
            if viewModel.isLoading {
                ProgressView()
                    .padding()
            } else if viewModel.reviews.isEmpty {
                emptyStateView(
                    icon: "star",
                    title: "No Reviews",
                    message: "No reviews have been received yet."
                )
            } else {
                LazyVStack(spacing: 16) {
                    ForEach(viewModel.reviews, id: \.id) { review in
                        ReviewCardView(review: review)
                            .padding(.horizontal)
                    }
                }
                .padding(.vertical)
            }
        }
        .frame(minHeight: 300)
    }
    
    private func emptyStateView(icon: String, title: String, message: String) -> some View {
        VStack(spacing: 16) {
            Image(systemName: icon)
                .font(.system(size: 50))
                .foregroundColor(.gray)
            
            Text(title)
                .font(.headline)
            
            Text(message)
                .font(.subheadline)
                .foregroundColor(.gray)
                .multilineTextAlignment(.center)
        }
        .padding()
        .frame(maxWidth: .infinity, minHeight: 200)
    }
    
    // MARK: - Helper Methods
    
    private func formatDate(date: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        guard let parsedDate = dateFormatter.date(from: date) else {
            return "Unknown date"
        }
        
        dateFormatter.dateFormat = "MMM yyyy"
        return dateFormatter.string(from: parsedDate)
    }
}

// MARK: - Profile Tab Enum
enum ProfileTab: String, CaseIterable {
    case events
    case about
    case reviews
    
    var title: String {
        switch self {
        case .events: return "Events"
        case .about: return "About"
        case .reviews: return "Reviews"
        }
    }
}

// MARK: - Flow Layout for Tags
struct FlowLayout: Layout {
    var spacing: CGFloat
    
    func sizeThatFits(proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) -> CGSize {
        let width = proposal.width ?? .infinity
        var height: CGFloat = 0
        var x: CGFloat = 0
        var y: CGFloat = 0
        var maxHeight: CGFloat = 0
        
        for view in subviews {
            let size = view.sizeThatFits(proposal)
            if x + size.width > width {
                x = 0
                y += maxHeight + spacing
                maxHeight = 0
            }
            
            maxHeight = max(maxHeight, size.height)
            x += size.width + spacing
            
            if x > width {
                height = y + maxHeight
            }
        }
        
        return CGSize(width: width, height: max(height, y + maxHeight))
    }
    
    func placeSubviews(in bounds: CGRect, proposal: ProposedViewSize, subviews: Subviews, cache: inout ()) {
        var x = bounds.minX
        var y = bounds.minY
        var maxHeight: CGFloat = 0
        let width = bounds.width
        
        for view in subviews {
            let size = view.sizeThatFits(proposal)
            if x + size.width > width + bounds.minX {
                x = bounds.minX
                y += maxHeight + spacing
                maxHeight = 0
            }
            
            view.place(at: CGPoint(x: x, y: y), proposal: proposal)
            maxHeight = max(maxHeight, size.height)
            x += size.width + spacing
        }
    }
}

// MARK: - Preview
struct ProfileView_Previews: PreviewProvider {
    static var previews: some View {
        NavigationView {
            ProfileView(
                userId: nil,
                onNavigateBack: {},
                onNavigateToSettings: {}
            )
        }
    }
}

// MARK: - View Model
class ProfileViewModel: ObservableObject {
    @Published var user: User?
    @Published var events: [Event] = []
    @Published var reviews: [Review] = []
    @Published var isLoading = false
    @Published var isFollowing = false
    @Published var selectedTab: ProfileTab = .events
    
    var isCurrentUserProfile: Bool {
        // Check if the profile being viewed is the current user's profile
        guard let userId = user?.id else { return true }
        return userId == UserDefaults.standard.string(forKey: "currentUserId")
    }
    
    func loadProfile(userId: String?) {
        isLoading = true
        
        // If userId is nil, load current user's profile
        let targetUserId = userId ?? UserDefaults.standard.string(forKey: "currentUserId") ?? ""
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 1) {
            self.user = User.mockUser(id: targetUserId)
            self.isLoading = false
            self.loadEvents()
            self.loadReviews()
            self.checkFollowStatus()
        }
    }
    
    func loadEvents() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.events = Event.mockEvents(count: 3)
            self.isLoading = false
        }
    }
    
    func loadReviews() {
        isLoading = true
        
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.5) {
            self.reviews = Review.mockReviews(count: 2)
            self.isLoading = false
        }
    }
    
    func checkFollowStatus() {
        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 0.3) {
            self.isFollowing = Bool.random()
        }
    }
    
    func toggleFollow() {
        isFollowing.toggle()
        
        // Update follower count
        if isFollowing {
            user?.followerCount = (user?.followerCount ?? 0) + 1
        } else {
            user?.followerCount = max(0, (user?.followerCount ?? 0) - 1)
        }
        
        // Simulate API call
        // In a real app, you would call an API to follow/unfollow the user
    }
    
    func startChat() {
        // Simulate starting a chat with the user
        // In a real app, you would navigate to a chat screen
    }
    
    func shareProfile() {
        // Simulate sharing the profile
        // In a real app, you would use UIActivityViewController
    }
    
    func reportUser() {
        // Simulate reporting the user
        // In a real app, you would show a report form
    }
}

// MARK: - Helper Components

struct EventCardView: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading) {
            // Event Image
            if let imageUrl = event.images?.first, !imageUrl.isEmpty {
                KFImage(URL(string: imageUrl))
                    .resizable()
                    .aspectRatio(contentMode: .fill)
                    .frame(height: 150)
                    .clipped()
                    .cornerRadius(8)
            } else {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 150)
                    .cornerRadius(8)
                    .overlay(
                        Image(systemName: "calendar")
                            .font(.largeTitle)
                            .foregroundColor(.gray)
                    )
            }
            
            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text(event.description)
                    .font(.subheadline)
                    .foregroundColor(.gray)
                    .lineLimit(2)
                
                HStack {
                    Image(systemName: "calendar")
                        .foregroundColor(.blue)
                    
                    Text(formatDate(date: event.startDate))
                        .font(.caption)
                        .foregroundColor(.gray)
                }
            }
            .padding(.vertical, 8)
        }
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: Color.black.opacity(0.1), radius: 5, y: 2)
    }
    
    private func formatDate(date: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        guard let parsedDate = dateFormatter.date(from: date) else {
            return "Unknown date"
        }
        
        dateFormatter.dateFormat = "MMM d, yyyy"
        return dateFormatter.string(from: parsedDate)
    }
}

struct ReviewCardView: View {
    let review: Review
    
    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            HStack {
                // User Image
                if let userAvatar = review.userAvatar, !userAvatar.isEmpty {
                    KFImage(URL(string: userAvatar))
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                        .frame(width: 40, height: 40)
                        .clipShape(Circle())
                } else {
                    Image(systemName: "person.circle.fill")
                        .resizable()
                        .frame(width: 40, height: 40)
                        .foregroundColor(.gray)
                }
                
                VStack(alignment: .leading) {
                    Text(review.userName)
                        .font(.headline)
                    
                    HStack {
                        ForEach(1...5, id: \.self) { index in
                            Image(systemName: index <= review.rating ? "star.fill" : "star")
                                .foregroundColor(index <= review.rating ? .yellow : .gray)
                        }
                        
                        Text(formatDate(date: review.createdAt))
                            .font(.caption)
                            .foregroundColor(.gray)
                    }
                }
                
                Spacer()
            }
            
            Text(review.comment)
                .font(.body)
                .lineLimit(3)
            
            HStack {
                Button(action: {}) {
                    HStack {
                        Image(systemName: "hand.thumbsup")
                        Text("\(review.helpfulCount)")
                    }
                    .font(.caption)
                    .foregroundColor(.gray)
                }
                
                Spacer()
                
                Button(action: {}) {
                    Text("Report")
                        .font(.caption)
                        .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color(.systemBackground))
        .cornerRadius(8)
        .shadow(color: Color.black.opacity(0.1), radius: 5, y: 2)
    }
    
    private func formatDate(date: String) -> String {
        let dateFormatter = DateFormatter()
        dateFormatter.dateFormat = "yyyy-MM-dd'T'HH:mm:ss.SSSZ"
        
        guard let parsedDate = dateFormatter.date(from: date) else {
            return "Unknown date"
        }
        
        dateFormatter.dateFormat = "MMM d, yyyy"
        return dateFormatter.string(from: parsedDate)
    }
} 