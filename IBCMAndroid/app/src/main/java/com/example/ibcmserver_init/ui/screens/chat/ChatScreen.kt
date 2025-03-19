package com.example.ibcmserver_init.ui.screens.chat

import androidx.compose.foundation.clickable
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
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.chat.ChatMessage
import com.example.ibcmserver_init.data.model.chat.ChatParticipant
import com.example.ibcmserver_init.data.model.chat.ChatRoom
import com.example.ibcmserver_init.data.model.chat.ReportType
import com.example.ibcmserver_init.ui.components.LoadingScreen
import com.example.ibcmserver_init.ui.components.ErrorScreen
import com.example.ibcmserver_init.ui.screens.report.ReportScreen

@Composable
fun ChatScreen(
    chatId: String,
    navController: NavController,
    viewModel: ChatViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()
    var showReportDialog by remember { mutableStateOf(false) }
    var showGroupInfo by remember { mutableStateOf(false) }
    var showParticipantMenu by remember { mutableStateOf<ChatParticipant?>(null) }

    LaunchedEffect(chatId) {
        viewModel.loadChat(chatId)
    }

    when (uiState) {
        is ChatUiState.Loading -> LoadingScreen()
        is ChatUiState.Error -> ErrorScreen(
            message = (uiState as ChatUiState.Error).message,
            onRetry = { viewModel.loadChat(chatId) }
        )
        is ChatUiState.Success -> {
            val chat = (uiState as ChatUiState.Success).chat
            val messages = (uiState as ChatUiState.Success).messages
            val currentUser = (uiState as ChatUiState.Success).currentUser

            Scaffold(
                topBar = {
                    TopAppBar(
                        title = {
                            if (chat.isGroupChat) {
                                Row(
                                    verticalAlignment = Alignment.CenterVertically,
                                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                                ) {
                                    chat.groupImage?.let { imageUrl ->
                                        AsyncImage(
                                            model = imageUrl,
                                            contentDescription = null,
                                            modifier = Modifier.size(32.dp)
                                        )
                                    }
                                    Text(chat.name ?: "Group Chat")
                                }
                            } else {
                                chat.participants.firstOrNull { it.userId != currentUser.id }?.let { participant ->
                                    Row(
                                        verticalAlignment = Alignment.CenterVertically,
                                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                                    ) {
                                        participant.profileImage?.let { imageUrl ->
                                            AsyncImage(
                                                model = imageUrl,
                                                contentDescription = null,
                                                modifier = Modifier.size(32.dp)
                                            )
                                        }
                                        Text(participant.name)
                                    }
                                }
                            }
                        },
                        actions = {
                            if (chat.isGroupChat) {
                                IconButton(onClick = { showGroupInfo = true }) {
                                    Icon(Icons.Default.Group, contentDescription = "Group Info")
                                }
                            }
                            IconButton(onClick = { showReportDialog = true }) {
                                Icon(Icons.Default.Report, contentDescription = "Report")
                            }
                        }
                    )
                }
            ) { padding ->
                Column(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding)
                ) {
                    LazyColumn(
                        modifier = Modifier
                            .weight(1f)
                            .fillMaxWidth(),
                        reverseLayout = true
                    ) {
                        items(messages) { message ->
                            ChatMessageItem(
                                message = message,
                                isCurrentUser = message.senderId == currentUser.id,
                                onLongPress = { showParticipantMenu = chat.participants.find { it.userId == message.senderId } }
                            )
                        }
                    }

                    ChatInput(
                        onSendMessage = { content ->
                            viewModel.sendMessage(chatId, content)
                        }
                    )
                }
            }

            if (showReportDialog) {
                ReportScreen(
                    reportedId = chatId,
                    reportType = ReportType.MESSAGE,
                    onReportSubmitted = { showReportDialog = false },
                    onDismiss = { showReportDialog = false }
                )
            }

            if (showGroupInfo) {
                GroupInfoDialog(
                    chat = chat,
                    currentUser = currentUser,
                    onDismiss = { showGroupInfo = false },
                    onParticipantClick = { participant ->
                        showGroupInfo = false
                        showParticipantMenu = participant
                    }
                )
            }

            showParticipantMenu?.let { participant ->
                ParticipantMenuDialog(
                    participant = participant,
                    isCurrentUserAdmin = chat.groupAdminIds.contains(currentUser.id),
                    onDismiss = { showParticipantMenu = null },
                    onReport = {
                        showParticipantMenu = null
                        showReportDialog = true
                    },
                    onMakeAdmin = {
                        viewModel.updateParticipantRole(chatId, participant.userId, "admin")
                        showParticipantMenu = null
                    },
                    onRemoveFromGroup = {
                        viewModel.removeFromGroup(chatId, participant.userId)
                        showParticipantMenu = null
                    }
                )
            }
        }
    }
}

