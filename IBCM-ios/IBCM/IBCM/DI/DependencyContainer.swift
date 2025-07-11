import Foundation
import FirebaseAuth
import FirebaseFirestore
import FirebaseStorage

// MARK: - Dependency Container Protocol
protocol DependencyContainerProtocol {
    // Network
    var apiService: APIService { get }
    var webSocketService: WebSocketService { get }
    
    // API Services
    var userAPIService: UserAPIService { get }
    var eventAPIService: EventAPIService { get }
    var notificationAPIService: NotificationAPIService { get }
    var reportAPIService: ReportAPIService { get }
    var imageAPIService: ImageAPIService { get }
    var chatAPIService: ChatAPIService { get }
    var aiService: AIService { get }
    
    // Repositories
    var userRepository: UserRepository { get }
    var eventRepository: EventRepository { get }
    var enhancedEventRepository: EnhancedEventRepository { get }
    var notificationRepository: NotificationRepository { get }
    var reportRepository: ReportRepository { get }
    var imageRepository: ImageRepository { get }
    var chatRepository: ChatRepository { get }
    var aiRepository: AIRepository { get }
    
    // Firebase Services
    var firebaseAuth: Auth { get }
    var firestore: Firestore { get }
    var storage: Storage { get }
}

// MARK: - Dependency Container Implementation
final class DependencyContainer: DependencyContainerProtocol {
    static let shared = DependencyContainer()
    
    private init() {}
    
    // MARK: - Network Layer
    
    lazy var apiService: APIService = {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 30
        
        let session = URLSession(configuration: configuration)
        return APIService(
            baseURL: Environment.apiBaseURL,
            session: session,
            encoder: JSONEncoder.customized,
            decoder: JSONDecoder.customized
        )
    }()
    
    lazy var webSocketService: WebSocketService = {
        return WebSocketServiceImpl(url: Environment.webSocketURL)
    }()
    
    // MARK: - API Services
    
    lazy var userAPIService: UserAPIService = {
        return UserAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var eventAPIService: EventAPIService = {
        return EventAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var notificationAPIService: NotificationAPIService = {
        return NotificationAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var reportAPIService: ReportAPIService = {
        return ReportAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var imageAPIService: ImageAPIService = {
        return ImageAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var chatAPIService: ChatAPIService = {
        return ChatAPIServiceImpl(apiService: apiService)
    }()
    
    lazy var aiService: AIService = {
        return AIService.shared
    }()
    
    // MARK: - Repositories
    
    lazy var userRepository: UserRepository = {
        return UserRepositoryImpl(
            apiService: userAPIService,
            firebaseAuth: firebaseAuth
        )
    }()
    
    lazy var eventRepository: EventRepository = {
        return EventRepositoryImpl(
            apiService: eventAPIService,
            webSocketService: webSocketService
        )
    }()
    
    lazy var enhancedEventRepository: EnhancedEventRepository = {
        return EnhancedEventRepositoryImpl(
            apiService: eventAPIService,
            webSocketService: webSocketService
        )
    }()
    
    lazy var notificationRepository: NotificationRepository = {
        return NotificationRepositoryImpl(apiService: notificationAPIService)
    }()
    
    lazy var reportRepository: ReportRepository = {
        return ReportRepositoryImpl(apiService: reportAPIService)
    }()
    
    lazy var imageRepository: ImageRepository = {
        return ImageRepositoryImpl(
            apiService: imageAPIService,
            storage: storage
        )
    }()
    
    lazy var chatRepository: ChatRepository = {
        return ChatRepositoryImpl(
            apiService: chatAPIService,
            webSocketService: webSocketService
        )
    }()
    
    lazy var aiRepository: AIRepository = {
        return AIRepositoryImpl(aiService: aiService)
    }()
    
    // MARK: - Firebase Services
    
    lazy var firebaseAuth: Auth = {
        return Auth.auth()
    }()
    
    lazy var firestore: Firestore = {
        return Firestore.firestore()
    }()
    
    lazy var storage: Storage = {
        return Storage.storage()
    }()
}

// MARK: - Environment
private enum Environment {
    static let apiBaseURL = URL(string: "YOUR_API_BASE_URL")!
    static let webSocketURL = URL(string: "YOUR_WEBSOCKET_URL")!
} 