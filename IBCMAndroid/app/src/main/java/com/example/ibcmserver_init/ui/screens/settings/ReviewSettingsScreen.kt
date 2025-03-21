package com.example.ibcmserver_init.ui.screens.settings

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel

@Composable
fun ReviewSettingsScreen(
    onDismiss: () -> Unit,
    viewModel: ReviewSettingsViewModel = hiltViewModel()
) {
    var settings by remember { mutableStateOf(viewModel.settings.value) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Review Settings") },
                navigationIcon = {
                    IconButton(onClick = onDismiss) {
                        Icon(Icons.Default.Close, contentDescription = "Close")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Notification settings
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Notifications",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    SwitchPreference(
                        title = "New Reviews",
                        description = "Get notified when your products receive new reviews",
                        checked = settings.notifyNewReviews,
                        onCheckedChange = { checked ->
                            settings = settings.copy(notifyNewReviews = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                    SwitchPreference(
                        title = "Review Responses",
                        description = "Get notified when sellers respond to your reviews",
                        checked = settings.notifyReviewResponses,
                        onCheckedChange = { checked ->
                            settings = settings.copy(notifyReviewResponses = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                    SwitchPreference(
                        title = "Review Reports",
                        description = "Get notified when your reviews are reported",
                        checked = settings.notifyReviewReports,
                        onCheckedChange = { checked ->
                            settings = settings.copy(notifyReviewReports = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                }
            }

            // Review preferences
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Review Preferences",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    SwitchPreference(
                        title = "Auto-approve Reviews",
                        description = "Automatically approve reviews for your products",
                        checked = settings.autoApproveReviews,
                        onCheckedChange = { checked ->
                            settings = settings.copy(autoApproveReviews = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                    SwitchPreference(
                        title = "Require Purchase",
                        description = "Only allow reviews from verified purchasers",
                        checked = settings.requirePurchase,
                        onCheckedChange = { checked ->
                            settings = settings.copy(requirePurchase = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                }
            }

            // Review moderation
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "Review Moderation",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    SwitchPreference(
                        title = "Enable Profanity Filter",
                        description = "Automatically filter out inappropriate language",
                        checked = settings.enableProfanityFilter,
                        onCheckedChange = { checked ->
                            settings = settings.copy(enableProfanityFilter = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                    SwitchPreference(
                        title = "Enable Spam Detection",
                        description = "Detect and filter out spam reviews",
                        checked = settings.enableSpamDetection,
                        onCheckedChange = { checked ->
                            settings = settings.copy(enableSpamDetection = checked)
                            viewModel.updateSettings(settings)
                        }
                    )
                }
            }
        }
    }
}

@Composable
private fun SwitchPreference(
    title: String,
    description: String,
    checked: Boolean,
    onCheckedChange: (Boolean) -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Column(modifier = Modifier.weight(1f)) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            Text(
                text = description,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
        }
        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
} 