package com.example.ibcmserver_init.ui.screens.dashboard

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
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
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.*
import com.google.accompanist.swiperefresh.SwipeRefresh
import com.google.accompanist.swiperefresh.rememberSwipeRefreshState
import com.valentinilk.shimmer.shimmer
import java.text.SimpleDateFormat
import java.util.*
import com.example.ibcmserver_init.ui.components.MapComponent

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    viewModel: DashboardViewModel = hiltViewModel(),
    onNavigateToSearch: () -> Unit,
    onNavigateToNotifications: () -> Unit,
    onNavigateToProfile: () -> Unit,
    onNavigateToEventDetails: (String) -> Unit,
    onNavigateToUserProfile: (String) -> Unit,
    onNavigateToProduct: (String) -> Unit,
    onNavigateToBooking: (String) -> Unit,
    onNavigateToDeliveryTracking: (String) -> Unit,
    onNavigateToReview: (String) -> Unit,
    onNavigateToPayment: (String) -> Unit,
    onNavigateToOrder: (String) -> Unit,
    onNavigateToVenue: (String) -> Unit,
    onNavigateToCreateEvent: () -> Unit,
    onNavigateToSignUp: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val scrollBehavior = TopAppBarDefaults.pinnedScrollBehavior()
    val listState = rememberLazyListState()
    val swipeRefreshState = rememberSwipeRefreshState(isRefreshing = uiState.isRefreshing)
    
    // Show scroll-to-top button when scrolled
    val showScrollToTop by remember {
        derivedStateOf { listState.firstVisibleItemIndex > 0 }
    }

    Scaffold(
        topBar = {
            DashboardTopBar(
                unreadNotifications = uiState.unreadNotificationCount,
                onSearchClick = onNavigateToSearch,
                onNotificationClick = onNavigateToNotifications,
                onProfileClick = onNavigateToProfile,
                isAuthenticated = uiState.isAuthenticated
            )
        },
        floatingActionButton = {
            AnimatedVisibility(
                visible = showScrollToTop,
                enter = fadeIn() + slideInVertically(),
                exit = fadeOut() + slideOutVertically()
            ) {
                FloatingActionButton(
                    onClick = {
                        scope.launch {
                            listState.animateScrollToItem(0)
                        }
                    },
                    containerColor = MaterialTheme.colorScheme.secondaryContainer
                ) {
                    Icon(Icons.Default.KeyboardArrowUp, "Scroll to top")
                }
            }
        }
    ) { padding ->
        SwipeRefresh(
            state = swipeRefreshState,
            onRefresh = { viewModel.refresh() },
            modifier = Modifier.fillMaxSize()
        ) {
            Box(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
                // Map with Events
                Box(
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(0.6f)
                ) {
                    MapComponent(
                        markers = uiState.eventMarkers,
                        currentLocation = uiState.currentLocation,
                        onMarkerClick = { marker -> 
                            viewModel.selectMarker(marker)
                            if (!uiState.isAuthenticated) {
                                viewModel.trackEventView(marker.eventId, "map")
                            }
                        },
                        onEventClick = onNavigateToEventDetails,
                        modifier = Modifier.fillMaxSize()
                    )

                    if (uiState.isAuthenticated) {
                        CreateEventCard(
                            onClick = onNavigateToCreateEvent,
                            modifier = Modifier
                                .align(Alignment.BottomCenter)
                                .padding(16.dp)
                        )
                    }
                }

                // Event Sections
                LazyColumn(
                    state = listState,
                    modifier = Modifier
                        .fillMaxWidth()
                        .weight(0.4f)
                ) {
                    if (uiState.isLoading) {
                        items(3) {
                            ShimmerEventSection()
                        }
                    } else {
                        if (uiState.isAuthenticated) {
                            // Authenticated user sections
                            item {
                                EventSection(
                                    title = "Nearest Events",
                                    events = uiState.nearbyEvents,
                                    onEventClick = onNavigateToEventDetails,
                                    selectedCategory = uiState.selectedCategory,
                                    emptyMessage = "No nearby events found"
                                )
                            }

                            item {
                                EventSection(
                                    title = "Trending Events",
                                    events = uiState.trendingEvents,
                                    onEventClick = onNavigateToEventDetails,
                                    selectedCategory = uiState.selectedCategory,
                                    emptyMessage = "No trending events available"
                                )
                            }

                            item {
                                EventSection(
                                    title = "For You",
                                    events = uiState.interestBasedEvents,
                                    onEventClick = onNavigateToEventDetails,
                                    selectedCategory = uiState.selectedCategory,
                                    emptyMessage = "No personalized events yet"
                                )
                            }
                        } else {
                            // Non-authenticated user sections
                            uiState.landingContent?.let { content ->
                                item {
                                    LandingContentSection(content = content)
                                }
                            }

                            item {
                                ExternalEventsSection(
                                    title = "Nearby Events",
                                    events = uiState.externalEvents,
                                    onEventClick = { eventId ->
                                        viewModel.trackEventView(eventId, "list")
                                        onNavigateToEventDetails(eventId)
                                    }
                                )
                            }

                            uiState.offers?.let { offers ->
                                item {
                                    OffersSection(offers = offers)
                                }
                            }
                        }
                    }
                }
            }
        }

        // Notification Sheet
        if (uiState.showNotifications) {
            NotificationSheet(
                notifications = uiState.notifications,
                onDismiss = { viewModel.hideNotifications() },
                onNotificationClick = { notification ->
                    viewModel.hideNotifications()
                    when (notification.type) {
                        NotificationType.EVENT, NotificationType.EVENT_REMINDER -> 
                            onNavigateToEventDetails(notification.targetId)
                        NotificationType.USER -> 
                            onNavigateToUserProfile(notification.targetId)
                        NotificationType.PRODUCT -> 
                            onNavigateToProduct(notification.targetId)
                        NotificationType.BOOKING -> 
                            onNavigateToBooking(notification.targetId)
                        NotificationType.DELIVERY -> 
                            onNavigateToDeliveryTracking(notification.targetId)
                        NotificationType.REVIEW -> 
                            onNavigateToReview(notification.targetId)
                        NotificationType.PAYMENT -> 
                            onNavigateToPayment(notification.targetId)
                        NotificationType.ORDER_STATUS -> 
                            onNavigateToOrder(notification.targetId)
                    }
                }
            )
        }

        // Signup Prompt
        if (uiState.showSignupPrompt && uiState.signupPrompt != null) {
            SignupPromptSheet(
                prompt = uiState.signupPrompt!!,
                onDismiss = { viewModel.dismissSignupPrompt() },
                onSignUp = onNavigateToSignUp
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DashboardTopBar(
    unreadNotifications: Int,
    onSearchClick: () -> Unit,
    onNotificationClick: () -> Unit,
    onProfileClick: () -> Unit,
    isAuthenticated: Boolean
) {
    Surface(
        modifier = Modifier.fillMaxWidth(),
        color = MaterialTheme.colorScheme.surface,
        tonalElevation = 3.dp
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(horizontal = 16.dp, vertical = 8.dp),
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Search Bar
            Surface(
                onClick = onSearchClick,
                modifier = Modifier.weight(1f),
                shape = MaterialTheme.shapes.medium,
                color = MaterialTheme.colorScheme.surfaceVariant.copy(alpha = 0.3f)
            ) {
                Row(
                    modifier = Modifier
                        .padding(horizontal = 16.dp, vertical = 8.dp),
                    verticalAlignment = Alignment.CenterVertically,
                    horizontalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Icon(
                        imageVector = Icons.Default.Search,
                        contentDescription = "Search",
                        tint = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                    Text(
                        text = "Search",
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }

            // Notification Icon (only for authenticated users)
            if (isAuthenticated) {
                IconButton(onClick = onNotificationClick) {
                    BadgedBox(
                        badge = {
                            if (unreadNotifications > 0) {
                                Badge {
                Text(
                                        text = if (unreadNotifications > 99) "99+" else unreadNotifications.toString(),
                                        style = MaterialTheme.typography.labelSmall
                                    )
                                }
                            }
                        }
                    ) {
                        Icon(
                            imageVector = Icons.Default.Notifications,
                            contentDescription = "Notifications"
                        )
                    }
                }
            }

            // Profile Icon
            IconButton(onClick = onProfileClick) {
                Icon(
                    imageVector = if (isAuthenticated) Icons.Default.Person else Icons.Default.Login,
                    contentDescription = if (isAuthenticated) "Profile" else "Sign In"
                )
            }
        }
    }
}

@Composable
private fun EventSection(
    title: String,
    events: List<Event>,
    onEventClick: (String) -> Unit,
    selectedCategory: Category? = null,
    emptyMessage: String
) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = title + (selectedCategory?.let { " - ${it.name}" } ?: ""),
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        val filteredEvents = if (selectedCategory != null) {
            events.filter { it.category == selectedCategory.id }
        } else {
            events
        }

        if (filteredEvents.isEmpty()) {
            EmptyStateMessage(message = emptyMessage)
        } else {
            if (selectedCategory == null) {
                LazyRow(
                    horizontalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp)
                ) {
                    items(
                        items = filteredEvents,
                        key = { it.id }
                    ) { event ->
                        EventCard(
                            event = event,
                            onClick = { onEventClick(event.id) },
                            modifier = Modifier.width(280.dp)
                        )
                    }
                }
            } else {
                LazyColumn(
                    verticalArrangement = Arrangement.spacedBy(16.dp),
                    contentPadding = PaddingValues(horizontal = 16.dp)
                ) {
                    items(
                        items = filteredEvents,
                        key = { it.id }
                    ) { event ->
                        EventCard(
                            event = event,
                            onClick = { onEventClick(event.id) },
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }
            }
        }
    }
}

@Composable
private fun EmptyStateMessage(message: String) {
    Box(
        modifier = Modifier
            .fillMaxWidth()
            .padding(32.dp),
        contentAlignment = Alignment.Center
    ) {
        Column(
            horizontalAlignment = Alignment.CenterHorizontally,
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Icon(
                imageVector = Icons.Default.Event,
                contentDescription = null,
                modifier = Modifier.size(48.dp),
                tint = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Text(
                text = message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
    }
}

@Composable
private fun CategoryShimmer() {
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(horizontal = 16.dp),
        modifier = Modifier.padding(vertical = 8.dp)
    ) {
        items(5) {
            Column(
                horizontalAlignment = Alignment.CenterHorizontally,
                modifier = Modifier.shimmer()
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                )
                Spacer(modifier = Modifier.height(4.dp))
                Box(
                    modifier = Modifier
                        .width(60.dp)
                        .height(16.dp)
                        .clip(RoundedCornerShape(4.dp))
                        .background(MaterialTheme.colorScheme.surfaceVariant)
                )
            }
        }
    }
}

@Composable
private fun ShimmerEventSection() {
    Column(
        modifier = Modifier
            .padding(vertical = 8.dp)
            .shimmer()
    ) {
        Box(
            modifier = Modifier
                .padding(horizontal = 16.dp, vertical = 8.dp)
                .width(160.dp)
                .height(28.dp)
                .clip(RoundedCornerShape(4.dp))
                .background(MaterialTheme.colorScheme.surfaceVariant)
        )
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(horizontal = 16.dp)
        ) {
            items(3) {
                ShimmerEventCard()
            }
        }
    }
}

@Composable
private fun EventCard(
    event: Event,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Event Image
            Image(
                painter = rememberAsyncImagePainter(event.imageUrl),
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                contentScale = ContentScale.Crop
            )
            
            // Event Details
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${event.type} • ${event.formattedDate}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "${event.registeredCount}/100",
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    AssistChip(
                        onClick = { },
                        label = { Text("Registered") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationSheet(
    notifications: List<Notification>,
    onDismiss: () -> Unit,
    onNotificationClick: (Notification) -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = "Notifications",
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            LazyColumn(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                items(notifications) { notification ->
                    NotificationItem(
                        notification = notification,
                        onClick = { onNotificationClick(notification) }
                    )
                }
            }
        }
    }
}

@Composable
private fun NotificationItem(
    notification: Notification,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp),
        color = if (notification.isRead) 
            MaterialTheme.colorScheme.surface 
        else 
            MaterialTheme.colorScheme.primaryContainer
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Icon based on notification type
            Icon(
                imageVector = when (notification.type) {
                    NotificationType.EVENT, NotificationType.EVENT_REMINDER -> 
                        Icons.Default.Event
                    NotificationType.USER -> 
                        Icons.Default.Person
                    NotificationType.PRODUCT -> 
                        Icons.Default.ShoppingCart
                    NotificationType.BOOKING -> 
                        Icons.Default.ConfirmationNumber
                    NotificationType.DELIVERY -> 
                        Icons.Default.LocalShipping
                    NotificationType.REVIEW -> 
                        Icons.Default.Star
                    NotificationType.PAYMENT -> 
                        Icons.Default.Payment
                    NotificationType.ORDER_STATUS -> 
                        Icons.Default.Receipt
                },
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            Column {
                Text(
                    text = notification.title,
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = if (!notification.isRead) FontWeight.Bold else FontWeight.Normal
                )
                Text(
                    text = notification.message,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Text(
                    text = notification.timestamp.formatRelativeTime(),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    modifier = Modifier.padding(top = 4.dp)
                )
            }
        }
    }
}

// Helper function to format relative time
private fun Long.formatRelativeTime(): String {
    val now = System.currentTimeMillis()
    val diff = now - this
    return when {
        diff < 60_000 -> "Just now"
        diff < 3600_000 -> "${diff / 60_000}m ago"
        diff < 86400_000 -> "${diff / 3600_000}h ago"
        else -> "${diff / 86400_000}d ago"
    }
}

@Composable
private fun ErrorMessage(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Filled.Error,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(48.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(16.dp))
        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
}

@Composable
private fun ShimmerEventCard() {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .shimmer(),
        shape = RoundedCornerShape(16.dp)
    ) {
        Column {
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp)
                    .background(MaterialTheme.colorScheme.surfaceVariant)
            )
            Column(
                modifier = Modifier.padding(16.dp),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.7f)
                        .height(24.dp)
                        .background(
                            MaterialTheme.colorScheme.surfaceVariant,
                            RoundedCornerShape(4.dp)
                        )
                )
                Box(
                    modifier = Modifier
                        .fillMaxWidth(0.4f)
                        .height(16.dp)
                        .background(
                            MaterialTheme.colorScheme.surfaceVariant,
                            RoundedCornerShape(4.dp)
                        )
                )
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Box(
                        modifier = Modifier
                            .width(80.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant,
                                RoundedCornerShape(4.dp)
                            )
                    )
                    Box(
                        modifier = Modifier
                            .width(60.dp)
                            .height(16.dp)
                            .background(
                                MaterialTheme.colorScheme.surfaceVariant,
                                RoundedCornerShape(4.dp)
                            )
                    )
                }
            }
        }
    }
}

