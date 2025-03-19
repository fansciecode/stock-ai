package com.example.ibcmserver_init.ui.navigation

import androidx.compose.runtime.Composable
import androidx.navigation.NavHostController
import androidx.navigation.compose.NavHost
import androidx.navigation.compose.composable
import androidx.navigation.navArgument
import androidx.navigation.navType
import com.example.ibcmserver_init.ui.screens.auth.LoginScreen
import com.example.ibcmserver_init.ui.screens.auth.SignupScreen
import com.example.ibcmserver_init.ui.screens.category.CategorySelectionScreen
import com.example.ibcmserver_init.ui.screens.dashboard.DashboardScreen
import com.example.ibcmserver_init.ui.screens.event.EventCreationScreen
import com.example.ibcmserver_init.ui.screens.event.EventDetailsScreen
import com.example.ibcmserver_init.ui.screens.event.EventSearchScreen
import com.example.ibcmserver_init.ui.screens.profile.UserProfileScreen
import com.example.ibcmserver_init.ui.screens.settings.SettingsScreen
import com.example.ibcmserver_init.ui.screens.product.ProductDetailsScreen
import com.example.ibcmserver_init.ui.screens.order.OrderScreen
import com.example.ibcmserver_init.ui.screens.order.OrderDetailsScreen

sealed class Screen(val route: String) {
    object Login : Screen("login")
    object Signup : Screen("signup")
    object CategorySelection : Screen("category_selection")
    object Dashboard : Screen("dashboard")
    object EventCreation : Screen("event_creation")
    object EventDetails : Screen("event_details/{eventId}") {
        fun createRoute(eventId: String) = "event_details/$eventId"
    }
    object ProductDetails : Screen("event/{eventId}/product/{productId}") {
        fun createRoute(eventId: String, productId: String) = "event/$eventId/product/$productId"
    }
    object EventSearch : Screen("event_search")
    object UserProfile : Screen("user_profile")
    object Settings : Screen("settings")
    object Orders : Screen("orders/{userId}") {
        fun createRoute(userId: String) = "orders/$userId"
    }
    object OrderDetails : Screen("orders/{userId}/order/{orderId}") {
        fun createRoute(userId: String, orderId: String) = "orders/$userId/order/$orderId"
    }
}

@Composable
fun AppNavigation(
    navController: NavHostController = rememberNavController(),
    startDestination: String = Screen.Login.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Login.route) {
            LoginScreen(
                onLoginSuccess = { navController.navigate(Screen.Dashboard.route) },
                onNavigateToSignup = { navController.navigate(Screen.Signup.route) }
            )
        }

        composable(Screen.Signup.route) {
            SignupScreen(
                onSignupSuccess = { navController.navigate(Screen.CategorySelection.route) },
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.CategorySelection.route) {
            CategorySelectionScreen(
                onCategoriesSelected = { navController.navigate(Screen.Dashboard.route) }
            )
        }

        composable(Screen.Dashboard.route) {
            DashboardScreen(
                onEventClick = { eventId -> navController.navigate("${Screen.EventDetails.route}/$eventId") },
                onEventCreationClick = { navController.navigate(Screen.EventCreation.route) },
                onEventSearchClick = { navController.navigate(Screen.EventSearch.route) },
                onProfileClick = { navController.navigate(Screen.UserProfile.route) },
                onSettingsClick = { navController.navigate(Screen.Settings.route) }
            )
        }

        composable(Screen.EventCreation.route) {
            EventCreationScreen(
                onEventCreated = { navController.navigate(Screen.Dashboard.route) },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.EventSearch.route) {
            EventSearchScreen(
                onEventClick = { eventId -> navController.navigate("${Screen.EventDetails.route}/$eventId") },
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = "${Screen.EventDetails.route}/{eventId}",
            arguments = listOf(navArgument("eventId") { type = NavType.StringType })
        ) { backStackEntry ->
            val eventId = backStackEntry.arguments?.getString("eventId") ?: return@composable
            EventDetailsScreen(
                eventId = eventId,
                onBackClick = { navController.popBackStack() },
                onNavigateToUserProfile = { userId -> navController.navigate("${Screen.UserProfile.route}/$userId") },
                onNavigateToProduct = { productId -> 
                    navController.navigate(Screen.ProductDetails.createRoute(eventId, productId))
                }
            )
        }

        composable(
            route = Screen.ProductDetails.route,
            arguments = listOf(
                navArgument("eventId") { type = NavType.StringType },
                navArgument("productId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val eventId = backStackEntry.arguments?.getString("eventId") ?: return@composable
            val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
            ProductDetailsScreen(
                eventId = eventId,
                productId = productId,
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(Screen.UserProfile.route) {
            UserProfileScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(Screen.Settings.route) {
            SettingsScreen(
                onBackClick = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.Orders.route,
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val userId = backStackEntry.arguments?.getString("userId") ?: return@composable
            OrderScreen(
                userId = userId,
                onNavigateToOrderDetails = { orderId ->
                    navController.navigate(Screen.OrderDetails.createRoute(userId, orderId))
                }
            )
        }

        composable(
            route = Screen.OrderDetails.route,
            arguments = listOf(
                navArgument("userId") { type = NavType.StringType },
                navArgument("orderId") { type = NavType.StringType }
            )
        ) { backStackEntry ->
            val orderId = backStackEntry.arguments?.getString("orderId") ?: return@composable
            OrderDetailsScreen(
                orderId = orderId,
                onNavigateBack = { navController.popBackStack() }
            )
        }
    }
} 