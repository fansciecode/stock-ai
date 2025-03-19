package com.example.ibcmserver_init.ui.screens.analytics

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.components.ErrorMessage

@Composable
fun AnalyticsScreen(
    viewModel: AnalyticsViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Analytics") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = androidx.compose.material.icons.Icons.Default.ArrowBack,
                            contentDescription = "Navigate back"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            when (uiState) {
                is AnalyticsUiState.Initial -> {
                    AnalyticsContent()
                }
                is AnalyticsUiState.Loading -> {
                    LoadingIndicator()
                }
                is AnalyticsUiState.Success -> {
                    AnalyticsContent()
                }
                is AnalyticsUiState.Error -> {
                    ErrorMessage(
                        message = (uiState as AnalyticsUiState.Error).message,
                        onRetry = { /* Implement retry logic */ }
                    )
                }
            }
        }
    }
}

@Composable
private fun AnalyticsContent() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Analytics Overview Card
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Analytics Overview",
                    style = MaterialTheme.typography.titleLarge
                )
                Text(
                    text = "Track user engagement and behavior patterns",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }

        // Event Analytics Section
        AnalyticsSection(
            title = "Event Analytics",
            description = "Track event views and interactions"
        )

        // User Behavior Section
        AnalyticsSection(
            title = "User Behavior",
            description = "Monitor user interests and preferences"
        )

        // Content Analytics Section
        AnalyticsSection(
            title = "Content Analytics",
            description = "Track content views and engagement"
        )

        // Voice Analytics Section
        AnalyticsSection(
            title = "Voice Analytics",
            description = "Monitor voice command usage"
        )
    }
}

@Composable
private fun AnalyticsSection(
    title: String,
    description: String
) {
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
                text = title,
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = { /* Implement analytics action */ },
                modifier = Modifier.align(Alignment.End)
            ) {
                Text("View Details")
            }
        }
    }
} 