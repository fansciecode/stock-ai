package com.example.ibcmserver_init.ui.screens.settings

import androidx.compose.foundation.layout.*
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

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun SettingsScreen(
    onBackClick: () -> Unit,
    viewModel: SettingsViewModel = hiltViewModel()
) {
    val preferences by viewModel.preferences.collectAsState()
    val settingsState by viewModel.settingsState.collectAsState()
    var isLoading by remember { mutableStateOf(false) }
    var error by remember { mutableStateOf<String?>(null) }

    LaunchedEffect(settingsState) {
        when (settingsState) {
            is SettingsState.Loading -> {
                isLoading = true
                error = null
            }
            is SettingsState.Success -> {
                isLoading = false
                error = null
            }
            is SettingsState.Error -> {
                isLoading = false
                error = (settingsState as SettingsState.Error).message
            }
            else -> {
                isLoading = false
            }
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Settings") },
                navigationIcon = {
                    IconButton(onClick = onBackClick) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
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
            // Notifications Section
            Card {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Notifications",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    // Event Reminders
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Event Reminders")
                        Switch(
                            checked = preferences.eventRemindersEnabled,
                            onCheckedChange = { enabled ->
                                viewModel.updatePreferences(preferences.copy(eventRemindersEnabled = enabled))
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Event Updates
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Event Updates")
                        Switch(
                            checked = preferences.eventUpdatesEnabled,
                            onCheckedChange = { enabled ->
                                viewModel.updatePreferences(preferences.copy(eventUpdatesEnabled = enabled))
                            }
                        )
                    }

                    Spacer(modifier = Modifier.height(8.dp))

                    // Comment Notifications
                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Comment Notifications")
                        Switch(
                            checked = preferences.commentNotificationsEnabled,
                            onCheckedChange = { enabled ->
                                viewModel.updatePreferences(preferences.copy(commentNotificationsEnabled = enabled))
                            }
                        )
                    }
                }
            }

            // Appearance Section
            Card {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Appearance",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Dark Theme")
                        Switch(
                            checked = preferences.darkThemeEnabled,
                            onCheckedChange = { enabled ->
                                viewModel.updatePreferences(preferences.copy(darkThemeEnabled = enabled))
                            }
                        )
                    }
                }
            }

            // Location Section
            Card {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Text(
                        text = "Location",
                        style = MaterialTheme.typography.titleLarge
                    )
                    Spacer(modifier = Modifier.height(16.dp))

                    Row(
                        modifier = Modifier.fillMaxWidth(),
                        horizontalArrangement = Arrangement.SpaceBetween,
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        Text("Enable Location")
                        Switch(
                            checked = preferences.locationEnabled,
                            onCheckedChange = { enabled ->
                                viewModel.updatePreferences(preferences.copy(locationEnabled = enabled))
                            }
                        )
                    }

                    if (preferences.locationEnabled) {
                        Spacer(modifier = Modifier.height(8.dp))

                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween,
                            verticalAlignment = Alignment.CenterVertically
                        ) {
                            Text("Distance Unit")
                            DistanceUnitDropdown(
                                currentUnit = preferences.distanceUnit,
                                onUnitSelected = { unit ->
                                    viewModel.updatePreferences(preferences.copy(distanceUnit = unit))
                                }
                            )
                        }
                    }
                }
            }

            if (error != null) {
                Text(
                    text = error!!,
                    color = MaterialTheme.colorScheme.error,
                    modifier = Modifier.padding(vertical = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun DistanceUnitDropdown(
    currentUnit: String,
    onUnitSelected: (String) -> Unit
) {
    var expanded by remember { mutableStateOf(false) }
    val units = listOf("km", "mi")

    Box {
        TextButton(onClick = { expanded = true }) {
            Text(currentUnit.uppercase())
        }
        DropdownMenu(
            expanded = expanded,
            onDismissRequest = { expanded = false }
        ) {
            units.forEach { unit ->
                DropdownMenuItem(
                    text = { Text(unit.uppercase()) },
                    onClick = {
                        onUnitSelected(unit)
                        expanded = false
                    }
                )
            }
        }
    }
}