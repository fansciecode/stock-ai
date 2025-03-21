import UIKit

class SceneDelegate: UIResponder, UIWindowSceneDelegate {
    var window: UIWindow?
    private var appCoordinator: AppCoordinator?

    func scene(_ scene: UIScene, willConnectTo session: UISceneSession, options connectionOptions: UIScene.ConnectionOptions) {
        guard let windowScene = (scene as? UIWindowScene) else { return }
        
        let window = UIWindow(windowScene: windowScene)
        self.window = window
        
        // Initialize app coordinator
        appCoordinator = AppCoordinator(window: window)
        appCoordinator?.start()
        
        // Handle deep link if present
        if let urlContext = connectionOptions.urlContexts.first {
            handleDeepLink(url: urlContext.url)
        }
    }
    
    func scene(_ scene: UIScene, openURLContexts URLContexts: Set<UIOpenURLContext>) {
        guard let url = URLContexts.first?.url else { return }
        handleDeepLink(url: url)
    }
    
    private func handleDeepLink(url: URL) {
        // Parse the URL and navigate accordingly
        let components = URLComponents(url: url, resolvingAgainstBaseURL: true)
        let path = components?.path ?? ""
        let queryItems = components?.queryItems ?? []
        
        // Example deep link handling:
        // ibcm://events/detail?id=123
        switch path {
        case "/events/detail":
            if let id = queryItems.first(where: { $0.name == "id" })?.value {
                NavigationController.shared.navigate(
                    to: .eventDetail(id: id),
                    from: window?.rootViewController ?? UIViewController()
                )
            }
        case "/verification":
            if let email = queryItems.first(where: { $0.name == "email" })?.value {
                NavigationController.shared.navigate(
                    to: .verification(email: email),
                    from: window?.rootViewController ?? UIViewController()
                )
            }
        default:
            break
        }
    }
} 