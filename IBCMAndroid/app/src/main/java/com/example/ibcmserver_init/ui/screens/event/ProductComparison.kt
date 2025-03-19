package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductComparisonScreen(
    products: List<ProductData>,
    selectedProducts: Set<String>,
    onBackClick: () -> Unit,
    onAddProduct: () -> Unit,
    onRemoveProduct: (String) -> Unit,
    onAddToCart: (ProductData) -> Unit,
    modifier: Modifier = Modifier
) {
    val comparedProducts = products.filter { it.id in selectedProducts }
    
    Scaffold(
        topBar = {
            TopAppBar(
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                title = { Text("Compare Products") },
                actions = {
                    if (selectedProducts.size < 3) {
                        IconButton(onClick = onAddProduct) {
                            Icon(Icons.Default.Add, contentDescription = "Add product")
                        }
                    }
                }
            )
        }
    ) { padding ->
        if (comparedProducts.isEmpty()) {
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
                        Icons.Default.CompareArrows,
                        contentDescription = null,
                        modifier = Modifier.size(64.dp),
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = "Select products to compare",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Text(
                        text = "Add up to 3 products for comparison",
                        style = MaterialTheme.typography.bodyMedium,
                        textAlign = TextAlign.Center,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Button(onClick = onAddProduct) {
                        Icon(Icons.Default.Add, contentDescription = null)
                        Spacer(modifier = Modifier.width(8.dp))
                        Text("Add Product")
                    }
                }
            }
        } else {
            LazyColumn(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Product Images
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        comparedProducts.forEach { product ->
                            Column(
                                modifier = Modifier.weight(1f),
                                horizontalAlignment = Alignment.CenterHorizontally
                            ) {
                                Box {
                                    AsyncImage(
                                        model = product.imageUrl,
                                        contentDescription = null,
                                        modifier = Modifier
                                            .fillMaxWidth()
                                            .aspectRatio(1f),
                                        contentScale = ContentScale.Crop
                                    )
                                    IconButton(
                                        onClick = { onRemoveProduct(product.id) },
                                        modifier = Modifier.align(Alignment.TopEnd)
                                    ) {
                                        Icon(Icons.Default.Close, contentDescription = "Remove")
                                    }
                                }
                                Text(
                                    text = product.name,
                                    style = MaterialTheme.typography.titleSmall,
                                    maxLines = 2,
                                    textAlign = TextAlign.Center
                                )
                            }
                        }
                    }
                }

                // Comparison Sections
                item {
                    ComparisonSection(
                        title = "Price",
                        values = comparedProducts.map { it.price }
                    )
                }

                item {
                    ComparisonSection(
                        title = "Rating",
                        values = comparedProducts.map { "${it.rating} (${it.reviewCount} reviews)" }
                    )
                }

                item {
                    ComparisonSection(
                        title = "Discount",
                        values = comparedProducts.map { 
                            if (it.discount != null) "${it.discount}% OFF" else "No discount"
                        }
                    )
                }

                // Add to Cart Buttons
                item {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        comparedProducts.forEach { product ->
                            OutlinedButton(
                                onClick = { onAddToCart(product) },
                                modifier = Modifier.weight(1f)
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
}

@Composable
private fun ComparisonSection(
    title: String,
    values: List<String>,
    modifier: Modifier = Modifier
) {
    val allSame = values.all { it == values.first() }
    
    Column(
        modifier = modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.primary
        )
        
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            values.forEach { value ->
                Surface(
                    modifier = Modifier.weight(1f),
                    color = if (!allSame) 
                        MaterialTheme.colorScheme.primaryContainer.copy(alpha = 0.1f)
                    else Color.Transparent,
                    shape = MaterialTheme.shapes.small
                ) {
                    Text(
                        text = value,
                        style = MaterialTheme.typography.bodyMedium,
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(8.dp),
                        textAlign = TextAlign.Center
                    )
                }
            }
        }
    }
}

@Composable
fun ProductComparisonButton(
    isSelected: Boolean,
    onToggle: () -> Unit,
    modifier: Modifier = Modifier
) {
    IconButton(
        onClick = onToggle,
        modifier = modifier
    ) {
        Icon(
            if (isSelected) Icons.Default.CompareArrows else Icons.Default.Compare,
            contentDescription = "Compare",
            tint = if (isSelected) 
                MaterialTheme.colorScheme.primary 
            else MaterialTheme.colorScheme.onSurface
        )
    }
} 