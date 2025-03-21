package com.example.ibcmserver_init.ui.screens.notifications

import androidx.compose.animation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
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
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationScreen(
    viewModel: NotificationViewModel = hiltViewModel(),
    onNavigateToSettings: () -> Unit,
    onBackPress: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    Text(
                        "Notifications",
                        style = MaterialTheme.typography.titleLarge
                    )
                },
                navigationIcon = {
                    IconButton(onClick = onBackPress) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    IconButton(onClick = viewModel::showPreferences) {
                        Icon(Icons.Default.Settings, "Settings")
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
            when {
                uiState.isLoading -> {
                    LoadingState()
                }
                uiState.error != null -> {
                    ErrorState(
                        error = uiState.error!!,
                        onDismiss = viewModel::clearError
                    )
                }
                uiState.notifications.isEmpty() -> {
                    EmptyState()
                }
                else -> {
                    NotificationContent(
                        uiState = uiState,
                        onNotificationClick = viewModel::markAsRead,
                        onDeleteNotification = viewModel::deleteNotification,
                        onTypeSelect = viewModel::selectType
                    )
                }
            }

            // Preferences Sheet
            if (uiState.showPreferences) {
                NotificationPreferencesSheet(
                    preferences = uiState.preferences,
                    onDismiss = viewModel::hidePreferences,
                    onUpdatePreferences = viewModel::updatePreferences
                )
            }
        }
    }
}

