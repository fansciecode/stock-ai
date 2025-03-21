package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.animation.core.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.ExperimentalComposeUiApi
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.focus.FocusRequester
import androidx.compose.ui.focus.focusRequester
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalSoftwareKeyboardController
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.input.ImeAction
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import coil.compose.AsyncImage
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch

enum class ProductSortOption {
    PRICE_LOW_TO_HIGH,
    PRICE_HIGH_TO_LOW,
    NEWEST_FIRST,
    POPULARITY,
    DISCOUNT
}

data class PriceRange(
    val min: Double,
    val max: Double
)

@OptIn(ExperimentalMaterial3Api::class, ExperimentalComposeUiApi::class)
@Composable
fun BusinessCatalog(
    products: List<ProductData>,
    categories: List<String>,
    onProductClick: (ProductData) -> Unit,
    onAddToCart: (ProductData) -> Unit,
    onToggleWishlist: (ProductData) -> Unit,
    wishlistedProducts: Set<String>,
    modifier: Modifier = Modifier
) {
    var searchQuery by remember { mutableStateOf("") }
    var selectedCategory by remember { mutableStateOf<String?>(null) }
    var selectedSortOption by remember { mutableStateOf(ProductSortOption.NEWEST_FIRST) }
    var showSortOptions by remember { mutableStateOf(false) }
    var showPriceFilter by remember { mutableStateOf(false) }
    var isSearchExpanded by remember { mutableStateOf(false) }
    
    // Price filter state
    val priceRange = remember(products) {
        val prices = products.mapNotNull { it.price.removePrefix("₹").toDoubleOrNull() }
        PriceRange(
            min = prices.minOrNull() ?: 0.0,
            max = prices.maxOrNull() ?: 0.0
        )
    }
    var selectedPriceRange by remember { mutableStateOf(priceRange) }
    
    // Animation states
    val listState = rememberLazyGridState()
    val isScrolled = listState.firstVisibleItemIndex > 0
    val headerElevation by animateDpAsState(
        targetValue = if (isScrolled) 4.dp else 0.dp,
        label = "headerElevation"
    )

    val keyboardController = LocalSoftwareKeyboardController.current
    val focusRequester = remember { FocusRequester() }
    val scope = rememberCoroutineScope()

    val filteredProducts = remember(
        products, searchQuery, selectedCategory, 
        selectedSortOption, selectedPriceRange
    ) {
        var result = products
        
        // Apply category filter
        if (selectedCategory != null) {
            result = result.filter { it.category == selectedCategory }
        }
        
        // Apply search filter
        if (searchQuery.isNotEmpty()) {
            result = result.filter { 
                it.name.contains(searchQuery, ignoreCase = true) ||
                it.description.contains(searchQuery, ignoreCase = true)
            }
        }
        
        // Apply price filter
        result = result.filter {
            val price = it.price.removePrefix("₹").toDoubleOrNull() ?: 0.0
            price >= selectedPriceRange.min && price <= selectedPriceRange.max
        }
        
        // Apply sorting
        result = when (selectedSortOption) {
            ProductSortOption.PRICE_LOW_TO_HIGH -> result.sortedBy { 
                it.price.removePrefix("₹").toDoubleOrNull() ?: 0.0 
            }
            ProductSortOption.PRICE_HIGH_TO_LOW -> result.sortedByDescending { 
                it.price.removePrefix("₹").toDoubleOrNull() ?: 0.0 
            }
            ProductSortOption.NEWEST_FIRST -> result.sortedByDescending { it.id }
            ProductSortOption.POPULARITY -> result.sortedByDescending { it.rating }
            ProductSortOption.DISCOUNT -> result.sortedByDescending { it.discount ?: 0 }
        }
        
        result
    }

    Column(modifier = modifier) {
        Surface(
            tonalElevation = headerElevation,
            shadowElevation = headerElevation
        ) {
            Column {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    AnimatedContent(
                        targetState = isSearchExpanded,
                        transitionSpec = {
                            if (targetState) {
                                (slideInHorizontally { it } + fadeIn()).togetherWith(
                                    slideOutHorizontally { -it } + fadeOut()
                                )
                            } else {
                                (slideInHorizontally { -it } + fadeIn()).togetherWith(
                                    slideOutHorizontally { it } + fadeOut()
                                )
                            }
                        }
                    ) { expanded ->
                        if (expanded) {
                            OutlinedTextField(
                                value = searchQuery,
                                onValueChange = { searchQuery = it },
                                placeholder = { Text("Search products...") },
                                modifier = Modifier
                                    .weight(1f)
                                    .focusRequester(focusRequester),
                                leadingIcon = {
                                    Icon(Icons.Default.Search, contentDescription = null)
                                },
                                trailingIcon = {
                                    IconButton(onClick = {
                                        searchQuery = ""
                                        isSearchExpanded = false
                                        keyboardController?.hide()
                                    }) {
                                        Icon(Icons.Default.Close, contentDescription = "Clear search")
                                    }
                                },
                                singleLine = true,
                                keyboardOptions = KeyboardOptions(imeAction = ImeAction.Search),
                                keyboardActions = KeyboardActions(onSearch = {
                                    keyboardController?.hide()
                                })
                            )
                        } else {
                            Row(
                                modifier = Modifier.weight(1f),
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                IconButton(
                                    onClick = {
                                        isSearchExpanded = true
                                        scope.launch {
                                            delay(100) // Wait for animation
                                            focusRequester.requestFocus()
                                        }
                                    }
                                ) {
                                    Icon(Icons.Default.Search, contentDescription = "Search")
                                }
                                
                                Text(
                                    text = if (selectedCategory != null) 
                                        selectedCategory!! 
                                    else "All Products",
                                    style = MaterialTheme.typography.titleMedium,
                                    modifier = Modifier.weight(1f)
                                )
                            }
                        }
                    }

                    IconButton(onClick = { showSortOptions = true }) {
                        Icon(Icons.Default.Sort, contentDescription = "Sort")
                    }
                }

                // Categories
                LazyRow(
                    contentPadding = PaddingValues(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp),
                    modifier = Modifier.padding(bottom = 8.dp)
                ) {
                    item {
                        FilterChip(
                            selected = selectedCategory == null,
                            onClick = { selectedCategory = null },
                            label = { Text("All") },
                            leadingIcon = if (selectedCategory == null) {
                                { Icon(Icons.Default.Check, contentDescription = null) }
                            } else null
                        )
                    }
                    
                    items(categories) { category ->
                        FilterChip(
                            selected = category == selectedCategory,
                            onClick = { selectedCategory = category },
                            label = { Text(category) },
                            leadingIcon = if (category == selectedCategory) {
                                { Icon(Icons.Default.Check, contentDescription = null) }
                            } else null
                        )
                    }
                }

                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    FilterChip(
                        selected = false,
                        onClick = { showPriceFilter = true },
                        label = { Text("Price") },
                        leadingIcon = { Icon(Icons.Default.AttachMoney, contentDescription = null) }
                    )
                }
            }
        }

        if (filteredProducts.isEmpty()) {
            Box(
                modifier = Modifier
                    .weight(1f)
                    .fillMaxWidth(),
                contentAlignment = Alignment.Center
            ) {
                Column(
                    horizontalAlignment = Alignment.CenterHorizontally,
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        Icons.Default.SearchOff,
                        contentDescription = null,
                        modifier = Modifier.size(48.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "No products found",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "Try adjusting your search or filters",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        } else {
            LazyVerticalGrid(
                columns = GridCells.Adaptive(minSize = 160.dp),
                state = listState,
                contentPadding = PaddingValues(16.dp),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp),
                modifier = Modifier.weight(1f)
            ) {
                items(
                    items = filteredProducts,
                    key = { it.id }
                ) { product ->
                    ProductCard(
                        product = product,
                        isWishlisted = wishlistedProducts.contains(product.id),
                        onProductClick = onProductClick,
                        onAddToCart = onAddToCart,
                        onToggleWishlist = onToggleWishlist
                    )
                }
            }
        }
    }

    // Price Filter Dialog
    if (showPriceFilter) {
        var tempPriceRange by remember { mutableStateOf(selectedPriceRange) }
        
        AlertDialog(
            onDismissRequest = { showPriceFilter = false },
            title = { Text("Price Range") },
            text = {
                Column(
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    RangeSlider(
                        value = tempPriceRange.min.toFloat()..tempPriceRange.max.toFloat(),
                        onValueChange = { range ->
                            tempPriceRange = PriceRange(
                                min = range.start.toDouble(),
                                max = range.endInclusive.toDouble()
                            )
                        },
                        valueRange = priceRange.min.toFloat()..priceRange.max.toFloat(),
                        steps = 20
                    )
                    
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("₹${tempPriceRange.min.toInt()}")
                        Text("₹${tempPriceRange.max.toInt()}")
                    }
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        selectedPriceRange = tempPriceRange
                        showPriceFilter = false
                    }
                ) {
                    Text("Apply")
                }
            },
            dismissButton = {
                TextButton(
                    onClick = {
                        showPriceFilter = false
                    }
                ) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showSortOptions) {
        AlertDialog(
            onDismissRequest = { showSortOptions = false },
            title = { Text("Sort By") },
            text = {
                Column {
                    ProductSortOption.values().forEach { option ->
                        Row(
                            modifier = Modifier
                                .fillMaxWidth()
                                .padding(vertical = 8.dp),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = selectedSortOption == option,
                                onClick = {
                                    selectedSortOption = option
                                    showSortOptions = false
                                }
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = when (option) {
                                    ProductSortOption.PRICE_LOW_TO_HIGH -> "Price: Low to High"
                                    ProductSortOption.PRICE_HIGH_TO_LOW -> "Price: High to Low"
                                    ProductSortOption.NEWEST_FIRST -> "Newest First"
                                    ProductSortOption.POPULARITY -> "Most Popular"
                                    ProductSortOption.DISCOUNT -> "Biggest Discount"
                                }
                            )
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showSortOptions = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun ProductCard(
    product: ProductData,
    isWishlisted: Boolean,
    onProductClick: (ProductData) -> Unit,
    onAddToCart: (ProductData) -> Unit,
    onToggleWishlist: (ProductData) -> Unit,
    modifier: Modifier = Modifier
) {
    var isHovered by remember { mutableStateOf(false) }
    
    Card(
        onClick = { onProductClick(product) },
        modifier = modifier.animateContentSize()
    ) {
        Box {
            Column {
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .aspectRatio(1f)
                ) {
                    AsyncImage(
                        model = product.imageUrl,
                        contentDescription = null,
                        modifier = Modifier.fillMaxSize(),
                        contentScale = ContentScale.Crop
                    )
                    
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        if (product.discount != null) {
                            Surface(
                                color = MaterialTheme.colorScheme.error,
                                shape = RoundedCornerShape(4.dp)
                            ) {
                                Text(
                                    text = "${product.discount}% OFF",
                                    color = Color.White,
                                    style = MaterialTheme.typography.labelSmall,
                                    modifier = Modifier.padding(horizontal = 4.dp, vertical = 2.dp)
                                )
                            }
                        }
                        
                        IconButton(
                            onClick = { onToggleWishlist(product) },
                            modifier = Modifier
                                .size(32.dp)
                                .background(
                                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f),
                                    shape = CircleShape
                                )
                        ) {
                            Icon(
                                if (isWishlisted) Icons.Filled.Favorite else Icons.Filled.FavoriteBorder,
                                contentDescription = "Wishlist",
                                tint = if (isWishlisted) MaterialTheme.colorScheme.error else MaterialTheme.colorScheme.onSurface
                            )
                        }
                    }
                }

                Column(
                    modifier = Modifier.padding(8.dp)
                ) {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.titleSmall,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Row(
                            modifier = Modifier
                                .clip(RoundedCornerShape(4.dp))
                                .background(MaterialTheme.colorScheme.primaryContainer)
                                .padding(horizontal = 4.dp, vertical = 2.dp),
                            verticalAlignment = Alignment.CenterVertically,
                            horizontalArrangement = Arrangement.spacedBy(2.dp)
                        ) {
                            Icon(
                                Icons.Default.Star,
                                contentDescription = null,
                                modifier = Modifier.size(14.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                            Text(
                                text = "${product.rating}",
                                style = MaterialTheme.typography.labelSmall,
                                color = MaterialTheme.colorScheme.onPrimaryContainer
                            )
                        }
                        Text(
                            text = "(${product.reviewCount})",
                            style = MaterialTheme.typography.labelSmall,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                    }
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Text(
                        text = product.price,
                        style = MaterialTheme.typography.titleMedium,
                        fontWeight = FontWeight.Bold
                    )
                }
            }

            AnimatedVisibility(
                visible = isHovered,
                enter = fadeIn() + expandVertically(),
                exit = fadeOut() + shrinkVertically(),
                modifier = Modifier.align(Alignment.BottomCenter)
            ) {
                Surface(
                    color = MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.9f),
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Row(
                        modifier = Modifier.padding(8.dp),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        OutlinedButton(
                            onClick = { onAddToCart(product) },
                            colors = ButtonDefaults.outlinedButtonColors(
                                containerColor = MaterialTheme.colorScheme.surface
                            )
                        ) {
                            Icon(Icons.Default.ShoppingCart, contentDescription = null)
                            Spacer(modifier = Modifier.width(4.dp))
                            Text("Add to Cart")
                        }
                    }
                }
            }
        }
    }
}

data class ProductData(
    val id: String,
    val name: String,
    val description: String,
    val price: String,
    val imageUrl: String,
    val category: String,
    val rating: Float,
    val reviewCount: Int,
    val discount: Int?
) 