import Foundation
import Alamofire
import Combine

// MARK: - Network Service
class NetworkService: ObservableObject {
    static let shared = NetworkService()

    private let baseURL = "https://your-backend-api.com/api"
    private var session: Session
    private var cancellables = Set<AnyCancellable>()

    // Auth token management
    @Published var isAuthenticated = false
    private var authToken: String?
    private var refreshToken: String?

    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = 30
        configuration.timeoutIntervalForResource = 60

        let interceptor = AuthInterceptor()
        session = Session(configuration: configuration, interceptor: interceptor)

        loadAuthTokens()
    }

    // MARK: - Token Management
    private func loadAuthTokens() {
        authToken = KeychainService.shared.getToken()
        refreshToken = KeychainService.shared.getRefreshToken()
        isAuthenticated = authToken != nil
    }

    func setAuthTokens(token: String, refreshToken: String) {
        self.authToken = token
        self.refreshToken = refreshToken
        self.isAuthenticated = true

        KeychainService.shared.setToken(token)
        KeychainService.shared.setRefreshToken(refreshToken)
    }

    func clearAuthTokens() {
        authToken = nil
        refreshToken = nil
        isAuthenticated = false

        KeychainService.shared.clearTokens()
    }

    // MARK: - Generic Request Methods
    func request<T: Codable>(
        _ endpoint: String,
        method: HTTPMethod = .get,
        parameters: Parameters? = nil,
        encoding: ParameterEncoding = JSONEncoding.default
    ) -> AnyPublisher<T, NetworkError> {

        let url = baseURL + endpoint

        return session.request(
            url,
            method: method,
            parameters: parameters,
            encoding: encoding,
            headers: getHeaders()
        )
        .validate()
        .publishData()
        .tryMap { response in
            guard let data = response.data else {
                throw NetworkError.noData
            }

            do {
                let decodedResponse = try JSONDecoder().decode(T.self, from: data)
                return decodedResponse
            } catch {
                print("Decoding error: \(error)")
                throw NetworkError.decodingError(error)
            }
        }
        .mapError { error in
            if let afError = error as? AFError {
                return NetworkError.from(afError)
            }
            return NetworkError.unknown(error)
        }
        .eraseToAnyPublisher()
    }

    func upload<T: Codable>(
        _ endpoint: String,
        data: Data,
        fileName: String,
        mimeType: String,
        parameters: Parameters? = nil
    ) -> AnyPublisher<T, NetworkError> {

        let url = baseURL + endpoint

        return session.upload(
            multipartFormData: { multipartFormData in
                multipartFormData.append(data, withName: "file", fileName: fileName, mimeType: mimeType)

                parameters?.forEach { key, value in
                    if let data = "\(value)".data(using: .utf8) {
                        multipartFormData.append(data, withName: key)
                    }
                }
            },
            to: url,
            headers: getHeaders()
        )
        .validate()
        .publishData()
        .tryMap { response in
            guard let data = response.data else {
                throw NetworkError.noData
            }

            do {
                let decodedResponse = try JSONDecoder().decode(T.self, from: data)
                return decodedResponse
            } catch {
                throw NetworkError.decodingError(error)
            }
        }
        .mapError { error in
            if let afError = error as? AFError {
                return NetworkError.from(afError)
            }
            return NetworkError.unknown(error)
        }
        .eraseToAnyPublisher()
    }

    private func getHeaders() -> HTTPHeaders {
        var headers: HTTPHeaders = [
            "Content-Type": "application/json",
            "Accept": "application/json"
        ]

        if let token = authToken {
            headers["Authorization"] = "Bearer \(token)"
        }

        return headers
    }
}

// MARK: - Auth Interceptor
class AuthInterceptor: RequestInterceptor {
    func adapt(_ urlRequest: URLRequest, for session: Session, completion: @escaping (Result<URLRequest, Error>) -> Void) {
        completion(.success(urlRequest))
    }

    func retry(_ request: Request, for session: Session, dueTo error: Error, completion: @escaping (RetryResult) -> Void) {
        guard let response = request.task?.response as? HTTPURLResponse,
              response.statusCode == 401 else {
            completion(.doNotRetryWithError(error))
            return
        }

        // Handle token refresh logic here
        completion(.doNotRetry)
    }
}

