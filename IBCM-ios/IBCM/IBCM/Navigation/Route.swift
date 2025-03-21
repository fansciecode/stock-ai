import Foundation

// MARK: - Route Definition
enum Route: Equatable {
    // Auth Flow
    case login
    case signUp
    case verification(email: String)
    
    // Main Flow
    case home
    case eventList
    case eventDetail(id: String)
    case createEvent
    case editEvent(id: String)
    
    // Chat Flow
    case chatList
    case chatDetail(id: String)
    
    // Profile Flow
    case profile
    case settings
    case editProfile
    
    // Helper to get the route string (similar to Android's route property)
    var path: String {
        switch self {
        case .login: return "login"
        case .signUp: return "signup"
        case .verification: return "verification"
        case .home: return "home"
        case .eventList: return "events"
        case .eventDetail: return "events/detail"
        case .createEvent: return "events/create"
        case .editEvent: return "events/edit"
        case .chatList: return "chats"
        case .chatDetail: return "chats/detail"
        case .profile: return "profile"
        case .settings: return "settings"
        case .editProfile: return "profile/edit"
        }
    }
}

// MARK: - Navigation Controller
final class NavigationController {
    static let shared = NavigationController()
    private var navigators: [String: Navigator] = [:]
    
    private init() {}
    
    func register(navigator: Navigator, for key: String) {
        navigators[key] = navigator
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        // Find the appropriate navigator based on the route
        let navigatorKey = route.path.components(separatedBy: "/").first ?? ""
        guard let navigator = navigators[navigatorKey] else {
            print("No navigator found for route: \(route.path)")
            return
        }
        
        navigator.navigate(to: route, from: viewController)
    }
}

// MARK: - Navigator Protocol
protocol Navigator {
    func navigate(to route: Route, from viewController: UIViewController)
}

// MARK: - Auth Navigator
final class AuthNavigator: Navigator {
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        switch route {
        case .login:
            let loginVC = LoginViewController(container: container)
            viewController.navigationController?.setViewControllers([loginVC], animated: true)
            
        case .signUp:
            let signUpVC = SignUpViewController(container: container)
            viewController.navigationController?.pushViewController(signUpVC, animated: true)
            
        case .verification(let email):
            let verificationVC = VerificationViewController(email: email, container: container)
            viewController.navigationController?.pushViewController(verificationVC, animated: true)
            
        default:
            print("Route not handled by AuthNavigator: \(route.path)")
        }
    }
}

// MARK: - Events Navigator
final class EventsNavigator: Navigator {
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        switch route {
        case .eventList:
            let eventsVC = EventsViewController(container: container)
            viewController.navigationController?.setViewControllers([eventsVC], animated: true)
            
        case .eventDetail(let id):
            let eventDetailVC = EventDetailViewController(eventId: id, container: container)
            viewController.navigationController?.pushViewController(eventDetailVC, animated: true)
            
        case .createEvent:
            let createEventVC = CreateEventViewController(container: container)
            let nav = UINavigationController(rootViewController: createEventVC)
            viewController.present(nav, animated: true)
            
        case .editEvent(let id):
            let editEventVC = EditEventViewController(eventId: id, container: container)
            viewController.navigationController?.pushViewController(editEventVC, animated: true)
            
        default:
            print("Route not handled by EventsNavigator: \(route.path)")
        }
    }
}

// Usage Example:
/*
class SomeViewController: UIViewController {
    func navigateToEventDetail(id: String) {
        NavigationController.shared.navigate(
            to: .eventDetail(id: id),
            from: self
        )
    }
    
    func showVerification(email: String) {
        NavigationController.shared.navigate(
            to: .verification(email: email),
            from: self
        )
    }
}
*/ 