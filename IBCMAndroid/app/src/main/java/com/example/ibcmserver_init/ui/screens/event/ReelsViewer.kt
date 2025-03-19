package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.gestures.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.pager.VerticalPager
import androidx.compose.foundation.pager.rememberPagerState
import androidx.compose.foundation.shape.CircleShape
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.compose.ui.viewinterop.AndroidView
import androidx.media3.common.MediaItem
import androidx.media3.common.Player
import androidx.media3.exoplayer.ExoPlayer
import androidx.media3.ui.PlayerView
import kotlinx.coroutines.delay
import kotlinx.coroutines.launch
import coil.compose.AsyncImage

data class ReelData(
    val id: String,
    val videoUrl: String,
    val thumbnailUrl: String,
    val description: String,
    val likes: Int,
    val comments: List<ReelComment>,
    val user: String,
    val userAvatar: String,
    val isLiked: Boolean = false,
    val isSaved: Boolean = false
)

data class ReelComment(
    val id: String,
    val user: String,
    val userAvatar: String,
    val comment: String,
    val timestamp: String
)

@Composable
fun ReelsViewer(
    reels: List<ReelData>,
    onClose: () -> Unit,
    onLike: (ReelData) -> Unit,
    onComment: (ReelData) -> Unit,
    onShare: (ReelData) -> Unit,
    onSave: (ReelData) -> Unit,
    modifier: Modifier = Modifier
) {
    val pagerState = rememberPagerState { reels.size }
    var showComments by remember { mutableStateOf(false) }
    var currentReel by remember { mutableStateOf<ReelData?>(null) }
    val scope = rememberCoroutineScope()
    
    Box(
        modifier = modifier
            .fillMaxSize()
            .background(Color.Black)
    ) {
        VerticalPager(
            state = pagerState,
            modifier = Modifier.fillMaxSize()
        ) { page ->
            val reel = reels[page]
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                // Video Player
                ReelPlayer(
                    videoUrl = reel.videoUrl,
                    thumbnailUrl = reel.thumbnailUrl,
                    onVideoTap = { /* Toggle play/pause */ }
                )

                // Overlay controls
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(16.dp)
                ) {
                    // Top section
                    Row(
                        modifier = Modifier
                            .align(Alignment.TopStart)
                            .fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        // User info
                        Row(
                            verticalAlignment = Alignment.CenterVertically,
                            modifier = Modifier.weight(1f)
                        ) {
                            AsyncImage(
                                model = reel.userAvatar,
                                contentDescription = null,
                                modifier = Modifier
                                    .size(40.dp)
                                    .clip(CircleShape),
                                contentScale = ContentScale.Crop
                            )
                            Spacer(modifier = Modifier.width(8.dp))
                            Text(
                                text = reel.user,
                                color = Color.White,
                                style = MaterialTheme.typography.titleMedium
                            )
                        }

                        // Close button
                        IconButton(onClick = onClose) {
                            Icon(
                                Icons.Default.Close,
                                contentDescription = "Close",
                                tint = Color.White
                            )
                        }
                    }

                    // Right side actions
                    Column(
                        modifier = Modifier
                            .align(Alignment.CenterEnd)
                            .padding(end = 16.dp),
                        horizontalAlignment = Alignment.CenterHorizontally,
                        verticalArrangement = Arrangement.spacedBy(24.dp)
                    ) {
                        // Like button
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            IconButton(
                                onClick = { onLike(reel) }
                            ) {
                                Icon(
                                    if (reel.isLiked) Icons.Default.Favorite
                                    else Icons.Default.FavoriteBorder,
                                    contentDescription = "Like",
                                    tint = if (reel.isLiked) Color.Red else Color.White,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                            Text(
                                text = "${reel.likes}",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }

                        // Comment button
                        Column(
                            horizontalAlignment = Alignment.CenterHorizontally
                        ) {
                            IconButton(
                                onClick = { 
                                    currentReel = reel
                                    showComments = true 
                                }
                            ) {
                                Icon(
                                    Icons.Default.Comment,
                                    contentDescription = "Comment",
                                    tint = Color.White,
                                    modifier = Modifier.size(28.dp)
                                )
                            }
                            Text(
                                text = "${reel.comments.size}",
                                color = Color.White,
                                style = MaterialTheme.typography.labelMedium
                            )
                        }

                        // Share button
                        IconButton(
                            onClick = { onShare(reel) }
                        ) {
                            Icon(
                                Icons.Default.Share,
                                contentDescription = "Share",
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }

                        // Save button
                        IconButton(
                            onClick = { onSave(reel) }
                        ) {
                            Icon(
                                if (reel.isSaved) Icons.Default.Bookmark
                                else Icons.Default.BookmarkBorder,
                                contentDescription = "Save",
                                tint = Color.White,
                                modifier = Modifier.size(28.dp)
                            )
                        }
                    }

                    // Bottom section
                    Column(
                        modifier = Modifier
                            .align(Alignment.BottomStart)
                            .fillMaxWidth()
                            .padding(bottom = 24.dp)
                    ) {
                        Text(
                            text = reel.description,
                            color = Color.White,
                            style = MaterialTheme.typography.bodyMedium
                        )
                    }
                }
            }
        }
    }

    // Comments bottom sheet
    if (showComments && currentReel != null) {
        ModalBottomSheet(
            onDismissRequest = { showComments = false },
            containerColor = MaterialTheme.colorScheme.surface,
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            Column(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp)
            ) {
                Text(
                    text = "Comments",
                    style = MaterialTheme.typography.titleLarge,
                    fontWeight = FontWeight.Bold
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Column(
                    modifier = Modifier
                        .weight(1f)
                        .verticalScroll(rememberScrollState())
                ) {
                    currentReel?.comments?.forEach { comment ->
                        CommentItem(comment)
                        Spacer(modifier = Modifier.height(16.dp))
                    }
                }
                
                // Comment input
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextField(
                        value = "",
                        onValueChange = { /* TODO: Handle comment input */ },
                        placeholder = { Text("Add a comment...") },
                        modifier = Modifier.weight(1f),
                        colors = TextFieldDefaults.colors(
                            unfocusedContainerColor = MaterialTheme.colorScheme.surfaceVariant,
                            focusedContainerColor = MaterialTheme.colorScheme.surfaceVariant
                        )
                    )
                    IconButton(
                        onClick = { 
                            /* TODO: Handle comment submission */
                            showComments = false
                        }
                    ) {
                        Icon(Icons.Default.Send, contentDescription = "Send")
                    }
                }
            }
        }
    }
}

