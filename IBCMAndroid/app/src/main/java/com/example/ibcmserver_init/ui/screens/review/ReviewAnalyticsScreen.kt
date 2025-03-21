package com.example.ibcmserver_init.ui.screens.review

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.review.ReviewStats
import com.example.ibcmserver_init.data.model.review.ReviewStatus

@Composable
fun ReviewAnalyticsScreen(
    productId: String,
    onDismiss: () -> Unit,
    viewModel: ReviewAnalyticsViewModel = hiltViewModel()
) {
    var selectedTimeRange by remember { mutableStateOf(TimeRange.MONTH) }
    
    LaunchedEffect(productId, selectedTimeRange) {
        viewModel.loadAnalytics(productId, selectedTimeRange)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Review Analytics") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Time range selector
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceEvenly
            ) {
                TimeRange.values().forEach { range ->
                    FilterChip(
                        selected = selectedTimeRange == range,
                        onClick = { selectedTimeRange = range },
                        label = { Text(range.label) }
                    )
                }
            }

            when (val state = viewModel.uiState.value) {
                is ReviewAnalyticsUiState.Loading -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        CircularProgressIndicator()
                    }
                }
                is ReviewAnalyticsUiState.Success -> {
                    AnalyticsContent(stats = state.stats)
                }
                is ReviewAnalyticsUiState.Error -> {
                    Text(
                        text = state.message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
        }
    }
}

@Composable
private fun AnalyticsContent(stats: ReviewAnalyticsStats) {
    Column(
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        // Overall rating card
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Overall Rating",
                    style = MaterialTheme.typography.titleMedium
                )
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(4.dp)
                ) {
                    Icon(
                        Icons.Default.Star,
                        contentDescription = null,
                        tint = MaterialTheme.colorScheme.primary
                    )
                    Text(
                        text = String.format("%.1f", stats.averageRating),
                        style = MaterialTheme.typography.headlineMedium
                    )
                }
                Text(
                    text = "${stats.totalReviews} reviews",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
        }

        // Rating distribution
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Rating Distribution",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                stats.ratingDistribution.forEach { (rating, count) ->
                    RatingBar(
                        rating = rating,
                        count = count,
                        total = stats.totalReviews
                    )
                }
            }
        }

        // Review status summary
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Review Status",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                ReviewStatus.values().forEach { status ->
                    StatusRow(
                        status = status,
                        count = stats.statusCounts[status] ?: 0,
                        total = stats.totalReviews
                    )
                }
            }
        }
    }
}

@Composable
private fun RatingBar(
    rating: Int,
    count: Int,
    total: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Text(
            text = "$rating stars",
            modifier = Modifier.width(80.dp)
        )
        LinearProgressIndicator(
            progress = count.toFloat() / total,
            modifier = Modifier
                .weight(1f)
                .height(8.dp)
        )
        Text(
            text = count.toString(),
            modifier = Modifier.padding(start = 8.dp)
        )
    }
}

@Composable
private fun StatusRow(
    status: ReviewStatus,
    count: Int,
    total: Int
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween
    ) {
        Text(text = status.name)
        Text(text = "$count (${(count * 100f / total).toInt()}%)")
    }
}

enum class TimeRange(val label: String) {
    WEEK("Week"),
    MONTH("Month"),
    YEAR("Year")
} 