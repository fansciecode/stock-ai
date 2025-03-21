import UIKit

extension AppDelegate {
    func setupNavigation() {
        let container = DependencyContainer.shared
        
        // Register navigators
        NavigationController.shared.register(
            navigator: AuthNavigator(container: container),
            for: "login"
        )
        NavigationController.shared.register(
            navigator: AuthNavigator(container: container),
            for: "signup"
        )
        NavigationController.shared.register(
            navigator: AuthNavigator(container: container),
            for: "verification"
        )
        
        NavigationController.shared.register(
            navigator: EventsNavigator(container: container),
            for: "events"
        )
        
        NavigationController.shared.register(
            navigator: ChatNavigator(container: container),
            for: "chats"
        )
        
        NavigationController.shared.register(
            navigator: ProfileNavigator(container: container),
            for: "profile"
        )
        
        NavigationController.shared.register(
            navigator: SettingsNavigator(container: container),
            for: "settings"
        )
    }
}

// MARK: - Additional Navigators
final class ChatNavigator: Navigator {
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        switch route {
        case .chatList:
            let chatListVC = ChatListViewController(container: container)
            viewController.navigationController?.setViewControllers([chatListVC], animated: true)
            
        case .chatDetail(let id):
            let chatDetailVC = ChatDetailViewController(chatId: id, container: container)
            viewController.navigationController?.pushViewController(chatDetailVC, animated: true)
            
        default:
            print("Route not handled by ChatNavigator: \(route.path)")
        }
    }
}

final class ProfileNavigator: Navigator {
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        switch route {
        case .profile:
            let profileVC = ProfileViewController(container: container)
            viewController.navigationController?.setViewControllers([profileVC], animated: true)
            
        case .editProfile:
            let editProfileVC = EditProfileViewController(container: container)
            viewController.navigationController?.pushViewController(editProfileVC, animated: true)
            
        default:
            print("Route not handled by ProfileNavigator: \(route.path)")
        }
    }
}

final class SettingsNavigator: Navigator {
    private let container: DependencyContainerProtocol
    
    init(container: DependencyContainerProtocol) {
        self.container = container
    }
    
    func navigate(to route: Route, from viewController: UIViewController) {
        switch route {
        case .settings:
            let settingsVC = SettingsViewController(container: container)
            viewController.navigationController?.pushViewController(settingsVC, animated: true)
            
        default:
            print("Route not handled by SettingsNavigator: \(route.path)")
        }
    }
} 