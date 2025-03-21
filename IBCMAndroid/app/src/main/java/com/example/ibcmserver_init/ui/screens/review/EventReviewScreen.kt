package com.example.ibcmserver_init.ui.screens.review

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
import androidx.lifecycle.compose.collectAsState
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.review.EventReview
import com.example.ibcmserver_init.ui.components.LoadingScreen
import com.example.ibcmserver_init.ui.components.ErrorScreen

@Composable
fun EventReviewScreen(
    eventId: String,
    onDismiss: () -> Unit,
    viewModel: EventReviewViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddReviewDialog by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf<EventReview?>(null) }

    LaunchedEffect(eventId) {
        viewModel.loadReviews(eventId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Reviews") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                },
                actions = {
                    IconButton(onClick = { showAddReviewDialog = true }) {
                        Icon(Icons.Default.Add, contentDescription = "Add Review")
                    }
                }
            )
        }
    ) { padding ->
        when (uiState) {
            is EventReviewUiState.Loading -> LoadingScreen()
            is EventReviewUiState.Error -> ErrorScreen(
                message = (uiState as EventReviewUiState.Error).message,
                onRetry = { viewModel.loadReviews(eventId) }
            )
            is EventReviewUiState.Success -> {
                val reviews = (uiState as EventReviewUiState.Success).reviews
                val stats = (uiState as EventReviewUiState.Success).stats

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    item {
                        ReviewStats(stats = stats)
                    }

                    items(reviews) { review ->
                        ReviewItem(
                            review = review,
                            onReport = { showReportDialog = review },
                            onHelpful = { viewModel.markReviewHelpful(eventId, review.id) }
                        )
                    }
                }
            }
        }
    }

    if (showAddReviewDialog) {
        AddReviewDialog(
            onDismiss = { showAddReviewDialog = false },
            onSubmit = { rating, comment ->
                viewModel.submitReview(eventId, rating, comment)
                showAddReviewDialog = false
            }
        )
    }

    showReportDialog?.let { review ->
        ReportScreen(
            reportedId = review.id,
            reportType = ReportType.REVIEW,
            onReportSubmitted = { showReportDialog = null },
            onDismiss = { showReportDialog = null }
        )
    }
}

@Composable
private fun ReviewStats(stats: ReviewStats) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Row(
                verticalAlignment = Alignment.CenterVertically,
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = String.format("%.1f", stats.averageRating),
                    style = MaterialTheme.typography.displayLarge
                )
                Column {
                    RatingBar(
                        rating = stats.averageRating,
                        modifier = Modifier.size(24.dp)
                    )
                    Text(
                        text = "${stats.totalReviews} reviews",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
            Spacer(modifier = Modifier.height(16.dp))
            RatingDistribution(stats.ratingDistribution)
        }
    }
}

@Composable
private fun RatingDistribution(distribution: Map<Int, Int>) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        distribution.entries.sortedByDescending { it.key }.forEach { (rating, count) ->
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "$rating",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.width(24.dp)
                )
                LinearProgressIndicator(
                    progress = count.toFloat() / distribution.values.maxOrNull()!!,
                    modifier = Modifier.weight(1f)
                )
                Text(
                    text = "$count",
                    style = MaterialTheme.typography.bodyMedium,
                    modifier = Modifier.width(32.dp)
                )
            }
        }
    }
}

@Composable
private fun ReviewItem(
    review: EventReview,
    onReport: () -> Unit,
    onHelpful: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 8.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Row(
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    review.userAvatar?.let { avatarUrl ->
                        AsyncImage(
                            model = avatarUrl,
                            contentDescription = null,
                            modifier = Modifier.size(40.dp)
                        )
                    }
                    Column {
                        Text(
                            text = review.userName,
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text(
                            text = review.formattedDate,
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                }
                RatingBar(
                    rating = review.rating.toFloat(),
                    modifier = Modifier.size(24.dp)
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = review.comment,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Row(
                    horizontalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    TextButton(
                        onClick = onHelpful,
                        leadingIcon = { Icon(Icons.Default.ThumbUp, null) }
                    ) {
                        Text("${review.helpfulCount} Helpful")
                    }
                    TextButton(
                        onClick = onReport,
                        leadingIcon = { Icon(Icons.Default.Report, null) }
                    ) {
                        Text("Report")
                    }
                }
                if (review.response != null) {
                    TextButton(
                        onClick = { /* Show response */ },
                        leadingIcon = { Icon(Icons.Default.Reply, null) }
                    ) {
                        Text("View Response")
                    }
                }
            }
        }
    }
}

@Composable
private fun AddReviewDialog(
    onDismiss: () -> Unit,
    onSubmit: (Int, String) -> Unit
) {
    var rating by remember { mutableStateOf(0) }
    var comment by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Review") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                RatingBar(
                    rating = rating.toFloat(),
                    onRatingChanged = { rating = it.toInt() },
                    modifier = Modifier.size(32.dp)
                )
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Your Review") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSubmit(rating, comment) },
                enabled = rating > 0 && comment.isNotBlank()
            ) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun RatingBar(
    rating: Float,
    onRatingChanged: ((Float) -> Unit)? = null,
    modifier: Modifier = Modifier
) {
    Row(
        modifier = modifier,
        horizontalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        repeat(5) { index ->
            IconButton(
                onClick = { onRatingChanged?.invoke(index + 1f) },
                enabled = onRatingChanged != null
            ) {
                Icon(
                    if (index < rating) Icons.Default.Star else Icons.Default.StarBorder,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
} 