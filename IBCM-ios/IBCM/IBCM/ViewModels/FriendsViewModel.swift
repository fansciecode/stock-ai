import Foundation
import SwiftUI

@MainActor
class FriendsViewModel: ObservableObject {
    @Published var friends: [User] = []
    @Published var friendRequests: [FriendRequest] = []
    @Published var searchResults: [User] = []
    @Published var isLoading = false
    @Published var errorMessage = ""
    @Published var showError = false
    @Published var searchText = ""
    
    private var searchTask: Task<Void, Never>?
    private let apiService: APIService
    
    init(apiService: APIService = APIService.shared) {
        self.apiService = apiService
        setupSearchSubscription()
    }
    
    private func setupSearchSubscription() {
        Task {
            for await text in $searchText.values {
                searchTask?.cancel()
                
                if text.isEmpty {
                    searchResults = []
                    continue
                }
                
                searchTask = Task {
                    await searchUsers(query: text)
                }
            }
        }
    }
    
    func loadFriends() async {
        isLoading = true
        errorMessage = ""
        
        do {
            let response: FriendsResponse = try await apiService.get("/api/friends")
            friends = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
        
        isLoading = false
    }
    
    func loadFriendRequests() async {
        do {
            let response: FriendRequestsResponse = try await apiService.get("/api/friends/requests")
            friendRequests = response.data
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    private func searchUsers(query: String) async {
        do {
            let response: UsersResponse = try await apiService.get("/api/users/search?q=\(query)")
            searchResults = response.data.filter { user in
                !friends.contains(where: { $0.id == user.id })
            }
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func sendFriendRequest(to userId: String) async {
        do {
            let _: EmptyResponse = try await apiService.post("/api/friends/requests", body: ["userId": userId])
            // Update UI or show success message
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func acceptFriendRequest(_ request: FriendRequest) async {
        do {
            let _: EmptyResponse = try await apiService.put("/api/friends/requests/\(request.id)/accept", body: [:])
            await loadFriendRequests()
            await loadFriends()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func rejectFriendRequest(_ request: FriendRequest) async {
        do {
            let _: EmptyResponse = try await apiService.put("/api/friends/requests/\(request.id)/reject", body: [:])
            await loadFriendRequests()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func removeFriend(_ userId: String) async {
        do {
            let _: EmptyResponse = try await apiService.delete("/api/friends/\(userId)")
            await loadFriends()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
    
    func blockUser(_ userId: String) async {
        do {
            let _: EmptyResponse = try await apiService.post("/api/users/block", body: ["userId": userId])
            await loadFriends()
        } catch {
            errorMessage = error.localizedDescription
            showError = true
        }
    }
} 