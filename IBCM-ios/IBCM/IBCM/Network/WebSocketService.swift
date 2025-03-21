import Foundation

class WebSocketService {
    static let shared = WebSocketService()
    
    private var webSocket: URLSessionWebSocketTask?
    private var session: URLSession?
    private var isConnected = false
    private var messageHandlers: [String: [(Data) -> Void]] = [:]
    private var reconnectTimer: Timer?
    private var reconnectAttempts = 0
    private let maxReconnectAttempts = 5
    private let reconnectInterval: TimeInterval = 5.0
    
    private init() {
        setupSession()
    }
    
    private func setupSession() {
        let configuration = URLSessionConfiguration.default
        session = URLSession(configuration: configuration)
    }
    
    func connect(url: URL) {
        guard !isConnected else { return }
        
        webSocket = session?.webSocketTask(with: url)
        webSocket?.resume()
        
        receiveMessage()
        isConnected = true
        reconnectAttempts = 0
    }
    
    func disconnect() {
        webSocket?.cancel(with: .goingAway, reason: nil)
        isConnected = false
        messageHandlers.removeAll()
        reconnectTimer?.invalidate()
        reconnectTimer = nil
    }
    
    func subscribe(to topic: String) -> AsyncStream<Data> {
        AsyncStream { continuation in
            if messageHandlers[topic] == nil {
                messageHandlers[topic] = []
            }
            
            let handler: (Data) -> Void = { data in
                continuation.yield(data)
            }
            
            messageHandlers[topic]?.append(handler)
            
            continuation.onTermination = { @Sendable _ in
                self.messageHandlers[topic]?.removeAll(where: { $0 === handler })
                if self.messageHandlers[topic]?.isEmpty == true {
                    self.messageHandlers.removeValue(forKey: topic)
                }
            }
        }
    }
    
    func send(message: [String: Any]) async throws {
        guard isConnected else {
            throw WebSocketError.notConnected
        }
        
        let data = try JSONSerialization.data(withJSONObject: message)
        try await webSocket?.send(.data(data))
    }
    
    private func receiveMessage() {
        webSocket?.receive { [weak self] result in
            guard let self = self else { return }
            
            switch result {
            case .success(let message):
                switch message {
                case .data(let data):
                    self.handleMessage(data)
                case .string(let string):
                    if let data = string.data(using: .utf8) {
                        self.handleMessage(data)
                    }
                @unknown default:
                    break
                }
                self.receiveMessage()
                
            case .failure(let error):
                print("WebSocket receive error: \(error)")
                self.handleDisconnection()
            }
        }
    }
    
    private func handleMessage(_ data: Data) {
        guard let json = try? JSONSerialization.jsonObject(with: data) as? [String: Any],
              let topic = json["topic"] as? String else {
            return
        }
        
        messageHandlers[topic]?.forEach { handler in
            handler(data)
        }
    }
    
    private func handleDisconnection() {
        isConnected = false
        
        guard reconnectAttempts < maxReconnectAttempts else {
            NotificationCenter.default.post(name: .webSocketDisconnected, object: nil)
            return
        }
        
        reconnectTimer?.invalidate()
        reconnectTimer = Timer.scheduledTimer(withTimeInterval: reconnectInterval, repeats: false) { [weak self] _ in
            guard let self = self,
                  let url = self.webSocket?.originalRequest?.url else {
                return
            }
            
            self.reconnectAttempts += 1
            self.connect(url: url)
        }
    }
}

enum WebSocketError: LocalizedError {
    case notConnected
    case invalidMessage
    case connectionFailed
    
    var errorDescription: String? {
        switch self {
        case .notConnected:
            return "WebSocket is not connected"
        case .invalidMessage:
            return "Invalid message format"
        case .connectionFailed:
            return "Failed to establish WebSocket connection"
        }
    }
}

extension Notification.Name {
    static let webSocketDisconnected = Notification.Name("webSocketDisconnected")
} 