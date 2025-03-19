package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.event.Product
import com.example.ibcmserver_init.ui.components.LoadingDialog
import com.example.ibcmserver_init.utils.NetworkResult

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductDetailsScreen(
    productId: String,
    eventId: String,
    onNavigateBack: () -> Unit,
    viewModel: ProductDetailsViewModel = hiltViewModel()
) {
    var quantity by remember { mutableStateOf(1) }
    var showOrderDialog by remember { mutableStateOf(false) }
    
    val productState by viewModel.productState.collectAsState()
    val orderState by viewModel.orderState.collectAsState()

    LaunchedEffect(productId) {
        viewModel.loadProduct(productId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Product Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showOrderDialog = true }) {
                        Icon(Icons.Default.ShoppingCart, contentDescription = "Order")
                    }
                }
            )
        }
    ) { padding ->
        when (val state = productState) {
            is NetworkResult.Loading -> {
                LoadingDialog(message = "Loading product details...")
            }
            is NetworkResult.Success -> {
                ProductContent(
                    product = state.data,
                    quantity = quantity,
                    onQuantityChange = { quantity = it },
                    onOrder = { showOrderDialog = true },
                    modifier = Modifier.padding(padding)
                )
            }
            is NetworkResult.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = state.message,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            else -> {}
        }
    }

    if (showOrderDialog && productState is NetworkResult.Success) {
        OrderDialog(
            product = (productState as NetworkResult.Success<Product>).data,
            quantity = quantity,
            onDismiss = { showOrderDialog = false },
            onConfirm = { qty ->
                viewModel.placeOrder(eventId, productId, qty)
                showOrderDialog = false
            }
        )
    }

    // Show order status
    when (val state = orderState) {
        is NetworkResult.Loading -> {
            LoadingDialog(message = "Processing order...")
        }
        is NetworkResult.Success -> {
            LaunchedEffect(state) {
                // Show success message and navigate back
                onNavigateBack()
            }
        }
        is NetworkResult.Error -> {
            AlertDialog(
                onDismissRequest = { viewModel.resetOrderState() },
                title = { Text("Order Failed") },
                text = { Text(state.message) },
                confirmButton = {
                    TextButton(onClick = { viewModel.resetOrderState() }) {
                        Text("OK")
                    }
                }
            )
        }
        else -> {}
    }
}

@Composable
private fun ProductContent(
    product: Product,
    quantity: Int,
    onQuantityChange: (Int) -> Unit,
    onOrder: () -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Product Images
        if (product.images.isNotEmpty()) {
            item {
                AsyncImage(
                    model = product.images[0],
                    contentDescription = product.name,
                    modifier = Modifier
                        .fillMaxWidth()
                        .height(200.dp),
                    contentScale = ContentScale.Crop
                )
            }
        }

        // Product Info
        item {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = product.name,
                    style = MaterialTheme.typography.headlineMedium
                )
                Text(
                    text = "Price: $${product.price}",
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = product.description,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = "Category: ${product.category}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Available: ${product.inventory}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        // Specifications
        if (product.specifications.isNotEmpty()) {
            item {
                Card(
                    modifier = Modifier.fillMaxWidth(),
                    elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
                ) {
                    Column(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text(
                            text = "Specifications",
                            style = MaterialTheme.typography.titleMedium
                        )
                        product.specifications.forEach { (key, value) ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween
                            ) {
                                Text(
                                    text = key,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                Text(
                                    text = value,
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                }
            }
        }

        // Order Section
        item {
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Order",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            IconButton(
                                onClick = { if (quantity > 1) onQuantityChange(quantity - 1) }
                            ) {
                                Icon(Icons.Default.Remove, "Decrease quantity")
                            }
                            Text(
                                text = quantity.toString(),
                                style = MaterialTheme.typography.titleMedium
                            )
                            IconButton(
                                onClick = { if (quantity < product.inventory) onQuantityChange(quantity + 1) }
                            ) {
                                Icon(Icons.Default.Add, "Increase quantity")
                            }
                        }
                        Text(
                            text = "Total: $${product.price * quantity}",
                            style = MaterialTheme.typography.titleMedium
                        )
                    }
                    Button(
                        onClick = onOrder,
                        modifier = Modifier.fillMaxWidth(),
                        enabled = product.inventory > 0
                    ) {
                        Text("Place Order")
                    }
                }
            }
        }
    }
}

@Composable
private fun OrderDialog(
    product: Product,
    quantity: Int,
    onDismiss: () -> Unit,
    onConfirm: (Int) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Confirm Order") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Product: ${product.name}")
                Text("Quantity: $quantity")
                Text("Total: $${product.price * quantity}")
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onConfirm(quantity) }
            ) {
                Text("Confirm")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 