@Composable
private fun ChatMessageItem(
    message: ChatMessage,
    isCurrentUser: Boolean,
    onLongPress: () -> Unit
) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 8.dp, vertical = 4.dp),
        contentAlignment = if (isCurrentUser) Alignment.CenterEnd else Alignment.CenterStart
    ) {
        Surface(
            modifier = Modifier.widthIn(max = 300.dp),
            shape = MaterialTheme.shapes.medium,
            color = if (isCurrentUser) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            },
            onClick = onLongPress
        ) {
            Text(
                text = message.content,
                modifier = Modifier.padding(12.dp),
                color = if (isCurrentUser) {
                    MaterialTheme.colorScheme.onPrimary
                } else {
                    MaterialTheme.colorScheme.onSurfaceVariant
                }
            )
        }
    }
}

@Composable
private fun ChatInput(
    onSendMessage: (String) -> Unit
) {
    var message by remember { mutableStateOf("") }

    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        OutlinedTextField(
            value = message,
            onValueChange = { message = it },
            modifier = Modifier.weight(1f),
            placeholder = { Text("Type a message...") },
            maxLines = 4
        )
        Spacer(modifier = Modifier.width(8.dp))
        IconButton(
            onClick = {
                if (message.isNotBlank()) {
                    onSendMessage(message)
                    message = ""
                }
            },
            enabled = message.isNotBlank()
        ) {
            Icon(Icons.Default.Send, contentDescription = "Send")
        }
    }
}

@Composable
private fun GroupInfoDialog(
    chat: ChatRoom,
    currentUser: ChatParticipant,
    onDismiss: () -> Unit,
    onParticipantClick: (ChatParticipant) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Group Info") },
        text = {
            Column {
                chat.groupImage?.let { imageUrl ->
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "Participants (${chat.participants.size})",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                LazyColumn {
                    items(chat.participants) { participant ->
                        ParticipantItem(
                            participant = participant,
                            onClick = { onParticipantClick(participant) }
                        )
                    }
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun ParticipantItem(
    participant: ChatParticipant,
    onClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick)
            .padding(8.dp),
        verticalAlignment = Alignment.CenterVertically,
        horizontalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        participant.profileImage?.let { imageUrl ->
            AsyncImage(
                model = imageUrl,
                contentDescription = null,
                modifier = Modifier.size(40.dp)
            )
        }
        Column {
            Text(
                text = participant.name,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = "${participant.followersCount} followers",
                style = MaterialTheme.typography.bodySmall
            )
        }
    }
}

@Composable
private fun ParticipantMenuDialog(
    participant: ChatParticipant,
    isCurrentUserAdmin: Boolean,
    onDismiss: () -> Unit,
    onReport: () -> Unit,
    onMakeAdmin: () -> Unit,
    onRemoveFromGroup: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(participant.name) },
        text = {
            Column {
                participant.profileImage?.let { imageUrl ->
                    AsyncImage(
                        model = imageUrl,
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxWidth()
                            .height(200.dp)
                    )
                }
                Spacer(modifier = Modifier.height(16.dp))
                Text(
                    text = "${participant.followersCount} followers",
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = "${participant.followingCount} following",
                    style = MaterialTheme.typography.bodyLarge
                )
            }
        },
        confirmButton = {
            Column {
                TextButton(onClick = onReport) {
                    Text("Report User")
                }
                if (isCurrentUserAdmin) {
                    TextButton(onClick = onMakeAdmin) {
                        Text("Make Admin")
                    }
                    TextButton(onClick = onRemoveFromGroup) {
                        Text("Remove from Group")
                    }
                }
                TextButton(onClick = onDismiss) {
                    Text("Close")
                }
            }
        }
    )
}