package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun WishlistScreen(
    viewModel: WishlistViewModel,
    products: List<ProductData>,
    onBackClick: () -> Unit,
    onProductClick: (ProductData) -> Unit,
    onAddToCart: (ProductData) -> Unit,
    modifier: Modifier = Modifier
) {
    val wishlistState by viewModel.wishlistState.collectAsState()
    val wishlistedProducts = products.filter { it.id in wishlistState.wishlistedProducts }
    
    LaunchedEffect(Unit) {
        viewModel.loadWishlist()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                title = { Text("Wishlist") },
                actions = {
                    if (wishlistedProducts.isNotEmpty()) {
                        IconButton(onClick = { viewModel.clearWishlist() }) {
                            Icon(Icons.Default.Delete, contentDescription = "Clear wishlist")
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (wishlistState.isLoading) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        } else if (wishlistedProducts.isEmpty()) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    Icon(
                        Icons.Default.FavoriteBorder,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Your wishlist is empty",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = "Save items you like by tapping the heart icon",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 160.dp),
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
            ) {
                items(
                    items = wishlistedProducts,
                    key = { it.id }
                ) { product ->
                    ProductCard(
                        product = product,
                        isWishlisted = true,
                        onProductClick = onProductClick,
                        onAddToCart = onAddToCart,
                        onToggleWishlist = { viewModel.removeFromWishlist(it.id) }
                    )
                }
            }
        }

        // Error Snackbar
        wishlistState.error?.let { error ->
            Snackbar(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(error)
            }
        }
    }
} 