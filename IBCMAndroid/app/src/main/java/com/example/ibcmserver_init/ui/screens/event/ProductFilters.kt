package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp

data class FilterState(
    val priceRange: PriceRange,
    val selectedCategories: Set<String> = emptySet(),
    val minRating: Float = 0f,
    val onlyDiscounted: Boolean = false,
    val onlyInStock: Boolean = false,
    val sortOption: ProductSortOption = ProductSortOption.NEWEST_FIRST
)

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductFilters(
    filterState: FilterState,
    categories: List<String>,
    onFilterChange: (FilterState) -> Unit,
    modifier: Modifier = Modifier
) {
    var showFilterSheet by remember { mutableStateOf(false) }
    
    Column(modifier = modifier) {
        // Filter Chips Row
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            // Price Filter
            item {
                FilterChip(
                    selected = false,
                    onClick = { showFilterSheet = true },
                    label = { Text("Filters") },
                    leadingIcon = { Icon(Icons.Default.FilterList, contentDescription = null) }
                )
            }
            
            // Categories
            items(categories) { category ->
                FilterChip(
                    selected = category in filterState.selectedCategories,
                    onClick = {
                        val updatedCategories = filterState.selectedCategories.toMutableSet()
                        if (category in updatedCategories) {
                            updatedCategories.remove(category)
                        } else {
                            updatedCategories.add(category)
                        }
                        onFilterChange(filterState.copy(selectedCategories = updatedCategories))
                    },
                    label = { Text(category) },
                    leadingIcon = if (category in filterState.selectedCategories) {
                        { Icon(Icons.Default.Check, contentDescription = null) }
                    } else null
                )
            }
            
            // Discount Filter
            item {
                FilterChip(
                    selected = filterState.onlyDiscounted,
                    onClick = {
                        onFilterChange(filterState.copy(onlyDiscounted = !filterState.onlyDiscounted))
                    },
                    label = { Text("On Sale") },
                    leadingIcon = { 
                        Icon(
                            Icons.Default.LocalOffer,
                            contentDescription = null,
                            tint = if (filterState.onlyDiscounted) 
                                MaterialTheme.colorScheme.primary 
                            else MaterialTheme.colorScheme.onSurface
                        )
                    }
                )
            }
            
            // In Stock Filter
            item {
                FilterChip(
                    selected = filterState.onlyInStock,
                    onClick = {
                        onFilterChange(filterState.copy(onlyInStock = !filterState.onlyInStock))
                    },
                    label = { Text("In Stock") },
                    leadingIcon = { 
                        Icon(
                            Icons.Default.Inventory,
                            contentDescription = null,
                            tint = if (filterState.onlyInStock) 
                                MaterialTheme.colorScheme.primary 
                            else MaterialTheme.colorScheme.onSurface
                        )
                    }
                )
            }
        }
    }

    if (showFilterSheet) {
        var tempFilterState by remember { mutableStateOf(filterState) }
        
        ModalBottomSheet(
            onDismissRequest = { showFilterSheet = false }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Filter Products",
                    style = MaterialTheme.typography.titleLarge
                )
                
                // Price Range
                Column {
                    Text(
                        text = "Price Range",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    RangeSlider(
                        value = tempFilterState.priceRange.min.toFloat()..tempFilterState.priceRange.max.toFloat(),
                        onValueChange = { range ->
                            tempFilterState = tempFilterState.copy(
                                priceRange = PriceRange(
                                    min = range.start.toDouble(),
                                    max = range.endInclusive.toDouble()
                                )
                            )
                        },
                        valueRange = filterState.priceRange.min.toFloat()..filterState.priceRange.max.toFloat()
                    )
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween
                    ) {
                        Text("₹${tempFilterState.priceRange.min.toInt()}")
                        Text("₹${tempFilterState.priceRange.max.toInt()}")
                    }
                }
                
                // Rating Filter
                Column {
                    Text(
                        text = "Minimum Rating",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        (1..5).forEach { rating ->
                            FilterChip(
                                selected = tempFilterState.minRating >= rating,
                                onClick = {
                                    tempFilterState = tempFilterState.copy(
                                        minRating = if (tempFilterState.minRating == rating.toFloat()) 0f else rating.toFloat()
                                    )
                                },
                                label = {
                                    Row(
                                        horizontalArrangement = Arrangement.spacedBy(4.dp),
                                        verticalAlignment = Alignment.CenterVertically
                                    ) {
                                        Icon(
                                            Icons.Default.Star,
                                            contentDescription = null,
                                            modifier = Modifier.size(16.dp)
                                        )
                                        Text("$rating+")
                                    }
                                }
                            )
                        }
                    }
                }
                
                // Sort Options
                Column {
                    Text(
                        text = "Sort By",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    ProductSortOption.values().forEach { option ->
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            RadioButton(
                                selected = tempFilterState.sortOption == option,
                                onClick = {
                                    tempFilterState = tempFilterState.copy(sortOption = option)
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
                
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    OutlinedButton(
                        onClick = { showFilterSheet = false },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = {
                            onFilterChange(tempFilterState)
                            showFilterSheet = false
                        },
                        modifier = Modifier.weight(1f)
                    ) {
                        Text("Apply Filters")
                    }
                }
            }
        }
    }
} 