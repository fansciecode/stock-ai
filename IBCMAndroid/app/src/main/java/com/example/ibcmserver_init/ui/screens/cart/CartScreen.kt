package com.example.ibcmserver_init.ui.screens.cart

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.lazyListState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.graphicsLayer
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import com.example.ibcmserver_init.ui.screens.event.ProductData
import kotlinx.coroutines.launch

data class CartItem(
    val product: ProductData,
    var quantity: Int
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun CartScreen(
    viewModel: CartViewModel,
    onBackClick: () -> Unit,
    onCheckout: (List<CartItem>) -> Unit,
    onProductClick: (ProductData) -> Unit,
    modifier: Modifier = Modifier
) {
    val cartState by viewModel.cartState.collectAsState()
    var showCheckoutDialog by remember { mutableStateOf(false) }
    var promoCode by remember { mutableStateOf("") }
    val scope = rememberCoroutineScope()
    val snackbarHostState = remember { SnackbarHostState() }

    // Animation states
    val listState = rememberLazyListState()
    val isScrolled = listState.firstVisibleItemScrollOffset > 0 || listState.firstVisibleItemIndex > 0
    
    val topBarColor by animateColorAsState(
        targetValue = if (isScrolled) 
            MaterialTheme.colorScheme.surface 
        else MaterialTheme.colorScheme.surface.copy(alpha = 0.95f),
        label = "topBarColor"
    )
    
    val topBarElevation by animateDpAsState(
        targetValue = if (isScrolled) 4.dp else 0.dp,
        label = "topBarElevation"
    )

    LaunchedEffect(cartState.error) {
        cartState.error?.let { error ->
            snackbarHostState.showSnackbar(
                message = error,
                duration = SnackbarDuration.Short
            )
        }
    }

    Scaffold(
        snackbarHost = { SnackbarHost(snackbarHostState) },
        topBar = {
            Surface(
                color = topBarColor,
                tonalElevation = topBarElevation
            ) {
                TopAppBar(
                    navigationIcon = {
                        IconButton(onClick = onBackClick) {
                            Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                        }
                    },
                    title = { 
                        Text(
                            text = "Shopping Cart",
                            style = MaterialTheme.typography.titleLarge
                        )
                    },
                    actions = {
                        AnimatedVisibility(
                            visible = cartState.items.isNotEmpty(),
                            enter = fadeIn() + expandHorizontally(),
                            exit = fadeOut() + shrinkHorizontally()
                        ) {
                            IconButton(
                                onClick = { viewModel.clearCart() }
                            ) {
                                Icon(Icons.Default.Delete, contentDescription = "Clear cart")
                            }
                        }
                    }
                )
            }
        },
        bottomBar = {
            AnimatedVisibility(
                visible = cartState.items.isNotEmpty(),
                enter = slideInVertically { it } + fadeIn(),
                exit = slideOutVertically { it } + fadeOut()
            ) {
                Surface(
                    tonalElevation = 8.dp,
                    shadowElevation = 8.dp
                ) {
                    Column {
                        // Promo code section
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(horizontal = 16.dp, vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            OutlinedTextField(
                                value = promoCode,
                                onValueChange = { promoCode = it },
                                placeholder = { Text("Enter promo code") },
                                modifier = Modifier.weight(1f),
                                singleLine = true,
                                enabled = !cartState.isLoading,
                                trailingIcon = if (cartState.promoCode.isNotEmpty()) {
                                    {
                                        IconButton(onClick = {
                                            promoCode = ""
                                            viewModel.applyPromoCode("")
                                        }) {
                                            Icon(Icons.Default.Close, "Clear promo code")
                                        }
                                    }
                                } else null
                            )
                            TextButton(
                                onClick = { viewModel.applyPromoCode(promoCode) },
                                enabled = promoCode.isNotEmpty() && !cartState.isLoading
                            ) {
                                if (cartState.isLoading) {
                                    CircularProgressIndicator(
                                        modifier = Modifier.size(16.dp),
                                        strokeWidth = 2.dp
                                    )
                                } else {
                                    Text("Apply")
                                }
                            }
                        }

                        // Total and checkout button
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(16.dp),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Column {
                                if (cartState.promoDiscount > 0) {
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        Surface(
                                            color = MaterialTheme.colorScheme.primary,
                                            shape = RoundedCornerShape(4.dp)
                                        ) {
                                            Text(
                                                text = "${(cartState.promoDiscount * 100).toInt()}% OFF",
                                                color = MaterialTheme.colorScheme.onPrimary,
                                                style = MaterialTheme.typography.labelSmall,
                                                modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                            )
                                        }
                                        Text(
                                            text = cartState.promoCode,
                                            style = MaterialTheme.typography.labelMedium,
                                            color = MaterialTheme.colorScheme.primary
                                        )
                                    }
                                }
                                
                                Text(
                                    text = "Total Amount",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    Text(
                                        text = "₹${cartState.totalAmount}",
                                        style = MaterialTheme.typography.titleLarge,
                                        fontWeight = FontWeight.Bold
                                    )
                                    if (cartState.promoDiscount > 0) {
                                        Text(
                                            text = "₹${calculateOriginalAmount(cartState)}",
                                            style = MaterialTheme.typography.titleSmall,
                                            textDecoration = TextDecoration.LineThrough,
                                            color = MaterialTheme.colorScheme.onSurfaceVariant
                                        )
                                    }
                                }
                            }
                            Button(
                                onClick = { showCheckoutDialog = true },
                                modifier = Modifier.width(150.dp)
                            ) {
                                Text("Checkout")
                            }
                        }
                    }
                }
            }
        }
    ) { padding ->
        if (cartState.items.isEmpty()) {
            EmptyCartView(
                onBackClick = onBackClick,
                modifier = Modifier.padding(padding)
            )
        } else {
            LazyColumn(
                state = listState,
                modifier = modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                items(
                    items = cartState.items,
                    key = { it.product.id }
                ) { item ->
                    CartItemCard(
                        cartItem = item,
                        onUpdateQuantity = { product, quantity ->
                            viewModel.updateQuantity(product, quantity)
                        },
                        onRemoveItem = { product ->
                            viewModel.removeFromCart(product)
                        },
                        onProductClick = onProductClick
                    )
                }
            }
        }
    }

    if (showCheckoutDialog) {
        AlertDialog(
            onDismissRequest = { showCheckoutDialog = false },
            title = { Text("Confirm Checkout") },
            text = { 
                Column {
                    Text("Total amount: ₹${cartState.totalAmount}")
                    if (cartState.promoDiscount > 0) {
                        Text(
                            text = "Discount applied: ${(cartState.promoDiscount * 100).toInt()}%",
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    Text("Proceed to payment?")
                }
            },
            confirmButton = {
                Button(
                    onClick = {
                        onCheckout(cartState.items)
                        showCheckoutDialog = false
                    }
                ) {
                    Text("Proceed")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCheckoutDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

private fun calculateOriginalAmount(cartState: CartState): Double {
    return cartState.totalAmount / (1 - cartState.promoDiscount)
}

@Composable
private fun EmptyCartView(
    onBackClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier.fillMaxSize(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.ShoppingCart,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "Your cart is empty",
            style = MaterialTheme.typography.titleLarge
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = "Add items to your cart to proceed",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(24.dp))
        OutlinedButton(onClick = onBackClick) {
            Icon(Icons.Default.ArrowBack, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Continue Shopping")
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CartItemCard(
    cartItem: CartItem,
    onUpdateQuantity: (ProductData, Int) -> Unit,
    onRemoveItem: (ProductData) -> Unit,
    onProductClick: (ProductData) -> Unit
) {
    val dismissState = rememberDismissState(
        confirmValueChange = { value ->
            if (value == DismissValue.DismissedToStart) {
                onRemoveItem(cartItem.product)
                true
            } else {
                false
            }
        }
    )

    SwipeToDismiss(
        state = dismissState,
        background = {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(MaterialTheme.colorScheme.error)
                    .padding(horizontal = 16.dp),
                contentAlignment = Alignment.CenterEnd
            ) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete",
                    tint = Color.White
                )
            }
        },
        dismissContent = {
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .clickable { onProductClick(cartItem.product) }
                    .animateContentSize(),
                elevation = CardDefaults.cardElevation(
                    defaultElevation = 2.dp
                )
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(8.dp),
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Product image
                    AsyncImage(
                        model = cartItem.product.imageUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .size(80.dp)
                            .clip(RoundedCornerShape(8.dp)),
                        contentScale = ContentScale.Crop
                    )

                    // Product details
                    Column(
                        modifier = Modifier.weight(1f)
                    ) {
                        Text(
                            text = cartItem.product.name,
                            style = MaterialTheme.typography.titleMedium,
                            fontWeight = FontWeight.Bold
                        )
                        
                        if (cartItem.product.discount != null) {
                            Row(
                                verticalAlignment = Alignment.CenterVertically,
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                Text(
                                    text = cartItem.product.price,
                                    style = MaterialTheme.typography.titleMedium,
                                    fontWeight = FontWeight.Bold
                                )
                                Surface(
                                    color = MaterialTheme.colorScheme.error,
                                    shape = RoundedCornerShape(4.dp)
                                ) {
                                    Text(
                                        text = "${cartItem.product.discount}% OFF",
                                        color = Color.White,
                                        style = MaterialTheme.typography.labelSmall,
                                        modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                    )
                                }
                            }
                        } else {
                            Text(
                                text = cartItem.product.price,
                                style = MaterialTheme.typography.titleMedium,
                                fontWeight = FontWeight.Bold
                            )
                        }

                        // Quantity selector
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            modifier = Modifier.padding(top = 8.dp)
                        ) {
                            IconButton(
                                onClick = { 
                                    if (cartItem.quantity > 1) {
                                        onUpdateQuantity(cartItem.product, cartItem.quantity - 1)
                                    }
                                },
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(
                                        MaterialTheme.colorScheme.surfaceVariant,
                                        CircleShape
                                    )
                            ) {
                                Icon(
                                    Icons.Default.Remove,
                                    contentDescription = "Decrease",
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                            
                            Text(
                                text = cartItem.quantity.toString(),
                                style = MaterialTheme.typography.titleMedium
                            )
                            
                            IconButton(
                                onClick = { 
                                    if (cartItem.quantity < cartItem.product.maxQuantity) {
                                        onUpdateQuantity(cartItem.product, cartItem.quantity + 1)
                                    }
                                },
                                modifier = Modifier
                                    .size(24.dp)
                                    .background(
                                        MaterialTheme.colorScheme.surfaceVariant,
                                        CircleShape
                                    )
                            ) {
                                Icon(
                                    Icons.Default.Add,
                                    contentDescription = "Increase",
                                    modifier = Modifier.size(16.dp)
                                )
                            }
                        }
                    }
                }
            }
        },
        directions = setOf(DismissDirection.EndToStart)
    )
} 