// MARK: - Network Error
enum NetworkError: Error, LocalizedError {
    case noData
    case decodingError(Error)
    case unauthorized
    case serverError(Int)
    case networkError
    case unknown(Error)

    var errorDescription: String? {
        switch self {
        case .noData:
            return "No data received"
        case .decodingError(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized access"
        case .serverError(let code):
            return "Server error with code: \(code)"
        case .networkError:
            return "Network connection error"
        case .unknown(let error):
            return "Unknown error: \(error.localizedDescription)"
        }
    }

    static func from(_ afError: AFError) -> NetworkError {
        switch afError {
        case .responseValidationFailed(let reason):
            switch reason {
            case .unacceptableStatusCode(let code):
                if code == 401 {
                    return .unauthorized
                }
                return .serverError(code)
            default:
                return .networkError
            }
        default:
            return .networkError
        }
    }
}

// MARK: - API Endpoints
extension NetworkService {

    // MARK: - Auth Endpoints
    func login(email: String, password: String) -> AnyPublisher<AuthResponse, NetworkError> {
        let parameters: Parameters = [
            "email": email,
            "password": password
        ]

        return request("/auth/login", method: .post, parameters: parameters)
    }

    func register(request: RegisterRequest) -> AnyPublisher<AuthResponse, NetworkError> {
        let parameters: Parameters = [
            "name": request.name,
            "email": request.email,
            "password": request.password,
            "phoneNumber": request.phoneNumber ?? "",
            "location": request.location?.city ?? ""
        ]

        return self.request("/auth/register", method: .post, parameters: parameters)
    }

    func refreshToken() -> AnyPublisher<AuthResponse, NetworkError> {
        guard let refreshToken = refreshToken else {
            return Fail(error: NetworkError.unauthorized)
                .eraseToAnyPublisher()
        }

        let parameters: Parameters = [
            "refreshToken": refreshToken
        ]

        return request("/auth/refresh", method: .post, parameters: parameters)
    }

    func getCurrentUser() -> AnyPublisher<UserResponse, NetworkError> {
        return request("/auth/me")
    }

    // MARK: - User Endpoints
    func updateProfile(request: UserUpdateRequest) -> AnyPublisher<UserResponse, NetworkError> {
        let parameters: Parameters = [
            "name": request.name ?? "",
            "displayName": request.displayName ?? "",
            "phoneNumber": request.phoneNumber ?? "",
            "bio": request.bio ?? "",
            "interests": request.interests ?? []
        ]

        return self.request("/users/profile", method: .put, parameters: parameters)
    }

    func uploadProfileImage(imageData: Data) -> AnyPublisher<UserResponse, NetworkError> {
        return upload("/users/profile/image", data: imageData, fileName: "profile.jpg", mimeType: "image/jpeg")
    }

    // MARK: - Event Endpoints
    func getEvents(page: Int = 1, limit: Int = 20) -> AnyPublisher<EventListResponse, NetworkError> {
        let parameters: Parameters = [
            "page": page,
            "limit": limit
        ]

        return request("/events", parameters: parameters)
    }

    func getEvent(id: String) -> AnyPublisher<EventResponse, NetworkError> {
        return request("/events/\(id)")
    }

    func createEvent(request: EventCreateRequest) -> AnyPublisher<EventResponse, NetworkError> {
        let parameters: Parameters = [
            "title": request.title,
            "description": request.description,
            "date": request.date,
            "time": request.time,
            "location": [
                "city": request.location.city,
                "type": request.location.type
            ],
            "category": request.category,
            "categoryId": request.categoryId,
            "maxAttendees": request.maxAttendees,
            "price": request.price,
            "tags": request.tags,
            "imageUrl": request.imageUrl ?? "",
            "eventType": request.eventType.rawValue,
            "visibility": request.visibility.rawValue,
            "isRegistrationRequired": request.isRegistrationRequired
        ]

        return self.request("/events", method: .post, parameters: parameters)
    }

