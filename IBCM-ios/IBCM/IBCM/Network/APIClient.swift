import Foundation
import Combine

// MARK: - APIClient
class APIClient: ObservableObject {
    static let shared = APIClient()

    // MARK: - Properties
    private let session: URLSession
    private let baseURL: String
    private var cancellables = Set<AnyCancellable>()

    // MARK: - Configuration
    private enum Configuration {
        static let baseURL = "https://your-api-domain.com/api" // Replace with actual API URL
        static let timeout: TimeInterval = 30.0
        static let maxRetries = 3
    }

    // MARK: - Initialization
    private init() {
        let config = URLSessionConfiguration.default
        config.timeoutIntervalForRequest = Configuration.timeout
        config.timeoutIntervalForResource = Configuration.timeout * 2
        config.requestCachePolicy = .reloadIgnoringLocalAndRemoteCacheData

        self.session = URLSession(configuration: config)
        self.baseURL = Configuration.baseURL
    }

    // MARK: - Main Request Method
    func request<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        headers: [String: String] = [:],
        queryParameters: [String: String] = [:],
        body: Encodable? = nil
    ) -> AnyPublisher<T, APIError> {

        guard let url = buildURL(endpoint: endpoint, queryParameters: queryParameters) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = method.rawValue

        // Set default headers
        request.setValue("application/json", forHTTPHeaderField: "Content-Type")
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        request.setValue("IBCM-iOS/1.0", forHTTPHeaderField: "User-Agent")

        // Add custom headers
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        // Add request body if provided
        if let body = body {
            do {
                request.httpBody = try JSONEncoder().encode(body)
            } catch {
                return Fail(error: APIError.decodingError)
                    .eraseToAnyPublisher()
            }
        }

        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                return try self?.handleResponse(data: data, response: response) ?? data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if error is DecodingError {
                    return APIError.decodingError
                } else if let apiError = error as? APIError {
                    return apiError
                } else {
                    return APIError.networkError(error)
                }
            }
            .retry(Configuration.maxRetries)
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Specialized Request Methods

    /// GET request
    func get<T: Codable>(
        endpoint: String,
        headers: [String: String] = [:],
        queryParameters: [String: String] = [:]
    ) -> AnyPublisher<T, APIError> {
        return request(
            endpoint: endpoint,
            method: .GET,
            headers: headers,
            queryParameters: queryParameters
        )
    }

    /// POST request
    func post<T: Codable>(
        endpoint: String,
        headers: [String: String] = [:],
        body: Encodable? = nil
    ) -> AnyPublisher<T, APIError> {
        return request(
            endpoint: endpoint,
            method: .POST,
            headers: headers,
            body: body
        )
    }

    /// PUT request
    func put<T: Codable>(
        endpoint: String,
        headers: [String: String] = [:],
        body: Encodable? = nil
    ) -> AnyPublisher<T, APIError> {
        return request(
            endpoint: endpoint,
            method: .PUT,
            headers: headers,
            body: body
        )
    }

    /// DELETE request
    func delete<T: Codable>(
        endpoint: String,
        headers: [String: String] = [:]
    ) -> AnyPublisher<T, APIError> {
        return request(
            endpoint: endpoint,
            method: .DELETE,
            headers: headers
        )
    }

    /// PATCH request
    func patch<T: Codable>(
        endpoint: String,
        headers: [String: String] = [:],
        body: Encodable? = nil
    ) -> AnyPublisher<T, APIError> {
        return request(
            endpoint: endpoint,
            method: .PATCH,
            headers: headers,
            body: body
        )
    }

    // MARK: - File Upload
    func uploadFile<T: Codable>(
        endpoint: String,
        fileData: Data,
        fileName: String,
        mimeType: String,
        additionalFields: [String: String] = [:],
        headers: [String: String] = [:]
    ) -> AnyPublisher<T, APIError> {

        guard let url = buildURL(endpoint: endpoint) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        var request = URLRequest(url: url)
        request.httpMethod = HTTPMethod.POST.rawValue

        let boundary = "Boundary-\(UUID().uuidString)"
        request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")

        // Add custom headers
        for (key, value) in headers {
            request.setValue(value, forHTTPHeaderField: key)
        }

        var body = Data()

        // Add additional fields
        for (key, value) in additionalFields {
            body.append("--\(boundary)\r\n".data(using: .utf8)!)
            body.append("Content-Disposition: form-data; name=\"\(key)\"\r\n\r\n".data(using: .utf8)!)
            body.append("\(value)\r\n".data(using: .utf8)!)
        }

        // Add file data
        body.append("--\(boundary)\r\n".data(using: .utf8)!)
        body.append("Content-Disposition: form-data; name=\"file\"; filename=\"\(fileName)\"\r\n".data(using: .utf8)!)
        body.append("Content-Type: \(mimeType)\r\n\r\n".data(using: .utf8)!)
        body.append(fileData)
        body.append("\r\n".data(using: .utf8)!)
        body.append("--\(boundary)--\r\n".data(using: .utf8)!)

        request.httpBody = body

        return session.dataTaskPublisher(for: request)
            .tryMap { [weak self] data, response in
                return try self?.handleResponse(data: data, response: response) ?? data
            }
            .decode(type: T.self, decoder: JSONDecoder())
            .mapError { error in
                if error is DecodingError {
                    return APIError.decodingError
                } else if let apiError = error as? APIError {
                    return apiError
                } else {
                    return APIError.networkError(error)
                }
            }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Image Download
    func downloadImage(from urlString: String) -> AnyPublisher<Data, APIError> {
        guard let url = URL(string: urlString) else {
            return Fail(error: APIError.invalidURL)
                .eraseToAnyPublisher()
        }

        return session.dataTaskPublisher(for: url)
            .map(\.data)
            .mapError { APIError.networkError($0) }
            .receive(on: DispatchQueue.main)
            .eraseToAnyPublisher()
    }

    // MARK: - Authenticated Requests
    func authenticatedRequest<T: Codable>(
        endpoint: String,
        method: HTTPMethod = .GET,
        headers: [String: String] = [:],
        queryParameters: [String: String] = [:],
        body: Encodable? = nil
    ) -> AnyPublisher<T, APIError> {

        // Get auth token from AuthService
        guard let authToken = AuthService.shared.authToken else {
            return Fail(error: APIError.unauthorized)
                .eraseToAnyPublisher()
        }

        var authHeaders = headers
        authHeaders["Authorization"] = "Bearer \(authToken)"

        return request(
            endpoint: endpoint,
            method: method,
            headers: authHeaders,
            queryParameters: queryParameters,
            body: body
        )
        .catch { [weak self] error -> AnyPublisher<T, APIError> in
            // Handle token refresh on 401 error
            if case APIError.unauthorized = error {
                return self?.refreshTokenAndRetry(
                    endpoint: endpoint,
                    method: method,
                    headers: headers,
                    queryParameters: queryParameters,
                    body: body
                ) ?? Fail(error: error).eraseToAnyPublisher()
            }
            return Fail(error: error).eraseToAnyPublisher()
        }
        .eraseToAnyPublisher()
    }

    // MARK: - Private Methods

    private func buildURL(endpoint: String, queryParameters: [String: String] = [:]) -> URL? {
        let fullPath = endpoint.hasPrefix("/") ? endpoint : "/\(endpoint)"
        guard var urlComponents = URLComponents(string: baseURL + fullPath) else {
            return nil
        }

        if !queryParameters.isEmpty {
            urlComponents.queryItems = queryParameters.map { URLQueryItem(name: $0.key, value: $0.value) }
        }

        return urlComponents.url
    }

    private func handleResponse(data: Data, response: URLResponse) throws -> Data {
        guard let httpResponse = response as? HTTPURLResponse else {
            throw APIError.unknown
        }

        switch httpResponse.statusCode {
        case 200...299:
            return data
        case 400:
            let errorMessage = try? parseErrorMessage(from: data)
            throw APIError.badRequest(errorMessage)
        case 401:
            throw APIError.unauthorized
        case 403:
            throw APIError.forbidden
        case 404:
            throw APIError.notFound
        case 500...599:
            let errorMessage = try? parseErrorMessage(from: data)
            throw APIError.serverError(httpResponse.statusCode, errorMessage)
        default:
            let errorMessage = try? parseErrorMessage(from: data)
            throw APIError.serverError(httpResponse.statusCode, errorMessage)
        }
    }

    private func parseErrorMessage(from data: Data) throws -> String? {
        if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
           let message = json["message"] as? String {
            return message
        } else if let json = try JSONSerialization.jsonObject(with: data) as? [String: Any],
                  let errors = json["errors"] as? [String],
                  let firstError = errors.first {
            return firstError
        }
        return nil
    }

    private func refreshTokenAndRetry<T: Codable>(
        endpoint: String,
        method: HTTPMethod,
        headers: [String: String],
        queryParameters: [String: String],
        body: Encodable?
    ) -> AnyPublisher<T, APIError> {

        return AuthService.shared.refreshAuthToken()
            .flatMap { [weak self] _ -> AnyPublisher<T, APIError> in
                guard let self = self,
                      let newAuthToken = AuthService.shared.authToken else {
                    return Fail(error: APIError.unauthorized)
                        .eraseToAnyPublisher()
                }

                var newHeaders = headers
                newHeaders["Authorization"] = "Bearer \(newAuthToken)"

                return self.request(
                    endpoint: endpoint,
                    method: method,
                    headers: newHeaders,
                    queryParameters: queryParameters,
                    body: body
                )
            }
            .eraseToAnyPublisher()
    }
}

