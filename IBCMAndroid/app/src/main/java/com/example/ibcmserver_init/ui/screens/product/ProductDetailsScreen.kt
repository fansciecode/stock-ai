@Composable
fun ProductDetailsScreen(
    productId: String,
    onDismiss: () -> Unit,
    viewModel: ProductDetailsViewModel = hiltViewModel(),
    navController: NavController
) {
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Product Details") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                },
                actions = {
                    IconButton(
                        onClick = {
                            navController.navigate(Screen.ProductReviews.createRoute(productId))
                        }
                    ) {
                        Icon(Icons.Default.Star, contentDescription = "View Reviews")
                    }
                }
            )
        }
    ) { padding ->
        // ... existing content ...
    }
} 