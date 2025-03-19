sealed class Screen(val route: String) {
    object Home : Screen("home")
    object Verification : Screen("verification")
}

@Composable
fun NavGraph(
    navController: NavHostController,
    startDestination: String = Screen.Home.route
) {
    NavHost(
        navController = navController,
        startDestination = startDestination
    ) {
        composable(Screen.Home.route) {
            // Implementation of Home screen
        }

        composable(Screen.Verification.route) {
            VerificationScreen(
                onVerificationComplete = {
                    navController.popBackStack()
                }
            )
        }
    }
} 