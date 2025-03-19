package com.example.ibcmserver_init.ui.screens.profile

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import androidx.navigation.NavController
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.ui.navigation.Screen
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun UserProfileScreen(
    navController: NavController,
    viewModel: UserProfileViewModel = hiltViewModel()
) {
    var showEditDialog by remember { mutableStateOf(false) }
    val createdEvents by viewModel.createdEvents.collectAsState()
    val attendingEvents by viewModel.attendingEvents.collectAsState()

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Profile") },
                actions = {
                    IconButton(onClick = { showEditDialog = true }) {
                        Icon(Icons.Default.Edit, contentDescription = "Edit Profile")
                    }
                    IconButton(onClick = {
                        viewModel.logout()
                        navController.navigate(Screen.Login.route) {
                            popUpTo(0)
                        }
                    }) {
                        Icon(Icons.Default.Logout, contentDescription = "Logout")
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
            } else {
                LazyColumn(
                    modifier = Modifier.fillMaxSize(),
                    contentPadding = PaddingValues(16.dp),
                    verticalArrangement = Arrangement.spacedBy(16.dp)
                ) {
                    // Profile Header
                    item {
                        ProfileHeader(
                            displayName = viewModel.user?.displayName ?: "",
                            email = viewModel.user?.email ?: "",
                            bio = viewModel.user?.bio,
                            profilePictureUrl = viewModel.user?.profilePictureUrl
                        )
                    }

                    // Created Events Section
                    item {
                        Text(
                            text = "Created Events",
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                    item {
                        if (createdEvents.isEmpty()) {
                            Text(
                                text = "No events created yet",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(createdEvents) { event ->
                                    EventCard(
                                        event = event,
                                        onClick = {
                                            navController.navigate(Screen.EventDetails.createRoute(event.id))
                                        }
                                    )
                                }
                            }
                        }
                    }

                    // Attending Events Section
                    item {
                        Text(
                            text = "Attending Events",
                            style = MaterialTheme.typography.titleLarge
                        )
                    }
                    item {
                        if (attendingEvents.isEmpty()) {
                            Text(
                                text = "Not attending any events",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        } else {
                            LazyRow(
                                horizontalArrangement = Arrangement.spacedBy(8.dp)
                            ) {
                                items(attendingEvents) { event ->
                                    EventCard(
                                        event = event,
                                        onClick = {
                                            navController.navigate(Screen.EventDetails.createRoute(event.id))
                                        }
                                    )
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Edit Profile Dialog
    if (showEditDialog) {
        EditProfileDialog(
            initialDisplayName = viewModel.user?.displayName ?: "",
            initialEmail = viewModel.user?.email ?: "",
            initialBio = viewModel.user?.bio ?: "",
            onDismiss = { showEditDialog = false },
            onSave = { displayName, email, bio ->
                viewModel.updateProfile(displayName, email, bio)
                showEditDialog = false
            }
        )
    }

    // Error Dialog
    viewModel.error?.let { error ->
        AlertDialog(
            onDismissRequest = { viewModel.clearError() },
            title = { Text("Error") },
            text = { Text(error) },
            confirmButton = {
                TextButton(onClick = { viewModel.clearError() }) {
                    Text("OK")
                }
            }
        )
    }
}

@Composable
private fun ProfileHeader(
    displayName: String,
    email: String,
    bio: String?,
    profilePictureUrl: String?
) {
    Column(
        modifier = Modifier.fillMaxWidth(),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(8.dp)
    ) {
        AsyncImage(
            model = profilePictureUrl ?: "https://via.placeholder.com/150",
            contentDescription = "Profile Picture",
            modifier = Modifier
                .size(120.dp)
                .clip(CircleShape),
            contentScale = ContentScale.Crop
        )

        Text(
            text = displayName,
            style = MaterialTheme.typography.headlineMedium
        )

        Text(
            text = email,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )

        if (!bio.isNullOrBlank()) {
            Text(
                text = bio,
                style = MaterialTheme.typography.bodyMedium,
                textAlign = androidx.compose.ui.text.style.TextAlign.Center
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun EventCard(
    event: Event,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.width(280.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Text(
                text = event.title,
                style = MaterialTheme.typography.titleMedium,
                maxLines = 1,
                overflow = TextOverflow.Ellipsis
            )
            Text(
                text = event.description,
                style = MaterialTheme.typography.bodyMedium,
                maxLines = 2,
                overflow = TextOverflow.Ellipsis
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = event.date.format(DateTimeFormatter.ofPattern("MMM dd, yyyy")),
                    style = MaterialTheme.typography.bodySmall
                )
                Text(
                    text = "${event.attendees.size} attending",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun EditProfileDialog(
    initialDisplayName: String,
    initialEmail: String,
    initialBio: String,
    onDismiss: () -> Unit,
    onSave: (displayName: String, email: String, bio: String) -> Unit
) {
    var displayName by remember { mutableStateOf(initialDisplayName) }
    var email by remember { mutableStateOf(initialEmail) }
    var bio by remember { mutableStateOf(initialBio) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Edit Profile") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = displayName,
                    onValueChange = { displayName = it },
                    label = { Text("Display Name") }
                )
                OutlinedTextField(
                    value = email,
                    onValueChange = { email = it },
                    label = { Text("Email") }
                )
                OutlinedTextField(
                    value = bio,
                    onValueChange = { bio = it },
                    label = { Text("Bio") }
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onSave(displayName, email, bio) }
            ) {
                Text("Save")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 