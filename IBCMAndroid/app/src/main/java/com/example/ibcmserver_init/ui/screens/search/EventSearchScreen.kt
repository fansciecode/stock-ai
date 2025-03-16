package com.example.ibcmserver_init.ui.screens.search

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.ui.navigation.Screen
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventSearchScreen(
    navController: NavController,
    viewModel: EventSearchViewModel = hiltViewModel()
) {
    var showFilters by remember { mutableStateOf(false) }
    var showDatePicker by remember { mutableStateOf(false) }
    val searchResults by viewModel.searchResults.collectAsState()

    Scaffold(
        topBar = {
            SearchTopBar(
                searchQuery = viewModel.searchQuery,
                onSearchQueryChange = { viewModel.updateSearchQuery(it) },
                onFilterClick = { showFilters = true }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            if (viewModel.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(searchResults) { event ->
                        EventCard(
                            event = event,
                            onClick = {
                                navController.navigate(Screen.EventDetails.createRoute(event.id))
                            }
                        )
                    }
                }
            }

            // Error Handling
            viewModel.error?.let { error ->
                AlertDialog(
                    onDismissRequest = { viewModel.clearError() },
                    title = { Text("Error") },
                    text = { Text(error) },
                    confirmButton = {
                        TextButton(onClick = { viewModel.clearError() }) {
                            Text("OK")
                        }
                    }
                )
            }
        }
    }

    // Filters Bottom Sheet
    if (showFilters) {
        FilterBottomSheet(
            selectedCategory = viewModel.selectedCategory,
            onCategorySelected = { viewModel.updateCategory(it) },
            selectedDate = viewModel.selectedDate,
            onDateSelected = { viewModel.updateDate(it) },
            radius = viewModel.radius,
            onRadiusChanged = { viewModel.updateRadius(it) },
            availableCategories = viewModel.availableCategories,
            onDismiss = { showFilters = false },
            onClearFilters = {
                viewModel.clearFilters()
                showFilters = false
            }
        )
    }

    // Date Picker Dialog
    if (showDatePicker) {
        DatePickerDialog(
            onDismissRequest = { showDatePicker = false },
            onDateSelected = { date ->
                viewModel.updateDate(date)
                showDatePicker = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchTopBar(
    searchQuery: String,
    onSearchQueryChange: (String) -> Unit,
    onFilterClick: () -> Unit
) {
    TopAppBar(
        title = {
            OutlinedTextField(
                value = searchQuery,
                onValueChange = onSearchQueryChange,
                placeholder = { Text("Search events...") },
                singleLine = true,
                modifier = Modifier.fillMaxWidth()
            )
        },
        actions = {
            IconButton(onClick = onFilterClick) {
                Icon(Icons.Default.FilterList, contentDescription = "Filters")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterBottomSheet(
    selectedCategory: String?,
    onCategorySelected: (String?) -> Unit,
    selectedDate: Date?,
    onDateSelected: (Date?) -> Unit,
    radius: Double,
    onRadiusChanged: (Double) -> Unit,
    availableCategories: List<String>,
    onDismiss: () -> Unit,
    onClearFilters: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Text(
                text = "Filters",
                style = MaterialTheme.typography.titleLarge
            )

            // Category Filter
            Text(
                text = "Category",
                style = MaterialTheme.typography.titleMedium
            )
            LazyColumn(
                modifier = Modifier.height(200.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(availableCategories) { category ->
                    FilterChip(
                        selected = category == selectedCategory,
                        onClick = { onCategorySelected(if (category == selectedCategory) null else category) },
                        label = { Text(category) }
                    )
                }
            }

            // Date Filter
            Text(
                text = "Date",
                style = MaterialTheme.typography.titleMedium
            )
            FilterChip(
                selected = selectedDate != null,
                onClick = { onDateSelected(if (selectedDate != null) null else Date()) },
                label = {
                    Text(
                        selectedDate?.let {
                            SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(it)
                        } ?: "Any date"
                    )
                }
            )

            // Radius Slider
            Text(
                text = "Search Radius: ${radius.toInt()}km",
                style = MaterialTheme.typography.titleMedium
            )
            Slider(
                value = radius.toFloat(),
                onValueChange = { onRadiusChanged(it.toDouble()) },
                valueRange = 1f..50f,
                steps = 49
            )

            // Clear Filters Button
            TextButton(
                onClick = onClearFilters,
                modifier = Modifier.align(Alignment.End)
            ) {
                Text("Clear Filters")
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EventCard(
    event: Event,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = event.title,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = event.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = event.category,
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(event.date),
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun DatePickerDialog(
    onDismissRequest: () -> Unit,
    onDateSelected: (Date) -> Unit
) {
    // TODO: Implement Material3 DatePicker
    // For now, this is a placeholder
    AlertDialog(
        onDismissRequest = onDismissRequest,
        title = { Text("Select Date") },
        confirmButton = {
            TextButton(onClick = { onDateSelected(Date()) }) {
                Text("OK")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismissRequest) {
                Text("Cancel")
            }
        }
    )
} 