    func updateEvent(id: String, request: EventUpdateRequest) -> AnyPublisher<EventResponse, NetworkError> {
        var parameters: Parameters = [:]

        if let title = request.title { parameters["title"] = title }
        if let description = request.description { parameters["description"] = description }
        if let date = request.date { parameters["date"] = date }
        if let time = request.time { parameters["time"] = time }
        if let location = request.location {
            parameters["location"] = [
                "city": location.city,
                "type": location.type
            ]
        }
        if let category = request.category { parameters["category"] = category }
        if let categoryId = request.categoryId { parameters["categoryId"] = categoryId }
        if let maxAttendees = request.maxAttendees { parameters["maxAttendees"] = maxAttendees }
        if let price = request.price { parameters["price"] = price }
        if let tags = request.tags { parameters["tags"] = tags }
        if let imageUrl = request.imageUrl { parameters["imageUrl"] = imageUrl }
        if let eventType = request.eventType { parameters["eventType"] = eventType.rawValue }
        if let visibility = request.visibility { parameters["visibility"] = visibility.rawValue }
        if let isRegistrationRequired = request.isRegistrationRequired { parameters["isRegistrationRequired"] = isRegistrationRequired }
        if let status = request.status { parameters["status"] = status.rawValue }

        return self.request("/events/\(id)", method: .put, parameters: parameters)
    }

    func deleteEvent(id: String) -> AnyPublisher<EventResponse, NetworkError> {
        return request("/events/\(id)", method: .delete)
    }

    func registerForEvent(eventId: String) -> AnyPublisher<EventResponse, NetworkError> {
        return request("/events/\(eventId)/register", method: .post)
    }

    func unregisterFromEvent(eventId: String) -> AnyPublisher<EventResponse, NetworkError> {
        return request("/events/\(eventId)/unregister", method: .post)
    }

    func searchEvents(query: String, filters: EventSearchRequest) -> AnyPublisher<EventListResponse, NetworkError> {
        var parameters: Parameters = [
            "query": query
        ]

        if let category = filters.category { parameters["category"] = category }
        if let location = filters.location { parameters["location"] = location }
        if let startDate = filters.startDate { parameters["startDate"] = startDate }
        if let endDate = filters.endDate { parameters["endDate"] = endDate }
        if let priceMin = filters.priceMin { parameters["priceMin"] = priceMin }
        if let priceMax = filters.priceMax { parameters["priceMax"] = priceMax }
        if let eventType = filters.eventType { parameters["eventType"] = eventType.rawValue }
        if let visibility = filters.visibility { parameters["visibility"] = visibility.rawValue }
        if let page = filters.page { parameters["page"] = page }
        if let limit = filters.limit { parameters["limit"] = limit }
        if let sortBy = filters.sortBy { parameters["sortBy"] = sortBy }
        if let sortOrder = filters.sortOrder { parameters["sortOrder"] = sortOrder }

        return request("/events/search", parameters: parameters)
    }

    // MARK: - Category Endpoints
    func getCategories() -> AnyPublisher<[EventCategory], NetworkError> {
        return request("/categories")
    }

    // MARK: - Payment Endpoints
    func createPayment(request: PaymentRequest) -> AnyPublisher<PaymentResponse, NetworkError> {
        let parameters: Parameters = [
            "eventId": request.eventId ?? "",
            "subscriptionId": request.subscriptionId ?? "",
            "amount": request.amount,
            "currency": request.currency,
            "description": request.description,
            "method": request.method.rawValue,
            "customerName": request.customerName,
            "customerEmail": request.customerEmail,
            "customerPhone": request.customerPhone ?? "",
            "metadata": request.metadata ?? [:]
        ]

        return self.request("/payment/create", method: .post, parameters: parameters)
    }

    func verifyPayment(verification: PaymentVerification) -> AnyPublisher<PaymentResponse, NetworkError> {
        let parameters: Parameters = [
            "paymentId": verification.paymentId,
            "razorpayPaymentId": verification.razorpayPaymentId ?? "",
            "razorpayOrderId": verification.razorpayOrderId ?? "",
            "razorpaySignature": verification.razorpaySignature ?? "",
            "stripePaymentIntentId": verification.stripePaymentIntentId ?? ""
        ]

        return self.request("/payment/verify", method: .post, parameters: parameters)
    }

