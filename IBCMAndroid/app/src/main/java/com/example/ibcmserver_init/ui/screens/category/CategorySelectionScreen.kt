package com.example.ibcmserver_init.ui.screens.category

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun CategorySelectionScreen(
    onCategoriesSelected: () -> Unit,
    viewModel: CategorySelectionViewModel = hiltViewModel()
) {
    val state by viewModel.state.collectAsState()
    var selectedCategories by remember { mutableStateOf(emptySet<String>()) }
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(state) {
        when (state) {
            is CategorySelectionState.Success -> {
                isLoading = false
                onCategoriesSelected()
            }
            is CategorySelectionState.Error -> {
                isLoading = false
                error = (state as CategorySelectionState.Error).message
            }
            is CategorySelectionState.Loading -> {
                isLoading = true
            }
            else -> {}
        }
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Text(
            text = "Select Your Interests",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 24.dp)
        )

        LazyVerticalGrid(
            columns = GridCells.Fixed(2),
            contentPadding = PaddingValues(8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp),
            modifier = Modifier.weight(1f)
        ) {
            items(viewModel.availableCategories) { category ->
                CategoryItem(
                    category = category,
                    isSelected = selectedCategories.contains(category),
                    onSelect = { isSelected ->
                        selectedCategories = if (isSelected) {
                            selectedCategories + category
                        } else {
                            selectedCategories - category
                        }
                    }
                )
            }
        }

        if (error != null) {
            Text(
                text = error!!,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        Button(
            onClick = { viewModel.saveSelectedCategories(selectedCategories) },
            enabled = selectedCategories.isNotEmpty() && !isLoading,
            modifier = Modifier
                .fillMaxWidth()
                .padding(vertical = 16.dp)
        ) {
            if (isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("Continue")
            }
        }
    }
}

@Composable
private fun CategoryItem(
    category: String,
    isSelected: Boolean,
    onSelect: (Boolean) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .height(80.dp),
        onClick = { onSelect(!isSelected) }
    ) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text(
                text = category,
                style = MaterialTheme.typography.titleMedium
            )
        }
    }
} 