@Composable
private fun NotificationContent(
    uiState: NotificationUiState,
    onNotificationClick: (String) -> Unit,
    onDeleteNotification: (String) -> Unit,
    onTypeSelect: (NotificationType?) -> Unit
) {
    Column(
        modifier = Modifier.fillMaxSize()
    ) {
        // Filter chips for notification types
        NotificationTypeFilters(
            selectedType = uiState.selectedType,
            groups = uiState.groups,
            onTypeSelect = onTypeSelect
        )

        // Notifications list
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            val notifications = if (uiState.selectedType != null) {
                uiState.notifications.filter { it.type == uiState.selectedType }
            } else {
                uiState.notifications
            }

            items(
                items = notifications,
                key = { it.id }
            ) { notification ->
                NotificationItem(
                    notification = notification,
                    onClick = { onNotificationClick(notification.id) },
                    onDelete = { onDeleteNotification(notification.id) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationTypeFilters(
    selectedType: NotificationType?,
    groups: Map<NotificationType, NotificationGroup>,
    onTypeSelect: (NotificationType?) -> Unit
) {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(8.dp),
        contentPadding = PaddingValues(horizontal = 16.dp, vertical = 8.dp)
    ) {
        item {
            FilterChip(
                selected = selectedType == null,
                onClick = { onTypeSelect(null) },
                label = { Text("All") },
                leadingIcon = if (selectedType == null) {
                    { Icon(Icons.Default.Check, null) }
                } else null
            )
        }

        items(NotificationType.values()) { type ->
            val group = groups[type]
            if (group != null && group.notifications.isNotEmpty()) {
                FilterChip(
                    selected = type == selectedType,
                    onClick = { onTypeSelect(type) },
                    label = {
                        Text(type.name.lowercase().capitalize())
                    },
                    leadingIcon = if (type == selectedType) {
                        { Icon(Icons.Default.Check, null) }
                    } else null,
                    trailingIcon = if (group.unreadCount > 0) {
                        {
                            Badge { Text(group.unreadCount.toString()) }
                        }
                    } else null
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationItem(
    notification: Notification,
    onClick: () -> Unit,
    onDelete: () -> Unit
) {
    val formatter = remember { SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault()) }

    SwipeToDismiss(
        state = rememberDismissState(
            confirmValueChange = {
                if (it == DismissValue.DismissedToStart) {
                    onDelete()
                    true
                } else false
            }
        ),
        background = {
            DismissBackground()
        },
        dismissContent = {
            Card(
                onClick = onClick,
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text(
                            text = notification.title,
                            style = MaterialTheme.typography.titleMedium,
                            maxLines = 1,
                            overflow = TextOverflow.Ellipsis
                        )
                        if (!notification.isRead) {
                            Badge(
                                containerColor = MaterialTheme.colorScheme.primary
                            )
                        }
                    }
                    
                    Spacer(modifier = Modifier.height(4.dp))
                    
                    Text(
                        text = notification.content,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis
                    )
                    
                    Spacer(modifier = Modifier.height(8.dp))
                    
                    Text(
                        text = formatter.format(notification.timestamp),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    )
}

@Composable
private fun DismissBackground() {
    Box(
        modifier = Modifier
            .fillMaxSize()
            .padding(horizontal = 16.dp, vertical = 8.dp),
        contentAlignment = Alignment.CenterEnd
    ) {
        Icon(
            Icons.Default.Delete,
            contentDescription = "Delete",
            tint = MaterialTheme.colorScheme.error
        )
    }
}

@Composable
private fun LoadingState() {
    Box(
        modifier = Modifier.fillMaxSize(),
        contentAlignment = Alignment.Center
    ) {
        CircularProgressIndicator()
    }
}

@Composable
private fun EmptyState() {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(32.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            Icons.Default.Notifications,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Spacer(modifier = Modifier.height(16.dp))
        Text(
            text = "No notifications yet",
            style = MaterialTheme.typography.titleMedium
        )
        Text(
            text = "We'll notify you when something important happens",
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
    }
}

@Composable
private fun ErrorState(
    error: String,
    onDismiss: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.errorContainer
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = error,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onErrorContainer,
                modifier = Modifier.weight(1f)
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
private fun NotificationPreferencesSheet(
    preferences: NotificationPreferences?,
    onDismiss: () -> Unit,
    onUpdatePreferences: (NotificationPreferences) -> Unit
) {
    var currentPreferences by remember(preferences) {
        mutableStateOf(preferences ?: NotificationPreferences())
    }

    ModalBottomSheet(
        onDismissRequest = onDismiss
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Notification Settings",
                style = MaterialTheme.typography.titleLarge
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            // Push notifications toggle
            ListItem(
                headlineContent = { Text("Push Notifications") },
                leadingContent = { Icon(Icons.Default.Notifications, null) },
                trailingContent = {
                    Switch(
                        checked = currentPreferences.enablePush,
                        onCheckedChange = { checked ->
                            currentPreferences = currentPreferences.copy(enablePush = checked)
                            onUpdatePreferences(currentPreferences)
                        }
                    )
                }
            )
            
            // Email notifications toggle
            ListItem(
                headlineContent = { Text("Email Notifications") },
                leadingContent = { Icon(Icons.Default.Email, null) },
                trailingContent = {
                    Switch(
                        checked = currentPreferences.enableEmail,
                        onCheckedChange = { checked ->
                            currentPreferences = currentPreferences.copy(enableEmail = checked)
                            onUpdatePreferences(currentPreferences)
                        }
                    )
                }
            )
            
            // SMS notifications toggle
            ListItem(
                headlineContent = { Text("SMS Notifications") },
                leadingContent = { Icon(Icons.Default.Sms, null) },
                trailingContent = {
                    Switch(
                        checked = currentPreferences.enableSMS,
                        onCheckedChange = { checked ->
                            currentPreferences = currentPreferences.copy(enableSMS = checked)
                            onUpdatePreferences(currentPreferences)
                        }
                    )
                }
            )
            
            // Quiet hours
            ListItem(
                headlineContent = { Text("Quiet Hours") },
                supportingContent = {
                    if (currentPreferences.enableQuietHours) {
                        Text("${currentPreferences.quietHoursStart}:00 - ${currentPreferences.quietHoursEnd}:00")
                    }
                },
                leadingContent = { Icon(Icons.Default.NightlightRound, null) },
                trailingContent = {
                    Switch(
                        checked = currentPreferences.enableQuietHours,
                        onCheckedChange = { checked ->
                            currentPreferences = currentPreferences.copy(enableQuietHours = checked)
                            onUpdatePreferences(currentPreferences)
                        }
                    )
                }
            )
        }
    }
} 