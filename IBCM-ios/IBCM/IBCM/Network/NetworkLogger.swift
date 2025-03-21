import Foundation

class NetworkLogger {
    static let shared = NetworkLogger()
    
    private init() {}
    
    func log(request: URLRequest) {
        guard ConfigurationService.shared.loggingEnabled else { return }
        
        print("\n - - - - - - - - - - REQUEST - - - - - - - - - - ")
        defer { print(" - - - - - - - - - -  END - - - - - - - - - - \n") }
        
        let urlAsString = request.url?.absoluteString ?? ""
        let urlComponents = URLComponents(string: urlAsString)
        
        let method = request.httpMethod != nil ? "\(request.httpMethod ?? "")" : ""
        let path = "\(urlComponents?.path ?? "")"
        let query = "\(urlComponents?.query ?? "")"
        let host = "\(urlComponents?.host ?? "")"
        
        var logOutput = """
            \(urlAsString) \n\n
            \(method) \(path)?\(query) HTTP/1.1 \n
            HOST: \(host)\n
            """
        
        for (key, value) in request.allHTTPHeaderFields ?? [:] {
            if key.lowercased() != "authorization" {
                logOutput += "\(key): \(value) \n"
            } else {
                logOutput += "\(key): [REDACTED] \n"
            }
        }
        
        if let body = request.httpBody {
            logOutput += "\n\(prettyPrintJSON(body))\n"
        }
        
        print(logOutput)
    }
    
    func log(response: URLResponse?, data: Data?, error: Error?) {
        guard ConfigurationService.shared.loggingEnabled else { return }
        
        print("\n - - - - - - - - - - RESPONSE - - - - - - - - - - ")
        defer { print(" - - - - - - - - - -  END - - - - - - - - - - \n") }
        
        let statusCode = (response as? HTTPURLResponse)?.statusCode ?? 0
        let urlString = response?.url?.absoluteString ?? "nil"
        
        var logOutput = """
            URL: \(urlString) \n
            Status Code: \(statusCode)\n
            """
        
        if let headers = (response as? HTTPURLResponse)?.allHeaderFields {
            logOutput += "\nHeaders:\n"
            for (key, value) in headers {
                logOutput += "\(key): \(value)\n"
            }
        }
        
        if let data = data {
            logOutput += "\nResponse Data:\n\(prettyPrintJSON(data))\n"
        }
        
        if let error = error {
            logOutput += "\nError: \(error.localizedDescription)\n"
        }
        
        print(logOutput)
    }
    
    private func prettyPrintJSON(_ data: Data) -> String {
        do {
            let jsonObject = try JSONSerialization.jsonObject(with: data, options: [])
            let prettyData = try JSONSerialization.data(withJSONObject: jsonObject, options: .prettyPrinted)
            return String(data: prettyData, encoding: .utf8) ?? "Unable to parse JSON"
        } catch {
            if let stringValue = String(data: data, encoding: .utf8) {
                return "Raw data: \(stringValue)"
            }
            return "Unable to parse response data"
        }
    }
} 