// MARK: - Network Monitoring
extension APIClient {

    /// Check network connectivity
    var isNetworkAvailable: Bool {
        // This is a simple implementation
        // For production, consider using NWPathMonitor or a third-party library
        return true
    }

    /// Monitor network status
    func startNetworkMonitoring() {
        // Implementation for network monitoring
        // This could use NWPathMonitor from Network framework
    }
}

// MARK: - Request Logging
extension APIClient {

    private func logRequest(_ request: URLRequest) {
        #if DEBUG
        print("🚀 API Request:")
        print("URL: \(request.url?.absoluteString ?? "Unknown")")
        print("Method: \(request.httpMethod ?? "Unknown")")
        print("Headers: \(request.allHTTPHeaderFields ?? [:])")

        if let body = request.httpBody,
           let bodyString = String(data: body, encoding: .utf8) {
            print("Body: \(bodyString)")
        }
        print("---")
        #endif
    }

    private func logResponse(_ data: Data, _ response: URLResponse?) {
        #if DEBUG
        print("📥 API Response:")

        if let httpResponse = response as? HTTPURLResponse {
            print("Status Code: \(httpResponse.statusCode)")
            print("Headers: \(httpResponse.allHeaderFields)")
        }

        if let responseString = String(data: data, encoding: .utf8) {
            print("Body: \(responseString)")
        }
        print("---")
        #endif
    }
}

// MARK: - Cache Management
extension APIClient {

    /// Clear API cache
    func clearCache() {
        URLCache.shared.removeAllCachedResponses()
    }

    /// Get cache size in bytes
    var cacheSize: Int {
        return URLCache.shared.currentDiskUsage
    }
}

// MARK: - Request Configuration
struct RequestConfiguration {
    let timeout: TimeInterval
    let cachePolicy: URLRequest.CachePolicy
    let allowsCellularAccess: Bool
    let retryCount: Int

    static let `default` = RequestConfiguration(
        timeout: 30.0,
        cachePolicy: .reloadIgnoringLocalAndRemoteCacheData,
        allowsCellularAccess: true,
        retryCount: 3
    )
}

// MARK: - Response Validation
protocol ResponseValidatable {
    func validate() throws
}

// MARK: - Request Interceptor
protocol RequestInterceptor {
    func intercept(_ request: URLRequest) -> URLRequest
}

// MARK: - Response Interceptor
protocol ResponseInterceptor {
    func intercept(_ data: Data, _ response: URLResponse) -> Data
}