@Composable
private fun CategoryItem(
    category: Category,
    isSelected: Boolean,
    onClick: () -> Unit
) {
    Column(
        horizontalAlignment = Alignment.CenterHorizontally,
        modifier = Modifier.clickable(onClick = onClick)
    ) {
        Box(
            modifier = Modifier
                .size(48.dp)
                .clip(CircleShape)
                .background(
                    if (isSelected) MaterialTheme.colorScheme.primary
                    else MaterialTheme.colorScheme.surface
                ),
            contentAlignment = Alignment.Center
        ) {
            Icon(
                imageVector = category.icon,
                contentDescription = category.name,
                tint = if (isSelected) 
                    MaterialTheme.colorScheme.onPrimary
                else 
                    MaterialTheme.colorScheme.onSurface,
                modifier = Modifier.size(24.dp)
            )
        }
        Text(
            text = category.name,
            style = MaterialTheme.typography.bodyMedium,
            modifier = Modifier.padding(top = 4.dp)
        )
    }
}

@Composable
private fun CreateEventCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier,
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = "Create New event",
                style = MaterialTheme.typography.titleMedium
            )
            Text(
                text = "Create new sports, music, cycling, etc .. with your friends",
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            Spacer(modifier = Modifier.height(8.dp))
            FloatingActionButton(
                onClick = onClick,
                containerColor = MaterialTheme.colorScheme.primaryContainer
            ) {
                Icon(Icons.Default.Add, "Create Event")
            }
        }
    }
}

