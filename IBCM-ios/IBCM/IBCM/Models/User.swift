import Foundation

// MARK: - Location Model
struct Location: Codable, Hashable {
    let type: String
    let coordinates: [Double]?
    let city: String?
    let address: String?
    let country: String?
    let state: String?
    let zipCode: String?

    init(city: String? = nil, address: String? = nil, coordinates: [Double]? = nil, type: String = "Point") {
        self.type = type
        self.city = city
        self.address = address
        self.coordinates = coordinates
        self.country = nil
        self.state = nil
        self.zipCode = nil
    }
}

// MARK: - Business Info Model
struct BusinessInfo: Codable {
    let categories: [String]?
    let verified: Bool?
    let businessName: String?
    let businessType: String?
    let businessDescription: String?
    let website: String?
    let socialLinks: [String: String]?
}

// MARK: - Event Package Model
struct EventPackage: Codable, Identifiable {
    let id: String
    let name: String
    let price: Double
    let features: [String]
    let maxAttendees: Int?
    let isActive: Bool
    let description: String?
}

// MARK: - User Model (Exact Android Mirror)
struct User: Codable, Identifiable {
    let id: String
    let firstName: String?
    let lastName: String?
    let name: String?
    let displayName: String?
    let email: String
    let profilePictureUrl: String?
    let backgroundImageUrl: String?
    let phoneNumber: String?
    let dateOfBirth: String?
    let gender: String?
    let location: Location?
    let bio: String?
    let interests: [String]
    let joinDate: String?
    let isVerified: Bool
    let isAdmin: Bool
    let verificationBadge: String?
    let businessInfo: BusinessInfo?
    let fcmTokens: [String]?
    let role: UserRole
    let lastLoginDate: String?
    let status: UserStatus
    let token: String?
    let refreshToken: String?
    let followersCount: Int
    let followingCount: Int
    let eventsCreated: Int
    let eventsAttended: Int
    let totalSpent: Double
    let currentPackage: EventPackage?
    let packageExpiryDate: String?
    let isOnline: Bool
    let lastSeen: String?
    let preferences: UserPreferences?

    var fullName: String {
        if let firstName = firstName, let lastName = lastName {
            return "\(firstName) \(lastName)"
        }
        return name ?? displayName ?? "Unknown User"
    }

    enum CodingKeys: String, CodingKey {
        case id, firstName, lastName, name, displayName, email
        case profilePictureUrl, backgroundImageUrl, phoneNumber, dateOfBirth, gender
        case location, bio, interests, joinDate, isVerified, isAdmin
        case verificationBadge, businessInfo, fcmTokens, role, lastLoginDate
        case status, token, refreshToken, followersCount, followingCount
        case eventsCreated, eventsAttended, totalSpent, currentPackage
        case packageExpiryDate, isOnline, lastSeen, preferences
    }

    init(from decoder: Decoder) throws {
        let container = try decoder.container(keyedBy: CodingKeys.self)

        id = try container.decode(String.self, forKey: .id)
        firstName = try container.decodeIfPresent(String.self, forKey: .firstName)
        lastName = try container.decodeIfPresent(String.self, forKey: .lastName)
        name = try container.decodeIfPresent(String.self, forKey: .name)
        displayName = try container.decodeIfPresent(String.self, forKey: .displayName)
        email = try container.decode(String.self, forKey: .email)
        profilePictureUrl = try container.decodeIfPresent(String.self, forKey: .profilePictureUrl)
        backgroundImageUrl = try container.decodeIfPresent(String.self, forKey: .backgroundImageUrl)
        phoneNumber = try container.decodeIfPresent(String.self, forKey: .phoneNumber)
        dateOfBirth = try container.decodeIfPresent(String.self, forKey: .dateOfBirth)
        gender = try container.decodeIfPresent(String.self, forKey: .gender)
        location = try container.decodeIfPresent(Location.self, forKey: .location)
        bio = try container.decodeIfPresent(String.self, forKey: .bio)
        interests = try container.decodeIfPresent([String].self, forKey: .interests) ?? []
        joinDate = try container.decodeIfPresent(String.self, forKey: .joinDate)
        isVerified = try container.decodeIfPresent(Bool.self, forKey: .isVerified) ?? false
        isAdmin = try container.decodeIfPresent(Bool.self, forKey: .isAdmin) ?? false
        verificationBadge = try container.decodeIfPresent(String.self, forKey: .verificationBadge)
        businessInfo = try container.decodeIfPresent(BusinessInfo.self, forKey: .businessInfo)
        fcmTokens = try container.decodeIfPresent([String].self, forKey: .fcmTokens)

        // Handle role with default
        if let roleString = try container.decodeIfPresent(String.self, forKey: .role) {
            role = UserRole(rawValue: roleString) ?? .user
        } else {
            role = .user
        }

        lastLoginDate = try container.decodeIfPresent(String.self, forKey: .lastLoginDate)

        // Handle status with default
        if let statusString = try container.decodeIfPresent(String.self, forKey: .status) {
            status = UserStatus(rawValue: statusString) ?? .active
        } else {
            status = .active
        }

        token = try container.decodeIfPresent(String.self, forKey: .token)
        refreshToken = try container.decodeIfPresent(String.self, forKey: .refreshToken)
        followersCount = try container.decodeIfPresent(Int.self, forKey: .followersCount) ?? 0
        followingCount = try container.decodeIfPresent(Int.self, forKey: .followingCount) ?? 0
        eventsCreated = try container.decodeIfPresent(Int.self, forKey: .eventsCreated) ?? 0
        eventsAttended = try container.decodeIfPresent(Int.self, forKey: .eventsAttended) ?? 0
        totalSpent = try container.decodeIfPresent(Double.self, forKey: .totalSpent) ?? 0.0
        currentPackage = try container.decodeIfPresent(EventPackage.self, forKey: .currentPackage)
        packageExpiryDate = try container.decodeIfPresent(String.self, forKey: .packageExpiryDate)
        isOnline = try container.decodeIfPresent(Bool.self, forKey: .isOnline) ?? false
        lastSeen = try container.decodeIfPresent(String.self, forKey: .lastSeen)
        preferences = try container.decodeIfPresent(UserPreferences.self, forKey: .preferences)
    }
}