@Composable
private fun CommentItem(comment: ReelComment) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        AsyncImage(
            model = comment.userAvatar,
            contentDescription = null,
            modifier = Modifier
                .size(32.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )
        Column {
            Text(
                text = comment.user,
                style = MaterialTheme.typography.titleSmall,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = comment.comment,
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = comment.timestamp,
                style = MaterialTheme.typography.labelSmall,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun ReelPlayer(
    videoUrl: String,
    thumbnailUrl: String,
    onVideoTap: () -> Unit
) {
    val context = LocalContext.current
    var player by remember { mutableStateOf<ExoPlayer?>(null) }
    
    DisposableEffect(context) {
        player = ExoPlayer.Builder(context).build().apply {
            setMediaItem(MediaItem.fromUri(videoUrl))
            repeatMode = Player.REPEAT_MODE_ONE
            playWhenReady = true
            prepare()
        }
        
        onDispose {
            player?.release()
        }
    }
    
    Box(
        modifier = Modifier
            .fillMaxSize()
            .clickable(onClick = onVideoTap)
    ) {
        player?.let { exoPlayer ->
            AndroidView(
                factory = { ctx ->
                    PlayerView(ctx).apply {
                        this.player = exoPlayer
                        useController = false
                    }
                },
                modifier = Modifier.fillMaxSize()
            )
        }
    }
} 