@Composable
private fun NetworkStatusIndicator(networkState: NetworkState) {
    val (icon, tint) = when (networkState) {
        NetworkState.Available -> Icons.Filled.SignalWifi4Bar to MaterialTheme.colorScheme.primary
        NetworkState.Losing -> Icons.Filled.SignalWifiStatusbarConnectedNoInternet4 to MaterialTheme.colorScheme.error
        NetworkState.Lost, NetworkState.Unavailable -> Icons.Filled.SignalWifiOff to MaterialTheme.colorScheme.error
    }
    
    Icon(
        imageVector = icon,
        contentDescription = "Network Status",
        tint = tint,
        modifier = Modifier
            .size(24.dp)
            .padding(end = 8.dp)
    )
}

@Composable
private fun OfflineBanner(
    connectionType: NetworkState,
    onRetry: () -> Unit
) {
    Surface(
        color = MaterialTheme.colorScheme.errorContainer,
        modifier = Modifier.fillMaxWidth()
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Row(
                horizontalArrangement = Arrangement.spacedBy(8.dp),
                verticalAlignment = Alignment.CenterVertically
            ) {
                Icon(
                    imageVector = Icons.Filled.CloudOff,
                    contentDescription = null,
                    tint = MaterialTheme.colorScheme.onErrorContainer
                )
                Text(
                    text = when (connectionType) {
                        NetworkState.Lost -> "Connection lost"
                        NetworkState.Losing -> "Poor connection"
                        NetworkState.Unavailable -> "No internet connection"
                        else -> "Working offline"
                    },
                    color = MaterialTheme.colorScheme.onErrorContainer
                )
            }
            TextButton(onClick = onRetry) {
                Text("RETRY")
            }
        }
    }
}

