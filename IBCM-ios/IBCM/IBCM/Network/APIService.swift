import Foundation

class APIService {
    static let shared = APIService()
    
    private let session: URLSession
    private var authToken: String?
    private let reachabilityMonitor = NetworkReachabilityMonitor.shared
    
    private init() {
        let configuration = URLSessionConfiguration.default
        configuration.timeoutIntervalForRequest = ConfigurationService.shared.timeoutInterval
        configuration.timeoutIntervalForResource = ConfigurationService.shared.timeoutInterval * 10
        configuration.waitsForConnectivity = true
        
        self.session = URLSession(configuration: configuration)
    }
    
    func setAuthToken(_ token: String?) {
        self.authToken = token
    }
    
    func request<T: Decodable>(
        endpoint: String,
        method: String,
        queryItems: [URLQueryItem]? = nil,
        body: Data? = nil,
        multipartData: [String: MultipartData]? = nil,
        retryCount: Int = 0
    ) async throws -> T {
        if !reachabilityMonitor.isConnected {
            await reachabilityMonitor.waitForConnection()
        }
        
        let baseURLString = ConfigurationService.shared.baseURL
        guard let baseURL = URL(string: baseURLString) else {
            throw APIError.invalidURL
        }
        
        var urlComponents = URLComponents(url: baseURL.appendingPathComponent(ConfigurationService.shared.endpoint(for: endpoint)), resolvingAgainstBaseURL: true)
        urlComponents?.queryItems = queryItems
        
        guard let url = urlComponents?.url else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        request.httpMethod = method
        
        // Set common headers
        request.setValue("application/json", forHTTPHeaderField: "Accept")
        
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        if let multipartData = multipartData {
            let boundary = UUID().uuidString
            request.setValue("multipart/form-data; boundary=\(boundary)", forHTTPHeaderField: "Content-Type")
            request.httpBody = createMultipartBody(data: multipartData, boundary: boundary)
        } else if let body = body {
            request.setValue("application/json", forHTTPHeaderField: "Content-Type")
            request.httpBody = body
        }
        
        NetworkLogger.shared.log(request: request)
        
        do {
            let (data, response) = try await session.data(for: request)
            NetworkLogger.shared.log(response: response, data: data, error: nil)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            switch httpResponse.statusCode {
            case 200...299:
                do {
                    let decoder = JSONDecoder()
                    decoder.keyDecodingStrategy = .convertFromSnakeCase
                    decoder.dateDecodingStrategy = .iso8601
                    return try decoder.decode(T.self, from: data)
                } catch {
                    throw APIError.decodingFailed(error)
                }
            case 401:
                throw APIError.unauthorized
            case 403:
                throw APIError.forbidden
            case 404:
                throw APIError.notFound
            case 500...599:
                if retryCount < ConfigurationService.shared.maxRetryAttempts {
                    // Exponential backoff delay
                    let delay = TimeInterval(pow(2.0, Double(retryCount))) * 0.1
                    try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                    return try await request(
                        endpoint: endpoint,
                        method: method,
                        queryItems: queryItems,
                        body: body,
                        multipartData: multipartData,
                        retryCount: retryCount + 1
                    )
                }
                throw APIError.serverError
            default:
                throw APIError.unexpectedStatusCode(httpResponse.statusCode)
            }
        } catch {
            NetworkLogger.shared.log(response: nil, data: nil, error: error)
            throw error
        }
    }
    
    func downloadData(from urlString: String, retryCount: Int = 0) async throws -> Data {
        if !reachabilityMonitor.isConnected {
            await reachabilityMonitor.waitForConnection()
        }
        
        guard let url = URL(string: urlString) else {
            throw APIError.invalidURL
        }
        
        var request = URLRequest(url: url)
        if let token = authToken {
            request.setValue("Bearer \(token)", forHTTPHeaderField: "Authorization")
        }
        
        NetworkLogger.shared.log(request: request)
        
        do {
            let (data, response) = try await session.data(for: request)
            NetworkLogger.shared.log(response: response, data: data, error: nil)
            
            guard let httpResponse = response as? HTTPURLResponse else {
                throw APIError.invalidResponse
            }
            
            if (200...299).contains(httpResponse.statusCode) {
                return data
            } else if httpResponse.statusCode >= 500 && retryCount < ConfigurationService.shared.maxRetryAttempts {
                // Exponential backoff delay
                let delay = TimeInterval(pow(2.0, Double(retryCount))) * 0.1
                try await Task.sleep(nanoseconds: UInt64(delay * 1_000_000_000))
                return try await downloadData(from: urlString, retryCount: retryCount + 1)
            } else {
                throw APIError.downloadFailed
            }
        } catch {
            NetworkLogger.shared.log(response: nil, data: nil, error: error)
            throw error
        }
    }
    
    private func createMultipartBody(data: [String: MultipartData], boundary: String) -> Data {
        var body = Data()
        
        for (key, value) in data {
            body.append("--\(boundary)\r\n")
            body.append("Content-Disposition: form-data; name=\"\(key)\"; filename=\"\(value.filename)\"\r\n")
            body.append("Content-Type: \(value.mimeType)\r\n\r\n")
            body.append(value.data)
            body.append("\r\n")
        }
        
        body.append("--\(boundary)--\r\n")
        return body
    }
}

struct MultipartData {
    let data: Data
    let mimeType: String
    let filename: String
}

enum APIError: LocalizedError {
    case invalidURL
    case invalidResponse
    case decodingFailed(Error)
    case unauthorized
    case forbidden
    case notFound
    case serverError
    case downloadFailed
    case unexpectedStatusCode(Int)
    
    var errorDescription: String? {
        switch self {
        case .invalidURL:
            return "Invalid URL"
        case .invalidResponse:
            return "Invalid response from server"
        case .decodingFailed(let error):
            return "Failed to decode response: \(error.localizedDescription)"
        case .unauthorized:
            return "Unauthorized access"
        case .forbidden:
            return "Access forbidden"
        case .notFound:
            return "Resource not found"
        case .serverError:
            return "Server error occurred"
        case .downloadFailed:
            return "Failed to download data"
        case .unexpectedStatusCode(let code):
            return "Unexpected status code: \(code)"
        }
    }
}

private extension Data {
    mutating func append(_ string: String) {
        if let data = string.data(using: .utf8) {
            append(data)
        }
    }
} 