package com.example.ibcmserver_init.ui.screens.chat

import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.ArrowBack
import androidx.compose.material.icons.filled.Star
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.chat.ChatRoom
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.components.ErrorMessage

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ChatListScreen(
    viewModel: ChatListViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onChatClick: (String) -> Unit,
    onUserProfileClick: (String) -> Unit,
    onEventClick: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Messages") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            when (uiState) {
                is ChatListUiState.Loading -> {
                    LoadingIndicator()
                }
                is ChatListUiState.Success -> {
                    ChatList(
                        chats = (uiState as ChatListUiState.Success).chats,
                        onChatClick = onChatClick,
                        onUserProfileClick = onUserProfileClick,
                        onEventClick = onEventClick
                    )
                }
                is ChatListUiState.Error -> {
                    ErrorMessage(
                        message = (uiState as ChatListUiState.Error).message,
                        onRetry = viewModel::loadChats
                    )
                }
            }
        }
    }
}

@Composable
private fun ChatList(
    chats: List<ChatRoom>,
    onChatClick: (String) -> Unit,
    onUserProfileClick: (String) -> Unit,
    onEventClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        items(chats) { chat ->
            ChatListItem(
                chat = chat,
                onClick = { onChatClick(chat.id) },
                onUserProfileClick = onUserProfileClick,
                onEventClick = onEventClick
            )
        }
    }
}

@Composable
private fun ChatListItem(
    chat: ChatRoom,
    onClick: () -> Unit,
    onUserProfileClick: (String) -> Unit,
    onEventClick: (String) -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // User profile image
            chat.participants.firstOrNull()?.let { participant ->
                AsyncImage(
                    model = participant.profileImage,
                    contentDescription = null,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape),
                    contentScale = ContentScale.Crop
                )
            }

            Spacer(modifier = Modifier.width(16.dp))

            // Chat info
            Column(
                modifier = Modifier.weight(1f)
            ) {
                // Event title
                Text(
                    text = chat.eventTitle,
                    style = MaterialTheme.typography.titleMedium,
                    modifier = Modifier.clickable { onEventClick(chat.eventId) },
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )

                // Participant info
                chat.participants.firstOrNull()?.let { participant ->
                    Row(
                        modifier = Modifier.clickable { onUserProfileClick(participant.userId) },
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = participant.name,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.onSurfaceVariant
                        )
                        if (participant.role == ParticipantRole.EVENT_CREATOR) {
                            Spacer(modifier = Modifier.width(4.dp))
                            Icon(
                                imageVector = Icons.Default.Star,
                                contentDescription = "Event Creator",
                                modifier = Modifier.size(16.dp),
                                tint = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                }

                // Last message
                chat.lastMessage?.let { message ->
                    Text(
                        text = message.content,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                }
            }

            // Unread count
            if (chat.unreadCount > 0) {
                Spacer(modifier = Modifier.width(8.dp))
                Surface(
                    color = MaterialTheme.colorScheme.primary,
                    shape = CircleShape
                ) {
                    Text(
                        text = chat.unreadCount.toString(),
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onPrimary
                    )
                }
            }
        }
    }
} 