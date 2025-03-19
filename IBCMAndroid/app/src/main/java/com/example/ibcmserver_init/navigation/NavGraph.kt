sealed class Screen(val route: String) {
    object CategorySelection : Screen("category_selection")
    object Dashboard : Screen("dashboard")
    object EventDetails : Screen("event_details/{eventId}") {
        fun createRoute(eventId: String) = "event_details/$eventId"
    }
    object EventForm : Screen("event_form?eventId={eventId}") {
        fun createRoute(eventId: String? = null) = if (eventId != null) {
            "event_form?eventId=$eventId"
        } else {
            "event_form"
        }
    }
    object ProductReviews : Screen("product/{productId}/reviews") {
        fun createRoute(productId: String) = "product/$productId/reviews"
    }
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.CategorySelection.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        // ... existing code ...

        composable(
            route = Screen.EventForm.route,
            arguments = listOf(
                navArgument("eventId") {
                    type = NavType.StringType
                    nullable = true
                    defaultValue = null
                }
            )
        ) {
            EventFormScreen(
                onNavigateBack = { navController.popBackStack() }
            )
        }

        composable(
            route = Screen.ProductReviews.route,
            arguments = listOf(navArgument("productId") { type = NavType.StringType })
        ) { backStackEntry ->
            val productId = backStackEntry.arguments?.getString("productId") ?: return@composable
            ProductReviewScreen(
                productId = productId,
                onDismiss = { navController.navigateUp() }
            )
        }
    }
} 