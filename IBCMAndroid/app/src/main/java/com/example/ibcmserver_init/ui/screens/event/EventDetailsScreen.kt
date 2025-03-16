package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
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
    modifier: Modifier = Modifier
) {
    var showReviewDialog by remember { mutableStateOf(false) }
    var showCommentDialog by remember { mutableStateOf(false) }
    var rating by remember { mutableStateOf(0) }
    var reviewComment by remember { mutableStateOf("") }
    var commentText by remember { mutableStateOf("") }

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