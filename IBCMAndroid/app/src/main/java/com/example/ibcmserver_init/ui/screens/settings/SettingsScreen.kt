package com.example.ibcmserver_init.ui.screens.settings

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
import com.example.ibcmserver_init.ui.components.LoadingScreen
import com.example.ibcmserver_init.ui.components.ErrorScreen

@Composable
fun SettingsScreen(
    onNavigateToChat: () -> Unit,
    onNavigateToSupport: () -> Unit,
    onNavigateToTerms: () -> Unit,
    onNavigateToPrivacy: () -> Unit,
    onNavigateToPackages: () -> Unit,
    onLogout: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val uiState by viewModel.uiState.collectAsState()

    when (uiState) {
        is SettingsUiState.Loading -> LoadingScreen()
        is SettingsUiState.Error -> ErrorScreen(
            message = (uiState as SettingsUiState.Error).message,
            onRetry = { viewModel.loadSettings() }
        )
        is SettingsUiState.Success -> {
            val settings = (uiState as SettingsUiState.Success).settings
            SettingsContent(
                settings = settings,
                onSettingChanged = { key, value -> viewModel.updateSetting(key, value) },
                onNavigateToChat = onNavigateToChat,
                onNavigateToSupport = onNavigateToSupport,
                onNavigateToTerms = onNavigateToTerms,
                onNavigateToPrivacy = onNavigateToPrivacy,
                onNavigateToPackages = onNavigateToPackages,
                onLogout = {
                    viewModel.logout()
                    onLogout()
                }
            )
        }
    }
}

