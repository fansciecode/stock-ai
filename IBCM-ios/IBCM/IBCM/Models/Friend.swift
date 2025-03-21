import Foundation

struct FriendRequest: Codable, Identifiable {
    let id: String
    let senderId: String
    let receiverId: String
    let status: FriendRequestStatus
    let createdAt: Date
    
    enum FriendRequestStatus: String, Codable {
        case pending
        case accepted
        case rejected
    }
}

// Response types
struct FriendsResponse: Codable {
    let success: Bool
    let data: [User]
    let message: String?
}

struct FriendRequestsResponse: Codable {
    let success: Bool
    let data: [FriendRequest]
    let message: String?
}

struct FriendRequestResponse: Codable {
    let success: Bool
    let data: FriendRequest
    let message: String?
}

struct EmptyResponse: Codable {
    let success: Bool
    let message: String?
} 