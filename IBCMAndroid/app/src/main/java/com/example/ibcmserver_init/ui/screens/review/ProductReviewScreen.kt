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
import com.example.ibcmserver_init.data.model.review.ProductReview
import com.example.ibcmserver_init.ui.components.LoadingScreen
import com.example.ibcmserver_init.ui.components.ErrorScreen

@Composable
fun ProductReviewScreen(
    productId: String,
    onDismiss: () -> Unit,
    viewModel: ProductReviewViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showAddReviewDialog by remember { mutableStateOf(false) }
    var showReportDialog by remember { mutableStateOf<ProductReview?>(null) }
    var showResponseDialog by remember { mutableStateOf<ProductReview?>(null) }

    LaunchedEffect(productId) {
        viewModel.loadReviews(productId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Product Reviews") },
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
            is ProductReviewUiState.Loading -> LoadingScreen()
            is ProductReviewUiState.Error -> ErrorScreen(
                message = (uiState as ProductReviewUiState.Error).message,
                onRetry = { viewModel.loadReviews(productId) }
            )
            is ProductReviewUiState.Success -> {
                val reviews = (uiState as ProductReviewUiState.Success).reviews
                val stats = (uiState as ProductReviewUiState.Success).stats

                LazyColumn(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    item {
                        ReviewStats(stats = stats)
                    }

                    items(reviews) { review ->
                        ProductReviewItem(
                            review = review,
                            onReport = { showReportDialog = review },
                            onHelpful = { viewModel.markReviewHelpful(productId, review.id) },
                            onViewResponse = { showResponseDialog = review }
                        )
                    }
                }
            }
        }
    }

    if (showAddReviewDialog) {
        AddProductReviewDialog(
            onDismiss = { showAddReviewDialog = false },
            onSubmit = { rating, title, comment, media ->
                viewModel.submitReview(productId, rating, title, comment, media)
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

    showResponseDialog?.let { review ->
        review.sellerResponse?.let { response ->
            AlertDialog(
                onDismissRequest = { showResponseDialog = null },
                title = { Text("Seller's Response") },
                text = {
                    Column {
                        Text(
                            text = response.comment,
                            style = MaterialTheme.typography.bodyLarge
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Text(
                            text = "Responded on ${response.formattedDate}",
                            style = MaterialTheme.typography.bodySmall
                        )
                    }
                },
                confirmButton = {
                    TextButton(onClick = { showResponseDialog = null }) {
                        Text("Close")
                    }
                }
            )
        }
    }
}

@Composable
private fun ProductReviewItem(
    review: ProductReview,
    onReport: () -> Unit,
    onHelpful: () -> Unit,
    onViewResponse: () -> Unit
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
                if (review.verified) {
                    Row(
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(4.dp)
                    ) {
                        Icon(
                            Icons.Default.Verified,
                            contentDescription = null,
                            tint = MaterialTheme.colorScheme.primary,
                            modifier = Modifier.size(16.dp)
                        )
                        Text(
                            text = "Verified Purchase",
                            style = MaterialTheme.typography.bodySmall,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = review.title,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(4.dp))
            RatingBar(
                rating = review.rating.toFloat(),
                modifier = Modifier.size(24.dp)
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = review.comment,
                style = MaterialTheme.typography.bodyLarge
            )
            if (review.media.isNotEmpty()) {
                Spacer(modifier = Modifier.height(8.dp))
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    items(review.media) { mediaUrl ->
                        AsyncImage(
                            model = mediaUrl,
                            contentDescription = null,
                            modifier = Modifier.size(100.dp)
                        )
                    }
                }
            }
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
                if (review.sellerResponse != null) {
                    TextButton(
                        onClick = onViewResponse,
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
private fun AddProductReviewDialog(
    onDismiss: () -> Unit,
    onSubmit: (Int, String, String, List<String>) -> Unit
) {
    var rating by remember { mutableStateOf(0) }
    var title by remember { mutableStateOf("") }
    var comment by remember { mutableStateOf("") }
    var media by remember { mutableStateOf<List<String>>(emptyList()) }

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
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Review Title") },
                    modifier = Modifier.fillMaxWidth()
                )
                OutlinedTextField(
                    value = comment,
                    onValueChange = { comment = it },
                    label = { Text("Your Review") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3
                )
                // TODO: Add media upload functionality
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSubmit(rating, title, comment, media) },
                enabled = rating > 0 && title.isNotBlank() && comment.isNotBlank()
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