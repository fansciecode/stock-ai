package com.example.ibcmserver_init.ui.screens.search

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.domain.model.SearchResult
import com.example.ibcmserver_init.domain.model.SearchFilter
import com.example.ibcmserver_init.domain.model.SearchSuggestion

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SearchScreen(
    viewModel: SearchViewModel = hiltViewModel(),
    onNavigateToDetail: (String) -> Unit,
    onBackPress: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            SearchTopBar(
                query = uiState.query,
                onQueryChange = viewModel::onQueryChange,
                onSearch = viewModel::search,
                onClearSearch = viewModel::clearSearch,
                onVoiceSearch = viewModel::startVoiceSearch,
                onBackPress = onBackPress
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Filters
            if (uiState.filters.isNotEmpty()) {
                FilterSection(
                    filters = uiState.filters,
                    selectedFilters = uiState.selectedFilters,
                    onFilterToggle = viewModel::toggleFilter
                )
            }

            // Main content
            LazyColumn(
                modifier = Modifier.fillMaxSize(),
                contentPadding = PaddingValues(16.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                // Search Suggestions
                if (uiState.query.isNotEmpty() && uiState.suggestions.isNotEmpty()) {
                    item {
                        SuggestionsSection(
                            suggestions = uiState.suggestions,
                            onSuggestionClick = { suggestion ->
                                viewModel.onQueryChange(suggestion.text)
                                viewModel.search(suggestion.text)
                            }
                        )
                    }
                }

                // Search History
                if (uiState.query.isEmpty() && uiState.searchHistory.isNotEmpty()) {
                    item {
                        SearchHistorySection(
                            history = uiState.searchHistory,
                            onHistoryItemClick = { query ->
                                viewModel.onQueryChange(query)
                                viewModel.search(query)
                            }
                        )
                    }
                }

                // Loading State
                if (uiState.isLoading) {
                    item {
                        LoadingSection()
                    }
                }

                // Error State
                if (uiState.error != null) {
                    item {
                        ErrorSection(
                            error = uiState.error!!,
                            onDismiss = viewModel::clearError
                        )
                    }
                }

                // Results Sections
                if (!uiState.isLoading && uiState.error == null) {
                    // Time-based Results
                    if (uiState.timeBasedResults.isNotEmpty()) {
                        item {
                            ResultSection(
                                title = "Best Time to Book",
                                results = uiState.timeBasedResults,
                                onResultClick = onNavigateToDetail
                            )
                        }
                    }

                    // Location-based Results
                    if (uiState.locationBasedResults.isNotEmpty()) {
                        item {
                            ResultSection(
                                title = "Nearby Options",
                                results = uiState.locationBasedResults,
                                onResultClick = onNavigateToDetail
                            )
                        }
                    }

                    // Price-based Results
                    if (uiState.priceBasedResults.isNotEmpty()) {
                        item {
                            ResultSection(
                                title = "Best Deals",
                                results = uiState.priceBasedResults,
                                onResultClick = onNavigateToDetail
                            )
                        }
                    }

                    // General Results
                    if (uiState.results.isNotEmpty()) {
                        items(uiState.results) { result ->
                            SearchResultCard(
                                result = result,
                                onClick = { onNavigateToDetail(result.id) }
                            )
                        }
                    }
                }
            }
        }

        // Voice Search Dialog
        if (uiState.showVoiceSearch) {
            VoiceSearchDialog(
                isListening = uiState.isVoiceSearchActive,
                onResult = viewModel::processVoiceResult,
                onDismiss = viewModel::cancelVoiceSearch
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchTopBar(
    query: String,
    onQueryChange: (String) -> Unit,
    onSearch: () -> Unit,
    onClearSearch: () -> Unit,
    onVoiceSearch: () -> Unit,
    onBackPress: () -> Unit
) {
    TopAppBar(
        title = {
            TextField(
                value = query,
                onValueChange = onQueryChange,
                modifier = Modifier.fillMaxWidth(),
                placeholder = { Text("Search events, venues...") },
                singleLine = true,
                colors = TextFieldDefaults.textFieldColors(
                    containerColor = MaterialTheme.colorScheme.surface,
                    focusedIndicatorColor = MaterialTheme.colorScheme.primary,
                    unfocusedIndicatorColor = MaterialTheme.colorScheme.onSurface.copy(alpha = 0.12f)
                )
            )
        },
        navigationIcon = {
            IconButton(onClick = onBackPress) {
                Icon(Icons.Default.ArrowBack, "Back")
            }
        },
        actions = {
            if (query.isNotEmpty()) {
                IconButton(onClick = onClearSearch) {
                    Icon(Icons.Default.Clear, "Clear search")
                }
            }
            IconButton(onClick = onVoiceSearch) {
                Icon(Icons.Default.Mic, "Voice search")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun FilterSection(
    filters: List<SearchFilter>,
    selectedFilters: Set<String>,
    onFilterToggle: (String) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
    ) {
        items(filters) { filter ->
            FilterChip(
                selected = selectedFilters.contains(filter.id),
                onClick = { onFilterToggle(filter.id) },
                label = { Text(filter.name) },
                leadingIcon = if (selectedFilters.contains(filter.id)) {
                    { Icon(Icons.Default.Check, null, Modifier.size(FilterChipDefaults.IconSize)) }
                } else null
            )
        }
    }
}

@Composable
private fun ResultSection(
    title: String,
    results: List<SearchResult>,
    onResultClick: (String) -> Unit
) {
    Column(modifier = Modifier.fillMaxWidth()) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(results) { result ->
                SearchResultCard(
                    result = result,
                    onClick = { onResultClick(result.id) },
                    modifier = Modifier.width(280.dp)
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchResultCard(
    result: SearchResult,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = result.title,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = result.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 3,
                overflow = TextOverflow.Ellipsis
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = result.category,
                    style = MaterialTheme.typography.labelMedium
                )
                Text(
                    text = result.price,
                    style = MaterialTheme.typography.labelLarge
                )
            }
        }
    }
}

@Composable
private fun LoadingSection() {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
private fun ErrorSection(
    error: String,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer
            )
            IconButton(onClick = onDismiss) {
                Icon(
                    Icons.Default.Close,
                    contentDescription = "Dismiss",
                    tint = MaterialTheme.colorScheme.onErrorContainer
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun VoiceSearchDialog(
    isListening: Boolean,
    onResult: (String) -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Voice Search") },
        text = {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(
                    imageVector = if (isListening) Icons.Default.Mic else Icons.Default.MicOff,
                    contentDescription = null,
                    modifier = Modifier.size(48.dp),
                    tint = if (isListening) MaterialTheme.colorScheme.primary else MaterialTheme.colorScheme.onSurface
                )
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = if (isListening) "Listening..." else "Tap to speak",
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun SuggestionsSection(
    suggestions: List<SearchSuggestion>,
    onSuggestionClick: (SearchSuggestion) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        suggestions.forEach { suggestion ->
            SuggestionItem(
                suggestion = suggestion,
                onClick = { onSuggestionClick(suggestion) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SuggestionItem(
    suggestion: SearchSuggestion,
    onClick: () -> Unit
) {
    ListItem(
        headlineContent = { Text(suggestion.text) },
        leadingContent = { Icon(Icons.Default.Search, null) },
        modifier = Modifier.clickable(onClick = onClick)
    )
}

@Composable
private fun SearchHistorySection(
    history: List<String>,
    onHistoryItemClick: (String) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxWidth()
    ) {
        Text(
            text = "Recent Searches",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        history.forEach { query ->
            HistoryItem(
                query = query,
                onClick = { onHistoryItemClick(query) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun HistoryItem(
    query: String,
    onClick: () -> Unit
) {
    ListItem(
        headlineContent = { Text(query) },
        leadingContent = { Icon(Icons.Default.History, null) },
        modifier = Modifier.clickable(onClick = onClick)
    )
} 