// MARK: - User Role Enum
enum UserRole: String, Codable, CaseIterable {
    case user = "USER"
    case organizer = "ORGANIZER"
    case admin = "ADMIN"
    case enterprise = "ENTERPRISE"
    case moderator = "MODERATOR"

    var displayName: String {
        switch self {
        case .user: return "User"
        case .organizer: return "Organizer"
        case .admin: return "Admin"
        case .enterprise: return "Enterprise"
        case .moderator: return "Moderator"
        }
    }
}

// MARK: - User Status Enum
enum UserStatus: String, Codable, CaseIterable {
    case active = "ACTIVE"
    case inactive = "INACTIVE"
    case suspended = "SUSPENDED"
    case pending = "PENDING"
    case banned = "BANNED"

    var displayName: String {
        switch self {
        case .active: return "Active"
        case .inactive: return "Inactive"
        case .suspended: return "Suspended"
        case .pending: return "Pending"
        case .banned: return "Banned"
        }
    }
}

// MARK: - User Preferences
struct UserPreferences: Codable {
    let notificationsEnabled: Bool
    let emailNotifications: Bool
    let pushNotifications: Bool
    let marketingEmails: Bool
    let theme: String? // "light", "dark", "system"
    let language: String?
    let timezone: String?
    let currency: String?
    let privacySettings: PrivacySettings?
}

// MARK: - Privacy Settings
struct PrivacySettings: Codable {
    let profileVisibility: String // "public", "friends", "private"
    let showEmail: Bool
    let showPhone: Bool
    let showLocation: Bool
    let allowMessagesFromStrangers: Bool
    let allowEventInvites: Bool
}

// MARK: - API Response Models
struct UserResponse: Codable {
    let success: Bool
    let data: User?
    let message: String?
    let errors: [String]?
}

struct UsersResponse: Codable {
    let success: Bool
    let data: [User]
    let message: String?
    let pagination: PaginationInfo?
}

struct PaginationInfo: Codable {
    let currentPage: Int
    let totalPages: Int
    let totalItems: Int
    let itemsPerPage: Int
}

// MARK: - Auth Request Models
struct LoginRequest: Codable {
    let email: String
    let password: String
    let deviceToken: String?
    let deviceType: String = "iOS"
}

struct RegisterRequest: Codable {
    let firstName: String
    let lastName: String
    let email: String
    let password: String
    let phoneNumber: String?
    let dateOfBirth: String?
    let gender: String?
    let location: Location?
    let interests: [String]?
    let marketingConsent: Bool
    let termsAccepted: Bool
    let deviceToken: String?
    let deviceType: String = "iOS"
}

struct ForgotPasswordRequest: Codable {
    let email: String
}

struct ResetPasswordRequest: Codable {
    let token: String
    let newPassword: String
    let confirmPassword: String
}

struct ChangePasswordRequest: Codable {
    let currentPassword: String
    let newPassword: String
    let confirmPassword: String
}

// MARK: - Auth Response Models
struct AuthResponse: Codable {
    let success: Bool
    let data: AuthData?
    let message: String?
    let errors: [String]?
}

struct AuthData: Codable {
    let token: String
    let refreshToken: String
    let user: User
    let expiresIn: Int?
}

struct TokenRefreshRequest: Codable {
    let refreshToken: String
}

struct TokenRefreshResponse: Codable {
    let success: Bool
    let data: TokenData?
    let message: String?
}

struct TokenData: Codable {
    let token: String
    let refreshToken: String
    let expiresIn: Int?
}

// MARK: - User Update Models
struct UserUpdateRequest: Codable {
    let firstName: String?
    let lastName: String?
    let displayName: String?
    let phoneNumber: String?
    let dateOfBirth: String?
    let gender: String?
    let location: Location?
    let bio: String?
    let interests: [String]?
    let preferences: UserPreferences?
}

struct ProfileImageUpdateRequest: Codable {
    let imageData: String // Base64 encoded image
    let imageType: String // "profile" or "background"
}

// MARK: - Follow/Unfollow Models
struct FollowRequest: Codable {
    let userId: String
}

struct FollowResponse: Codable {
    let success: Bool
    let message: String?
    let isFollowing: Bool
}

// MARK: - Search Models
struct UserSearchRequest: Codable {
    let query: String
    let filters: UserSearchFilters?
    let page: Int?
    let limit: Int?
}

struct UserSearchFilters: Codable {
    let role: UserRole?
    let location: String?
    let interests: [String]?
    let isVerified: Bool?
    let isOnline: Bool?
}