@Composable
private fun SettingsContent(
    settings: Settings,
    onSettingChanged: (String, Any) -> Unit,
    onNavigateToChat: () -> Unit,
    onNavigateToSupport: () -> Unit,
    onNavigateToTerms: () -> Unit,
    onNavigateToPrivacy: () -> Unit,
    onNavigateToPackages: () -> Unit,
    onLogout: () -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        item {
            Text(
                text = "Settings",
                style = MaterialTheme.typography.headlineMedium,
                modifier = Modifier.padding(bottom = 16.dp)
            )
        }

        // Notifications Section
        item {
            SettingsSection(title = "Notifications") {
                SettingsSwitch(
                    title = "Event Notifications",
                    checked = settings.eventNotifications,
                    onCheckedChange = { onSettingChanged("event_notifications", it) }
                )
                SettingsSwitch(
                    title = "Chat Notifications",
                    checked = settings.chatNotifications,
                    onCheckedChange = { onSettingChanged("chat_notifications", it) }
                )
                SettingsSwitch(
                    title = "Follow Notifications",
                    checked = settings.followNotifications,
                    onCheckedChange = { onSettingChanged("follow_notifications", it) }
                )
                SettingsSwitch(
                    title = "Email Notifications",
                    checked = settings.emailNotifications,
                    onCheckedChange = { onSettingChanged("email_notifications", it) }
                )
                SettingsSwitch(
                    title = "Push Notifications",
                    checked = settings.pushNotifications,
                    onCheckedChange = { onSettingChanged("push_notifications", it) }
                )
                SettingsSwitch(
                    title = "Login Notifications",
                    checked = settings.loginNotifications,
                    onCheckedChange = { onSettingChanged("login_notifications", it) }
                )
            }
        }

        // Appearance Section
        item {
            SettingsSection(title = "Appearance") {
                SettingsSwitch(
                    title = "Dark Mode",
                    checked = settings.darkMode,
                    onCheckedChange = { onSettingChanged("dark_mode", it) }
                )
                SettingsDropdown(
                    title = "Language",
                    value = settings.language,
                    options = listOf("English", "Spanish", "French", "German"),
                    onOptionSelected = { onSettingChanged("language", it) }
                )
                SettingsDropdown(
                    title = "Timezone",
                    value = settings.timezone,
                    options = listOf("UTC", "EST", "PST", "GMT"),
                    onOptionSelected = { onSettingChanged("timezone", it) }
                )
            }
        }

        // Media Section
        item {
            SettingsSection(title = "Media") {
                SettingsSwitch(
                    title = "Auto-play Videos",
                    checked = settings.autoPlayVideos,
                    onCheckedChange = { onSettingChanged("auto_play_videos", it) }
                )
                SettingsSwitch(
                    title = "Data Saver",
                    checked = settings.dataSaver,
                    onCheckedChange = { onSettingChanged("data_saver", it) }
                )
                SettingsSwitch(
                    title = "Sound",
                    checked = settings.soundEnabled,
                    onCheckedChange = { onSettingChanged("sound_enabled", it) }
                )
                SettingsSwitch(
                    title = "Vibration",
                    checked = settings.vibrationEnabled,
                    onCheckedChange = { onSettingChanged("vibration_enabled", it) }
                )
            }
        }

        // Location Section
        item {
            SettingsSection(title = "Location") {
                SettingsSwitch(
                    title = "Location Services",
                    checked = settings.locationServices,
                    onCheckedChange = { onSettingChanged("location_services", it) }
                )
                SettingsDropdown(
                    title = "Distance Unit",
                    value = settings.distanceUnit,
                    options = listOf("km", "mi"),
                    onOptionSelected = { onSettingChanged("distance_unit", it) }
                )
            }
        }

        // Privacy & Security Section
        item {
            SettingsSection(title = "Privacy & Security") {
                SettingsSwitch(
                    title = "Content Filter",
                    checked = settings.contentFilter,
                    onCheckedChange = { onSettingChanged("content_filter", it) }
                )
                SettingsSwitch(
                    title = "Two-Factor Authentication",
                    checked = settings.twoFactorAuth,
                    onCheckedChange = { onSettingChanged("two_factor_auth", it) }
                )
                SettingsDropdown(
                    title = "Account Privacy",
                    value = settings.accountPrivacy,
                    options = listOf("public", "private", "friends"),
                    onOptionSelected = { onSettingChanged("account_privacy", it) }
                )
            }
        }

        // Support Section
        item {
            SettingsSection(title = "Support") {
                SettingsButton(
                    title = "Chat Support",
                    icon = Icons.Default.Chat,
                    onClick = onNavigateToChat
                )
                SettingsButton(
                    title = "Help Center",
                    icon = Icons.Default.Help,
                    onClick = onNavigateToSupport
                )
            }
        }

        // Legal Section
        item {
            SettingsSection(title = "Legal") {
                SettingsButton(
                    title = "Terms of Service",
                    icon = Icons.Default.Description,
                    onClick = onNavigateToTerms
                )
                SettingsButton(
                    title = "Privacy Policy",
                    icon = Icons.Default.Security,
                    onClick = onNavigateToPrivacy
                )
            }
        }

        // Subscription Section
        item {
            SettingsSection(title = "Subscription") {
                SettingsButton(
                    title = "Manage Packages",
                    icon = Icons.Default.Star,
                    onClick = onNavigateToPackages
                )
            }
        }

        // Logout Button
        item {
            Button(
                onClick = onLogout,
                        modifier = Modifier.fillMaxWidth(),
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Logout")
            }
        }
    }
}

@Composable
private fun SettingsSection(
    title: String,
    content: @Composable () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                text = title,
                style = MaterialTheme.typography.titleMedium,
                modifier = Modifier.padding(bottom = 8.dp)
            )
            content()
        }
    }
}

@Composable
private fun SettingsSwitch(
    title: String,
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
        Text(text = title)
                        Switch(
            checked = checked,
            onCheckedChange = onCheckedChange
        )
    }
}

@Composable
private fun SettingsDropdown(
    title: String,
    value: String,
    options: List<String>,
    onOptionSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Text(text = title)
        ExposedDropdownMenuBox(
            expanded = expanded,
            onExpandedChange = { expanded = it }
        ) {
            OutlinedTextField(
                value = value,
                onValueChange = {},
                readOnly = true,
                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = expanded) },
                modifier = Modifier
                    .fillMaxWidth()
                    .menuAnchor()
            )
            ExposedDropdownMenu(
                expanded = expanded,
                onDismissRequest = { expanded = false }
            ) {
                options.forEach { option ->
                DropdownMenuItem(
                        text = { Text(option) },
                    onClick = {
                            onOptionSelected(option)
                        expanded = false
                    }
                )
            }
            }
        }
    }
}

@Composable
private fun SettingsButton(
    title: String,
    icon: ImageVector,
    onClick: () -> Unit
) {
    Button(
        onClick = onClick,
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(text = title)
            Icon(
                imageVector = icon,
                contentDescription = null
            )
        }
    }
}