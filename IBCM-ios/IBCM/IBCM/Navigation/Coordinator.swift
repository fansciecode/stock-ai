import UIKit

// MARK: - Base Coordinator Protocol
protocol Coordinator: AnyObject {
    var childCoordinators: [Coordinator] { get set }
    var navigationController: UINavigationController { get }
    
    func start()
    func finish()
}

extension Coordinator {
    func finish() {
        childCoordinators.removeAll()
    }
    
    func addChild(_ coordinator: Coordinator) {
        childCoordinators.append(coordinator)
    }
    
    func removeChild(_ coordinator: Coordinator) {
        childCoordinators = childCoordinators.filter { $0 !== coordinator }
    }
}

// MARK: - Main App Coordinator
final class AppCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let window: UIWindow
    private let container: DependencyContainerProtocol
    
    init(window: UIWindow, container: DependencyContainerProtocol = DependencyContainer.shared) {
        self.window = window
        self.container = container
        self.navigationController = UINavigationController()
        self.navigationController.navigationBar.prefersLargeTitles = true
    }
    
    func start() {
        window.rootViewController = navigationController
        window.makeKeyAndVisible()
        
        // Check authentication state
        if container.firebaseAuth.currentUser != nil {
            showMainFlow()
        } else {
            showAuthFlow()
        }
    }
    
    private func showAuthFlow() {
        let authCoordinator = AuthCoordinator(
            navigationController: navigationController,
            container: container
        )
        addChild(authCoordinator)
        authCoordinator.delegate = self
        authCoordinator.start()
    }
    
    private func showMainFlow() {
        let mainCoordinator = MainCoordinator(
            navigationController: navigationController,
            container: container
        )
        addChild(mainCoordinator)
        mainCoordinator.delegate = self
        mainCoordinator.start()
    }
}

// MARK: - Auth Flow
protocol AuthCoordinatorDelegate: AnyObject {
    func authCoordinatorDidFinish(_ coordinator: AuthCoordinator)
}

final class AuthCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let container: DependencyContainerProtocol
    weak var delegate: AuthCoordinatorDelegate?
    
    init(navigationController: UINavigationController, container: DependencyContainerProtocol) {
        self.navigationController = navigationController
        self.container = container
    }
    
    func start() {
        let loginVC = LoginViewController(container: container)
        loginVC.delegate = self
        navigationController.setViewControllers([loginVC], animated: true)
    }
}

extension AuthCoordinator: LoginViewControllerDelegate {
    func loginViewControllerDidRequestSignUp(_ viewController: LoginViewController) {
        let signUpVC = SignUpViewController(container: container)
        signUpVC.delegate = self
        navigationController.pushViewController(signUpVC, animated: true)
    }
    
    func loginViewControllerDidLogin(_ viewController: LoginViewController) {
        delegate?.authCoordinatorDidFinish(self)
    }
}

extension AuthCoordinator: SignUpViewControllerDelegate {
    func signUpViewControllerDidSignUp(_ viewController: SignUpViewController) {
        delegate?.authCoordinatorDidFinish(self)
    }
}

// MARK: - Main Flow
protocol MainCoordinatorDelegate: AnyObject {
    func mainCoordinatorDidFinish(_ coordinator: MainCoordinator)
}

final class MainCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let container: DependencyContainerProtocol
    weak var delegate: MainCoordinatorDelegate?
    
    init(navigationController: UINavigationController, container: DependencyContainerProtocol) {
        self.navigationController = navigationController
        self.container = container
    }
    
    func start() {
        let tabBarController = MainTabBarController()
        
        // Events Tab
        let eventsCoordinator = EventsCoordinator(container: container)
        addChild(eventsCoordinator)
        
        // Chat Tab
        let chatCoordinator = ChatCoordinator(container: container)
        addChild(chatCoordinator)
        
        // Profile Tab
        let profileCoordinator = ProfileCoordinator(container: container)
        addChild(profileCoordinator)
        
        tabBarController.viewControllers = [
            eventsCoordinator.navigationController,
            chatCoordinator.navigationController,
            profileCoordinator.navigationController
        ]
        
        navigationController.setViewControllers([tabBarController], animated: true)
    }
}

// MARK: - Events Flow
final class EventsCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
        self.navigationController = UINavigationController()
        self.navigationController.tabBarItem = UITabBarItem(
            title: "Events",
            image: UIImage(systemName: "calendar"),
            selectedImage: UIImage(systemName: "calendar.fill")
        )
    }
    
    func start() {
        let eventsVC = EventsViewController(container: container)
        eventsVC.delegate = self
        navigationController.setViewControllers([eventsVC], animated: false)
    }
}

extension EventsCoordinator: EventsViewControllerDelegate {
    func eventsViewController(_ viewController: EventsViewController, didSelectEvent event: Event) {
        let eventDetailVC = EventDetailViewController(event: event, container: container)
        eventDetailVC.delegate = self
        navigationController.pushViewController(eventDetailVC, animated: true)
    }
    
    func eventsViewControllerDidRequestCreateEvent(_ viewController: EventsViewController) {
        let createEventVC = CreateEventViewController(container: container)
        createEventVC.delegate = self
        let nav = UINavigationController(rootViewController: createEventVC)
        navigationController.present(nav, animated: true)
    }
}

// MARK: - Chat Flow
final class ChatCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
        self.navigationController = UINavigationController()
        self.navigationController.tabBarItem = UITabBarItem(
            title: "Chat",
            image: UIImage(systemName: "message"),
            selectedImage: UIImage(systemName: "message.fill")
        )
    }
    
    func start() {
        let chatListVC = ChatListViewController(container: container)
        chatListVC.delegate = self
        navigationController.setViewControllers([chatListVC], animated: false)
    }
}

extension ChatCoordinator: ChatListViewControllerDelegate {
    func chatListViewController(_ viewController: ChatListViewController, didSelectChat chat: Chat) {
        let chatDetailVC = ChatDetailViewController(chat: chat, container: container)
        navigationController.pushViewController(chatDetailVC, animated: true)
    }
}

// MARK: - Profile Flow
final class ProfileCoordinator: Coordinator {
    var childCoordinators: [Coordinator] = []
    let navigationController: UINavigationController
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
        self.navigationController = UINavigationController()
        self.navigationController.tabBarItem = UITabBarItem(
            title: "Profile",
            image: UIImage(systemName: "person"),
            selectedImage: UIImage(systemName: "person.fill")
        )
    }
    
    func start() {
        let profileVC = ProfileViewController(container: container)
        profileVC.delegate = self
        navigationController.setViewControllers([profileVC], animated: false)
    }
} 