@Composable
private fun SearchResultItem(
    result: SearchResult,
    onClick: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        shape = RoundedCornerShape(8.dp)
    ) {
        Row(
            modifier = Modifier.padding(12.dp),
            horizontalArrangement = Arrangement.spacedBy(12.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            // Result type icon
            Icon(
                imageVector = when (result.type) {
                    SearchResultType.EVENT -> Icons.Default.Event
                    SearchResultType.USER -> Icons.Default.Person
                    SearchResultType.PRODUCT -> Icons.Default.ShoppingCart
                    SearchResultType.BOOKING -> Icons.Default.ConfirmationNumber
                    SearchResultType.VENUE -> Icons.Default.Place
                    SearchResultType.REVIEW -> Icons.Default.Star
                    SearchResultType.ORDER -> Icons.Default.Receipt
                },
                contentDescription = null,
                tint = MaterialTheme.colorScheme.primary
            )
            
            Column(
                modifier = Modifier.weight(1f)
            ) {
                Text(
                    text = result.title,
                    style = MaterialTheme.typography.bodyLarge,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Text(
                    text = result.subtitle,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
            }

            if (result.imageUrl != null) {
                AsyncImage(
                    model = result.imageUrl,
                    contentDescription = null,
                    modifier = Modifier
                        .size(48.dp)
                        .clip(RoundedCornerShape(4.dp)),
                    contentScale = ContentScale.Crop
                )
            }
        }
    }
}

@Composable
private fun LandingContentSection(content: LandingContentData) {
    Column(
        modifier = Modifier.padding(16.dp)
    ) {
        Text(
            text = content.title,
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )
        Text(
            text = content.description,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.onSurfaceVariant,
            modifier = Modifier.padding(bottom = 16.dp)
        )
        Button(
            onClick = { /* Handle CTA */ },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text(content.ctaText)
        }
    }
}

@Composable
private fun ExternalEventsSection(
    title: String,
    events: List<ExternalEventData>,
    onEventClick: (String) -> Unit
) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = title,
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        if (events.isEmpty()) {
            EmptyStateMessage(message = "No nearby events found")
        } else {
            LazyRow(
                horizontalArrangement = Arrangement.spacedBy(16.dp),
                contentPadding = PaddingValues(horizontal = 16.dp)
            ) {
                items(
                    items = events,
                    key = { it.id }
                ) { event ->
                    ExternalEventCard(
                        event = event,
                        onClick = { onEventClick(event.id) },
                        modifier = Modifier.width(280.dp)
                    )
                }
            }
        }
    }
}

