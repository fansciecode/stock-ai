import Foundation
import Network

enum NetworkStatus {
    case connected
    case disconnected
}

class NetworkReachabilityMonitor {
    static let shared = NetworkReachabilityMonitor()
    
    private let monitor: NWPathMonitor
    private let queue = DispatchQueue(label: "NetworkReachabilityMonitor")
    
    @Published private(set) var status: NetworkStatus = .connected
    private var observers: [(NetworkStatus) -> Void] = []
    
    private init() {
        monitor = NWPathMonitor()
        startMonitoring()
    }
    
    deinit {
        stopMonitoring()
    }
    
    func addObserver(_ observer: @escaping (NetworkStatus) -> Void) {
        observers.append(observer)
        // Immediately notify the observer of the current status
        observer(status)
    }
    
    func removeAllObservers() {
        observers.removeAll()
    }
    
    private func startMonitoring() {
        monitor.pathUpdateHandler = { [weak self] path in
            guard let self = self else { return }
            
            let newStatus: NetworkStatus = path.status == .satisfied ? .connected : .disconnected
            
            DispatchQueue.main.async {
                self.status = newStatus
                self.notifyObservers()
            }
            
            if newStatus == .disconnected {
                self.handleDisconnection()
            }
        }
        
        monitor.start(queue: queue)
    }
    
    private func stopMonitoring() {
        monitor.cancel()
    }
    
    private func notifyObservers() {
        observers.forEach { observer in
            observer(status)
        }
    }
    
    private func handleDisconnection() {
        // Implement any specific disconnection handling logic here
        // For example, you might want to:
        // 1. Show a network error UI
        // 2. Pause ongoing network requests
        // 3. Queue operations for retry when connection is restored
        // 4. Log the disconnection event
        if ConfigurationService.shared.loggingEnabled {
            print("Network disconnected - handling disconnection...")
        }
    }
    
    var isConnected: Bool {
        return status == .connected
    }
    
    func waitForConnection() async {
        guard !isConnected else { return }
        
        return await withCheckedContinuation { continuation in
            let observer: (NetworkStatus) -> Void = { status in
                if status == .connected {
                    continuation.resume()
                }
            }
            
            addObserver(observer)
        }
    }
} 