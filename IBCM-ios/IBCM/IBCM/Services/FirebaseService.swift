import Foundation
import Firebase
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import FirebaseDatabase
import Combine

protocol FirebaseServiceProtocol {
    // Auth
    func signIn(email: String, password: String) async throws -> User
    func signUp(email: String, password: String, userData: [String: Any]) async throws -> User
    func signOut() throws
    func resetPassword(email: String) async throws
    func updateProfile(displayName: String?, photoURL: URL?) async throws
    var currentUser: User? { get }
    
    // Firestore
    func createDocument<T: Encodable>(_ data: T, in collection: FirebaseConfig.Collection) async throws -> String
    func updateDocument<T: Encodable>(_ data: T, in collection: FirebaseConfig.Collection, documentId: String) async throws
    func deleteDocument(from collection: FirebaseConfig.Collection, documentId: String) async throws
    func getDocument<T: Decodable>(from collection: FirebaseConfig.Collection, documentId: String) async throws -> T
    func query<T: Decodable>(_ collection: FirebaseConfig.Collection,
                            whereField: String?,
                            isEqualTo: Any?,
                            limit: Int?,
                            orderBy: String?,
                            descending: Bool) async throws -> [T]
    
    // Storage
    func uploadImage(_ imageData: Data, to path: FirebaseConfig.StoragePath, filename: String) async throws -> URL
    func deleteFile(at path: FirebaseConfig.StoragePath, filename: String) async throws
    
    // Realtime Database
    func updateUserStatus(userId: String, isOnline: Bool)
    func observeUserStatus(userId: String) -> AnyPublisher<Bool, Never>
    func updateTypingStatus(chatId: String, userId: String, isTyping: Bool)
    func observeTypingStatus(chatId: String) -> AnyPublisher<[String: Bool], Never>
}

final class FirebaseService: FirebaseServiceProtocol {
    static let shared = FirebaseService()
    private var statusObservers: [String: DatabaseHandle] = [:]
    private var typingObservers: [String: DatabaseHandle] = [:]
    
    private init() {}
    
    // MARK: - Auth
    var currentUser: User? {
        return FirebaseConfig.currentUser
    }
    
    func signIn(email: String, password: String) async throws -> User {
        let result = try await FirebaseConfig.signIn(email: email, password: password)
        return result.user
    }
    
    func signUp(email: String, password: String, userData: [String: Any]) async throws -> User {
        let result = try await FirebaseConfig.signUp(email: email, password: password)
        let user = result.user
        
        // Create user document in Firestore
        var data = userData
        data["email"] = email
        data["id"] = user.uid
        data["createdAt"] = Timestamp()
        
        try await FirebaseConfig.createDocument(data, in: .users)
        return user
    }
    
    func signOut() throws {
        try FirebaseConfig.signOut()
    }
    
    func resetPassword(email: String) async throws {
        try await FirebaseConfig.resetPassword(email: email)
    }
    
    func updateProfile(displayName: String?, photoURL: URL?) async throws {
        try await FirebaseConfig.updateProfile(displayName: displayName, photoURL: photoURL)
    }
    
    // MARK: - Firestore
    func createDocument<T: Encodable>(_ data: T, in collection: FirebaseConfig.Collection) async throws -> String {
        let ref = try await FirebaseConfig.createDocument(data, in: collection)
        return ref.documentID
    }
    
    func updateDocument<T: Encodable>(_ data: T, in collection: FirebaseConfig.Collection, documentId: String) async throws {
        try await FirebaseConfig.updateDocument(data, in: collection, documentId: documentId)
    }
    
    func deleteDocument(from collection: FirebaseConfig.Collection, documentId: String) async throws {
        try await FirebaseConfig.deleteDocument(from: collection, documentId: documentId)
    }
    
    func getDocument<T: Decodable>(from collection: FirebaseConfig.Collection, documentId: String) async throws -> T {
        return try await FirebaseConfig.getDocument(from: collection, documentId: documentId)
    }
    
    func query<T: Decodable>(_ collection: FirebaseConfig.Collection,
                            whereField: String? = nil,
                            isEqualTo: Any? = nil,
                            limit: Int? = nil,
                            orderBy: String? = nil,
                            descending: Bool = false) async throws -> [T] {
        return try await FirebaseConfig.query(collection,
                                           whereField: whereField,
                                           isEqualTo: isEqualTo,
                                           limit: limit,
                                           orderBy: orderBy,
                                           descending: descending)
    }
    
    // MARK: - Storage
    func uploadImage(_ imageData: Data, to path: FirebaseConfig.StoragePath, filename: String) async throws -> URL {
        return try await FirebaseConfig.uploadImage(imageData, to: path, filename: filename)
    }
    
    func deleteFile(at path: FirebaseConfig.StoragePath, filename: String) async throws {
        try await FirebaseConfig.deleteFile(at: path, filename: filename)
    }
    
    // MARK: - Realtime Database
    func updateUserStatus(userId: String, isOnline: Bool) {
        FirebaseConfig.updateUserStatus(userId: userId, isOnline: isOnline)
    }
    
    func observeUserStatus(userId: String) -> AnyPublisher<Bool, Never> {
        let subject = PassthroughSubject<Bool, Never>()
        
        let handle = FirebaseConfig.observeUserStatus(userId: userId) { isOnline in
            subject.send(isOnline)
        }
        
        statusObservers[userId] = handle
        
        return subject.handleEvents(receiveCancel: { [weak self] in
            if let handle = self?.statusObservers.removeValue(forKey: userId) {
                FirebaseConfig.RealtimePath.userStatus.reference.child(userId).removeObserver(withHandle: handle)
            }
        }).eraseToAnyPublisher()
    }
    
    func updateTypingStatus(chatId: String, userId: String, isTyping: Bool) {
        FirebaseConfig.updateTypingStatus(chatId: chatId, userId: userId, isTyping: isTyping)
    }
    
    func observeTypingStatus(chatId: String) -> AnyPublisher<[String: Bool], Never> {
        let subject = PassthroughSubject<[String: Bool], Never>()
        
        let handle = FirebaseConfig.observeTypingStatus(chatId: chatId) { typingStatus in
            subject.send(typingStatus)
        }
        
        typingObservers[chatId] = handle
        
        return subject.handleEvents(receiveCancel: { [weak self] in
            if let handle = self?.typingObservers.removeValue(forKey: chatId) {
                FirebaseConfig.RealtimePath.typing.reference.child(chatId).removeObserver(withHandle: handle)
            }
        }).eraseToAnyPublisher()
    }
    
    // MARK: - Cleanup
    deinit {
        // Remove all observers
        statusObservers.forEach { userId, handle in
            FirebaseConfig.RealtimePath.userStatus.reference.child(userId).removeObserver(withHandle: handle)
        }
        
        typingObservers.forEach { chatId, handle in
            FirebaseConfig.RealtimePath.typing.reference.child(chatId).removeObserver(withHandle: handle)
        }
    }
} 