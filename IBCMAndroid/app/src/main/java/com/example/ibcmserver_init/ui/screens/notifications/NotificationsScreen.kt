package com.example.ibcmserver_init.ui.screens.notifications

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
import androidx.navigation.NavController
import java.text.SimpleDateFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun NotificationsScreen(
    navController: NavController,
    viewModel: NotificationsViewModel = hiltViewModel()
) {
    val notifications = viewModel.notifications
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Notifications") },
                navigationIcon = {
                    IconButton(onClick = { navController.navigateUp() }) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    if (notifications.isNotEmpty()) {
                        IconButton(onClick = { viewModel.markAllAsRead("currentUserId") }) {
                            Icon(Icons.Default.DoneAll, contentDescription = "Mark all as read")
                        }
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
            if (viewModel.isLoading) {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.Center)
                )
            } else if (notifications.isEmpty()) {
                Text(
                    text = "No notifications",
                    modifier = Modifier
                        .align(Alignment.Center)
                        .padding(16.dp),
                    style = MaterialTheme.typography.bodyLarge
                )
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(vertical = 8.dp)
                ) {
                    items(notifications) { notification ->
                        NotificationItem(
                            notification = notification,
                            onNotificationClick = {
                                viewModel.markAsRead("currentUserId", notification.id)
                                // Navigate based on notification type
                                when (notification.type) {
                                    "EVENT_CREATED", "EVENT_UPDATED", "EVENT_CANCELLED", "EVENT_REMINDER" -> navController.navigate("event_details/${notification.eventId}")
                                    "FOLLOW_REQUEST", "NEW_FOLLOWER" -> navController.navigate("profile/${notification.userId}")
                                    "CHAT_MESSAGE" -> navController.navigate("chat_detail/${notification.chatId}")
                                    "ORDER_PLACED", "ORDER_CONFIRMED", "ORDER_SHIPPED" -> navController.navigate("order_details/${notification.orderId}")
                                    "TICKET_BOOKED" -> navController.navigate("ticket_details/${notification.ticketId}")
                                    "PAYMENT_RECEIVED" -> navController.navigate("payment_details/${notification.paymentId}")
                                    "REVIEW_RECEIVED" -> navController.navigate("event_details/${notification.eventId}")
                                    else -> {
                                        // Default case - navigate to notifications list
                                        navController.navigate("notifications")
                                    }
                                }
                            },
                            onDeleteClick = {
                                viewModel.deleteNotification("currentUserId", notification.id)
                            }
                        )
                    }
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun NotificationItem(
    notification: Notification,
    onNotificationClick: () -> Unit,
    onDeleteClick: () -> Unit
) {
    Card(
        onClick = onNotificationClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                modifier = Modifier.weight(1f),
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                // Notification icon based on type
                Icon(
                    imageVector = when (notification.type) {
                        "EVENT_CREATED", "EVENT_UPDATED", "EVENT_CANCELLED", "EVENT_REMINDER" -> 
                            Icons.Default.Event
                        "FOLLOW_REQUEST", "NEW_FOLLOWER" -> 
                            Icons.Default.Person
                        "CHAT_MESSAGE" -> 
                            Icons.Default.Chat
                        "ORDER_PLACED", "ORDER_CONFIRMED", "ORDER_SHIPPED" -> 
                            Icons.Default.ShoppingCart
                        "TICKET_BOOKED" -> 
                            Icons.Default.ConfirmationNumber
                        "PAYMENT_RECEIVED" -> 
                            Icons.Default.Payment
                        "REVIEW_RECEIVED" -> 
                            Icons.Default.Star
                        else -> 
                            Icons.Default.Notifications
                    },
                    contentDescription = null,
                    tint = if (!notification.isRead) 
                        MaterialTheme.colorScheme.primary 
                    else 
                        MaterialTheme.colorScheme.onSurfaceVariant
                )

                Column(
                    modifier = Modifier.weight(1f)
                ) {
                    Text(
                        text = notification.title,
                        style = MaterialTheme.typography.titleMedium,
                        maxLines = 1,
                        overflow = TextOverflow.Ellipsis
                    )
                    Text(
                        text = notification.message,
                        style = MaterialTheme.typography.bodyMedium,
                        maxLines = 2,
                        overflow = TextOverflow.Ellipsis,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = SimpleDateFormat("MMM dd, HH:mm", Locale.getDefault())
                            .format(Date(notification.timestamp)),
                        style = MaterialTheme.typography.labelSmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            IconButton(onClick = onDeleteClick) {
                Icon(
                    Icons.Default.Delete,
                    contentDescription = "Delete notification",
                    tint = MaterialTheme.colorScheme.error
                )
            }
        }
    }
} 