@Composable
private fun ExternalEventCard(
    event: ExternalEventData,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Event Image
            AsyncImage(
                model = event.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                contentScale = ContentScale.Crop
            )
            
            // Event Details
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = event.name,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "${event.type} • ${event.formattedDate}",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = event.price,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    AssistChip(
                        onClick = { },
                        label = { Text("View Details") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun OffersSection(offers: OffersData) {
    Column(modifier = Modifier.padding(vertical = 8.dp)) {
        Text(
            text = "Special Offers",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )
        
        LazyRow(
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            contentPadding = PaddingValues(horizontal = 16.dp)
        ) {
            items(
                items = offers.offers,
                key = { it.id }
            ) { offer ->
                OfferCard(
                    offer = offer,
                    onClick = { /* Handle offer click */ },
                    modifier = Modifier.width(280.dp)
                )
            }
        }
    }
}

@Composable
private fun OfferCard(
    offer: OfferData,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.clickable(onClick = onClick),
        shape = RoundedCornerShape(12.dp)
    ) {
        Column {
            // Offer Image
            AsyncImage(
                model = offer.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(140.dp),
                contentScale = ContentScale.Crop
            )
            
            // Offer Details
            Column(modifier = Modifier.padding(12.dp)) {
                Text(
                    text = offer.title,
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = offer.description,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant,
                    maxLines = 2,
                    overflow = TextOverflow.Ellipsis
                )
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(top = 8.dp),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = offer.discount,
                        style = MaterialTheme.typography.labelMedium,
                        color = MaterialTheme.colorScheme.primary
                    )
                    AssistChip(
                        onClick = { },
                        label = { Text("Get Offer") },
                        colors = AssistChipDefaults.assistChipColors(
                            containerColor = MaterialTheme.colorScheme.primaryContainer
                        )
                    )
                }
            }
        }
    }
}

@Composable
private fun SignupPromptSheet(
    prompt: SignupPrompt,
    onDismiss: () -> Unit,
    onSignUp: () -> Unit
) {
    ModalBottomSheet(
        onDismissRequest = onDismiss,
        sheetState = rememberModalBottomSheetState()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalAlignment = Alignment.CenterHorizontally
        ) {
            Text(
                text = prompt.title,
                style = MaterialTheme.typography.titleLarge,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            Text(
                text = prompt.message,
                style = MaterialTheme.typography.bodyLarge,
                color = MaterialTheme.colorScheme.onSurfaceVariant,
                modifier = Modifier.padding(bottom = 16.dp)
            )
            Button(
                onClick = onSignUp,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(prompt.ctaText)
            }
            TextButton(
                onClick = onDismiss,
                modifier = Modifier.fillMaxWidth()
            ) {
                Text("Maybe Later")
            }
        }
    }
} 