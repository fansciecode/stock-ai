// Event Creator Dashboard - Manages event creation and analytics
package com.example.ibcmserver_init.ui.screens.dashboard

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
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.event.EventAnalytics
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.navigation.Screen

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventCreatorDashboard(
    onEventClick: (String) -> Unit,
    onEventCreationClick: () -> Unit,
    onAnalyticsClick: (String) -> Unit,
    onSettingsClick: () -> Unit,
    viewModel: EventCreatorDashboardViewModel = hiltViewModel()
) {
    var selectedTab by remember { mutableStateOf(0) }
    val events by viewModel.events.collectAsState()
    val analytics by viewModel.analytics.collectAsState()
    val isLoading by viewModel.isLoading.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Creator Dashboard") },
                actions = {
                    IconButton(onClick = onSettingsClick) {
                        Icon(Icons.Default.Settings, contentDescription = "Settings")
                    }
                }
            )
        },
        floatingActionButton = {
            FloatingActionButton(onClick = onEventCreationClick) {
                Icon(Icons.Default.Add, contentDescription = "Create Event")
            }
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("My Events") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Analytics") }
                )
            }

            when (selectedTab) {
                0 -> EventsList(
                    events = events,
                    onEventClick = onEventClick,
                    onAnalyticsClick = onAnalyticsClick,
                    isLoading = isLoading
                )
                1 -> AnalyticsOverview(
                    analytics = analytics,
                    isLoading = isLoading
                )
            }
        }
    }
}

@Composable
private fun EventsList(
    events: List<Event>,
    onEventClick: (String) -> Unit,
    onAnalyticsClick: (String) -> Unit,
    isLoading: Boolean
) {
    if (isLoading) {
        LoadingIndicator()
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(events) { event ->
                EventCard(
                    event = event,
                    onClick = { onEventClick(event.id) },
                    onAnalyticsClick = { onAnalyticsClick(event.id) }
                )
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EventCard(
    event: Event,
    onClick: () -> Unit,
    onAnalyticsClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(onClick = onAnalyticsClick) {
                    Icon(Icons.Default.Analytics, contentDescription = "View Analytics")
                }
            }
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = event.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2
            )
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Status: ${event.status}",
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "Attendees: ${event.attendees.size}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun AnalyticsOverview(
    analytics: EventAnalytics?,
    isLoading: Boolean
) {
    if (isLoading) {
        LoadingIndicator()
    } else if (analytics != null) {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            item {
                AnalyticsCard(
                    title = "Attendance",
                    content = {
                        Text("Expected: ${analytics.attendance.expectedAttendance}")
                        Text("Registered: ${analytics.attendance.registeredAttendance}")
                        Text("Rate: ${analytics.attendance.attendanceRate}%")
                    }
                )
            }
            item {
                AnalyticsCard(
                    title = "Engagement",
                    content = {
                        Text("Social Mentions: ${analytics.engagement.socialMediaMentions}")
                        Text("Website Visits: ${analytics.engagement.websiteVisits}")
                        Text("Conversion Rate: ${analytics.engagement.registrationConversionRate}%")
                    }
                )
            }
            item {
                AnalyticsCard(
                    title = "Revenue",
                    content = {
                        Text("Projected: $${analytics.revenue.projectedRevenue}")
                        Text("Current: $${analytics.revenue.currentRevenue}")
                        Text("Avg Ticket Price: $${analytics.revenue.averageTicketPrice}")
                    }
                )
            }
            item {
                AnalyticsCard(
                    title = "Insights",
                    content = {
                        analytics.insights.forEach { insight ->
                            Text(
                                text = insight.description,
                                style = MaterialTheme.typography.bodyMedium
                            )
                            Spacer(modifier = Modifier.height(4.dp))
                        }
                    }
                )
            }
        }
    } else {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("No analytics data available")
        }
    }
}

@Composable
private fun AnalyticsCard(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            content()
        }
    }
} 