    func getPaymentHistory() -> AnyPublisher<[Payment], NetworkError> {
        return request("/payment/history")
    }

    // MARK: - Subscription Endpoints
    func getSubscriptionPlans() -> AnyPublisher<[SubscriptionPlan], NetworkError> {
        return request("/payment/plans")
    }

    func getCurrentSubscription() -> AnyPublisher<SubscriptionResponse, NetworkError> {
        return request("/payment/subscription")
    }

    func createSubscription(request: SubscriptionRequest) -> AnyPublisher<SubscriptionResponse, NetworkError> {
        let parameters: Parameters = [
            "planId": request.planId,
            "billingCycle": request.billingCycle.rawValue,
            "paymentMethod": request.paymentMethod.rawValue,
            "autoRenew": request.autoRenew,
            "couponCode": request.couponCode ?? ""
        ]

        return self.request("/payment/subscribe", method: .post, parameters: parameters)
    }

    func cancelSubscription(subscriptionId: String) -> AnyPublisher<SubscriptionResponse, NetworkError> {
        return request("/payment/subscription/\(subscriptionId)/cancel", method: .post)
    }

    func getUsageData() -> AnyPublisher<UsageData, NetworkError> {
        return request("/payment/usage")
    }

    func getBillingHistory() -> AnyPublisher<[BillingHistory], NetworkError> {
        return request("/payment/billing-history")
    }

    // MARK: - Analytics Endpoints
    func getEventAnalytics(eventId: String) -> AnyPublisher<EventAnalytics, NetworkError> {
        return request("/analytics/events/\(eventId)")
    }

    func getPaymentAnalytics() -> AnyPublisher<PaymentAnalytics, NetworkError> {
        return request("/analytics/payments")
    }

    // MARK: - Notification Endpoints
    func getNotifications() -> AnyPublisher<[EventNotification], NetworkError> {
        return request("/notifications")
    }

    func markNotificationAsRead(notificationId: String) -> AnyPublisher<Bool, NetworkError> {
        return request("/notifications/\(notificationId)/read", method: .post)
    }

    func updateFCMToken(token: String) -> AnyPublisher<Bool, NetworkError> {
        let parameters: Parameters = [
            "token": token
        ]

        return request("/users/fcm-token", method: .post, parameters: parameters)
    }
}

// MARK: - Keychain Service
class KeychainService {
    static let shared = KeychainService()

    private let tokenKey = "auth_token"
    private let refreshTokenKey = "refresh_token"

    private init() {}

    func setToken(_ token: String) {
        KeychainWrapper.standard.set(token, forKey: tokenKey)
    }

    func getToken() -> String? {
        return KeychainWrapper.standard.string(forKey: tokenKey)
    }

    func setRefreshToken(_ token: String) {
        KeychainWrapper.standard.set(token, forKey: refreshTokenKey)
    }

    func getRefreshToken() -> String? {
        return KeychainWrapper.standard.string(forKey: refreshTokenKey)
    }

    func clearTokens() {
        KeychainWrapper.standard.removeObject(forKey: tokenKey)
        KeychainWrapper.standard.removeObject(forKey: refreshTokenKey)
    }
}

// Simple Keychain Wrapper
class KeychainWrapper {
    static let standard = KeychainWrapper()

    private init() {}

    func set(_ value: String, forKey key: String) {
        let data = value.data(using: .utf8)!
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecValueData as String: data
        ]

        SecItemDelete(query as CFDictionary)
        SecItemAdd(query as CFDictionary, nil)
    }

    func string(forKey key: String) -> String? {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key,
            kSecReturnData as String: true,
            kSecMatchLimit as String: kSecMatchLimitOne
        ]

        var result: AnyObject?
        let status = SecItemCopyMatching(query as CFDictionary, &result)

        guard status == errSecSuccess,
              let data = result as? Data else {
            return nil
        }

        return String(data: data, encoding: .utf8)
    }

    func removeObject(forKey key: String) {
        let query: [String: Any] = [
            kSecClass as String: kSecClassGenericPassword,
            kSecAttrAccount as String: key
        ]

        SecItemDelete(query as CFDictionary)
    }
}
