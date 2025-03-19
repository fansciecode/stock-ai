package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.lazy.lazyRow
import androidx.compose.foundation.lazy.lazyVerticalGrid
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.Product
import com.example.ibcmserver_init.data.model.MediaContent
import com.example.ibcmserver_init.data.model.Document
import com.example.ibcmserver_init.ui.components.*
import java.text.SimpleDateFormat
import java.util.*

@Composable
fun EventDetailsScreen(
    eventId: String,
    onNavigateBack: () -> Unit,
    onNavigateToUserProfile: (String) -> Unit,
    viewModel: EventDetailsViewModel = hiltViewModel()
) {
    val event by viewModel.event.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()
    val error by viewModel.error.collectAsState()

    LaunchedEffect(eventId) {
        viewModel.loadEventDetails(eventId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        when {
            isLoading -> {
                LoadingIndicator(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                )
            }
            error != null -> {
                ErrorMessage(
                    message = error!!,
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                )
            }
            event != null -> {
                EventContent(
                    event = event!!,
                    onJoinEvent = { viewModel.joinEvent() },
                    onLeaveEvent = { viewModel.leaveEvent() },
                    onAddReview = { rating, comment ->
                        viewModel.addReview(rating, comment)
                    },
                    onAddComment = { text ->
                        viewModel.addComment(text)
                    },
                    onDeleteComment = { commentId ->
                        viewModel.deleteComment(commentId)
                    },
                    onNavigateToUserProfile = onNavigateToUserProfile,
                    onNavigateToProduct = { productId -> /* Implement navigation to product */ },
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                )
            }
        }
    }
}

@Composable
private fun EventContent(
    event: Event,
    onJoinEvent: () -> Unit,
    onLeaveEvent: () -> Unit,
    onAddReview: (Int, String) -> Unit,
    onAddComment: (String) -> Unit,
    onDeleteComment: (String) -> Unit,
    onNavigateToUserProfile: (String) -> Unit,
    onNavigateToProduct: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var showReviewDialog by remember { mutableStateOf(false) }
    var showCommentDialog by remember { mutableStateOf(false) }
    var rating by remember { mutableStateOf(0) }
    var reviewComment by remember { mutableStateOf("") }
    var commentText by remember { mutableStateOf("") }
    var selectedCategory: String? by remember { mutableStateOf<String?>(null) }

    LazyColumn(
        modifier = modifier,
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = event.title,
                style = MaterialTheme.typography.headlineMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = event.description,
                style = MaterialTheme.typography.bodyLarge
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "Date: ${SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(event.date)}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Time: ${event.time}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = "Location: ${event.location}",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                Button(
                    onClick = {
                        if (event.attendees.contains(event.creatorId)) {
                            onLeaveEvent()
                        } else {
                            onJoinEvent()
                        }
                    }
                ) {
                    Text(
                        text = if (event.attendees.contains(event.creatorId)) "Leave" else "Join"
                    )
                }
            }
        }

        item {
            Text(
                text = "Reviews",
                style = MaterialTheme.typography.titleLarge
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = { showReviewDialog = true }
            ) {
                Text("Add Review")
            }
            Spacer(modifier = Modifier.height(8.dp))
            items(event.reviews) { review ->
                ReviewItem(review = review)
            }
        }

        item {
            Text(
                text = "Comments",
                style = MaterialTheme.typography.titleLarge
            )
            Spacer(modifier = Modifier.height(8.dp))
            Button(
                onClick = { showCommentDialog = true }
            ) {
                Text("Add Comment")
            }
            Spacer(modifier = Modifier.height(8.dp))
            items(event.comments) { comment ->
                CommentItem(
                    comment = comment,
                    onDelete = onDeleteComment
                )
            }
        }

        // Catalog Section
        item {
            Text(
                text = "Product Catalog",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        // Categories
        item {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                contentPadding = PaddingValues(horizontal = 8.dp)
            ) {
                items(event.catalog?.categories ?: emptyList()) { category ->
                    CategoryChip(
                        category = category,
                        selected = selectedCategory == category,
                        onSelected = { selectedCategory = it }
                    )
                }
            }
        }

        // Products Grid
        items(
            items = event.catalog?.products?.filter { 
                selectedCategory == null || it.category == selectedCategory 
            } ?: emptyList(),
            key = { it.id }
        ) { product ->
            ProductCard(
                product = product,
                onClick = { onNavigateToProduct(product.id) }
            )
        }

        // Media Section
        item {
            Text(
                text = "Event Media",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        // Media Grid
        item {
            LazyVerticalGrid(
                columns = GridCells.Fixed(2),
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp),
                modifier = Modifier.height(200.dp)
            ) {
                items(event.media) { media ->
                    MediaItem(media = media)
                }
            }
        }

        // Documents Section
        item {
            Text(
                text = "Event Documents",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(vertical = 8.dp)
            )
        }

        items(event.documents) { document ->
            DocumentItem(document = document)
        }
    }

    if (showReviewDialog) {
        AlertDialog(
            onDismissRequest = { showReviewDialog = false },
            title = { Text("Add Review") },
            text = {
                Column {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.Center
                    ) {
                        repeat(5) { index ->
                            IconButton(
                                onClick = { rating = index + 1 }
                            ) {
                                Icon(
                                    imageVector = Icons.Default.Star,
                                    contentDescription = null,
                                    tint = if (index < rating) {
                                        MaterialTheme.colorScheme.primary
                                    } else {
                                        MaterialTheme.colorScheme.onSurface.copy(alpha = 0.3f)
                                    }
                                )
                            }
                        }
                    }
                    Spacer(modifier = Modifier.height(16.dp))
                    OutlinedTextField(
                        value = reviewComment,
                        onValueChange = { reviewComment = it },
                        label = { Text("Comment") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (rating > 0 && reviewComment.isNotBlank()) {
                            onAddReview(rating, reviewComment)
                            showReviewDialog = false
                            rating = 0
                            reviewComment = ""
                        }
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showReviewDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showCommentDialog) {
        AlertDialog(
            onDismissRequest = { showCommentDialog = false },
            title = { Text("Add Comment") },
            text = {
                OutlinedTextField(
                    value = commentText,
                    onValueChange = { commentText = it },
                    label = { Text("Comment") },
                    modifier = Modifier.fillMaxWidth()
                )
            },
            confirmButton = {
                TextButton(
                    onClick = {
                        if (commentText.isNotBlank()) {
                            onAddComment(commentText)
                            showCommentDialog = false
                            commentText = ""
                        }
                    }
                ) {
                    Text("Submit")
                }
            },
            dismissButton = {
                TextButton(onClick = { showCommentDialog = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

@Composable
private fun CategoryChip(
    category: String,
    selected: Boolean,
    onSelected: (String) -> Unit
) {
    FilterChip(
        selected = selected,
        onClick = { onSelected(category) },
        label = { Text(category) },
        modifier = Modifier.padding(end = 8.dp)
    )
}

@Composable
private fun ProductCard(
    product: Product,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                if (product.images.isNotEmpty()) {
                    AsyncImage(
                        model = product.images[0],
                        contentDescription = product.name,
                        modifier = Modifier
                            .size(60.dp)
                            .clip(MaterialTheme.shapes.small),
                        contentScale = ContentScale.Crop
                    )
                }
                Column {
                    Text(
                        text = product.name,
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "$${product.price}",
                        style = MaterialTheme.typography.bodyMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                }
            }
            IconButton(onClick = onClick) {
                Icon(
                    imageVector = Icons.Default.ChevronRight,
                    contentDescription = "View details"
                )
            }
        }
    }
}

@Composable
private fun MediaItem(
    media: MediaContent
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .aspectRatio(1f),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        AsyncImage(
            model = media.url,
            contentDescription = media.description,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
    }
}

@Composable
private fun DocumentItem(
    document: Document
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        elevation = CardDefaults.cardElevation(defaultElevation = 1.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = when (document.type) {
                        "pdf" -> Icons.Default.PictureAsPdf
                        "doc" -> Icons.Default.Description
                        else -> Icons.Default.InsertDriveFile
                    },
                    contentDescription = document.type,
                    tint = MaterialTheme.colorScheme.primary
                )
                Column {
                    Text(
                        text = document.name,
                        style = MaterialTheme.typography.bodyMedium
                    )
                    Text(
                        text = document.type.uppercase(),
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
            IconButton(onClick = { /* Download document */ }) {
                Icon(
                    imageVector = Icons.Default.Download,
                    contentDescription = "Download"
                )
            }
        }
    }
} 