import Foundation
import Firebase
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage
import FirebaseDatabase

enum FirebaseConfig {
    // MARK: - Authentication
    static let auth = Auth.auth()
    static let currentUser = auth.currentUser
    
    // MARK: - Firestore
    static let firestore = Firestore.firestore()
    
    // MARK: - Realtime Database
    static let realtimeDB = Database.database().reference()
    
    // MARK: - Storage
    static let storage = Storage.storage().reference()
    
    // MARK: - Collections
    enum Collection: String {
        case users = "users"
        case events = "events"
        case chats = "chats"
        case messages = "messages"
        case notifications = "notifications"
        case reports = "reports"
        case orders = "orders"
        case payments = "payments"
        case categories = "categories"
    }
    
    // MARK: - Storage Paths
    enum StoragePath: String {
        case profileImages = "profile_images"
        case eventImages = "event_images"
        case chatAttachments = "chat_attachments"
        case reportAttachments = "report_attachments"
        
        var reference: StorageReference {
            return storage.child(rawValue)
        }
    }
    
    // MARK: - Realtime Database Paths
    enum RealtimePath: String {
        case userStatus = "user_status"
        case typing = "typing"
        case lastSeen = "last_seen"
        case onlineUsers = "online_users"
        
        var reference: DatabaseReference {
            return realtimeDB.child(rawValue)
        }
    }
}

// MARK: - Auth Extensions
extension FirebaseConfig {
    static func signIn(email: String, password: String) async throws -> AuthDataResult {
        return try await auth.signIn(withEmail: email, password: password)
    }
    
    static func signUp(email: String, password: String) async throws -> AuthDataResult {
        return try await auth.createUser(withEmail: email, password: password)
    }
    
    static func signOut() throws {
        try auth.signOut()
    }
    
    static func resetPassword(email: String) async throws {
        try await auth.sendPasswordReset(withEmail: email)
    }
    
    static func updateProfile(displayName: String? = nil, photoURL: URL? = nil) async throws {
        let request = auth.currentUser?.createProfileChangeRequest()
        if let displayName = displayName {
            request?.displayName = displayName
        }
        if let photoURL = photoURL {
            request?.photoURL = photoURL
        }
        try await request?.commitChanges()
    }
}

// MARK: - Firestore Extensions
extension FirebaseConfig {
    static func createDocument<T: Encodable>(_ data: T, in collection: Collection) async throws -> DocumentReference {
        let ref = firestore.collection(collection.rawValue).document()
        try await ref.setData(from: data)
        return ref
    }
    
    static func updateDocument<T: Encodable>(_ data: T, in collection: Collection, documentId: String) async throws {
        let ref = firestore.collection(collection.rawValue).document(documentId)
        try await ref.setData(from: data, merge: true)
    }
    
    static func deleteDocument(from collection: Collection, documentId: String) async throws {
        let ref = firestore.collection(collection.rawValue).document(documentId)
        try await ref.delete()
    }
    
    static func getDocument<T: Decodable>(from collection: Collection, documentId: String) async throws -> T {
        let ref = firestore.collection(collection.rawValue).document(documentId)
        let snapshot = try await ref.getDocument()
        return try snapshot.data(as: T.self)
    }
    
    static func query<T: Decodable>(_ collection: Collection,
                                   whereField: String? = nil,
                                   isEqualTo: Any? = nil,
                                   limit: Int? = nil,
                                   orderBy: String? = nil,
                                   descending: Bool = false) async throws -> [T] {
        var query = firestore.collection(collection.rawValue).query
        
        if let field = whereField, let value = isEqualTo {
            query = query.whereField(field, isEqualTo: value)
        }
        
        if let orderField = orderBy {
            query = query.order(by: orderField, descending: descending)
        }
        
        if let limit = limit {
            query = query.limit(to: limit)
        }
        
        let snapshot = try await query.getDocuments()
        return try snapshot.documents.map { try $0.data(as: T.self) }
    }
}

// MARK: - Storage Extensions
extension FirebaseConfig {
    static func uploadImage(_ imageData: Data, to path: StoragePath, filename: String) async throws -> URL {
        let ref = path.reference.child(filename)
        let _ = try await ref.putDataAsync(imageData)
        return try await ref.downloadURL()
    }
    
    static func deleteFile(at path: StoragePath, filename: String) async throws {
        let ref = path.reference.child(filename)
        try await ref.delete()
    }
}

// MARK: - Realtime Database Extensions
extension FirebaseConfig {
    static func updateUserStatus(userId: String, isOnline: Bool) {
        let statusRef = RealtimePath.userStatus.reference.child(userId)
        let data: [String: Any] = [
            "isOnline": isOnline,
            "lastSeen": ServerValue.timestamp()
        ]
        statusRef.setValue(data)
    }
    
    static func observeUserStatus(userId: String, completion: @escaping (Bool) -> Void) -> DatabaseHandle {
        let statusRef = RealtimePath.userStatus.reference.child(userId)
        return statusRef.observe(.value) { snapshot in
            guard let data = snapshot.value as? [String: Any],
                  let isOnline = data["isOnline"] as? Bool else {
                completion(false)
                return
            }
            completion(isOnline)
        }
    }
    
    static func updateTypingStatus(chatId: String, userId: String, isTyping: Bool) {
        let typingRef = RealtimePath.typing.reference
            .child(chatId)
            .child(userId)
        typingRef.setValue(isTyping)
    }
    
    static func observeTypingStatus(chatId: String, completion: @escaping ([String: Bool]) -> Void) -> DatabaseHandle {
        let typingRef = RealtimePath.typing.reference.child(chatId)
        return typingRef.observe(.value) { snapshot in
            guard let data = snapshot.value as? [String: Bool] else {
                completion([:])
                return
            }
            completion(data)
        }
    }
}

// MARK: - Error Handling
extension FirebaseConfig {
    enum FirebaseError: LocalizedError {
        case userNotFound
        case invalidEmail
        case weakPassword
        case emailAlreadyInUse
        case networkError
        case unknownError
        
        var errorDescription: String? {
            switch self {
            case .userNotFound:
                return "User not found"
            case .invalidEmail:
                return "Invalid email address"
            case .weakPassword:
                return "Password is too weak"
            case .emailAlreadyInUse:
                return "Email is already in use"
            case .networkError:
                return "Network error occurred"
            case .unknownError:
                return "An unknown error occurred"
            }
        }
    }
    
    static func handleError(_ error: Error) -> FirebaseError {
        let authError = error as NSError
        switch authError.code {
        case AuthErrorCode.userNotFound.rawValue:
            return .userNotFound
        case AuthErrorCode.invalidEmail.rawValue:
            return .invalidEmail
        case AuthErrorCode.weakPassword.rawValue:
            return .weakPassword
        case AuthErrorCode.emailAlreadyInUse.rawValue:
            return .emailAlreadyInUse
        default:
            return .unknownError
        }
    }
} 