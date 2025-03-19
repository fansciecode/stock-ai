package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.*
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.grid.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.ui.components.MediaGrid
import com.example.ibcmserver_init.ui.components.StepProgressIndicator
import java.time.LocalDateTime
import com.example.ibcmserver_init.ui.screens.package.EventLimitDialog
import com.example.ibcmserver_init.ui.screens.package.PackageScreen
import com.example.ibcmserver_init.ui.screens.package.PackageViewModel
import com.example.ibcmserver_init.ui.screens.package.PackageUiState

@Composable
fun CreateEventScreen(
    viewModel: CreateEventViewModel = hiltViewModel(),
    packageViewModel: PackageViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onEventCreated: () -> Unit
) {
    var showPackageScreen by remember { mutableStateOf(false) }
    val packageUiState by packageViewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        packageViewModel.checkEventCreationAvailability()
    }

    when (packageUiState) {
        is PackageUiState.NeedPackage -> {
            PackageScreen(
                onNavigateBack = { showPackageScreen = false },
                onPackageSelected = { packageId ->
                    // Handle package selection and payment
                    showPackageScreen = false
                }
            )
        }
        is PackageUiState.CanCreateEvent -> {
            // Show the regular create event screen
            CreateEventContent(
                viewModel = viewModel,
                onNavigateBack = onNavigateBack,
                onEventCreated = onEventCreated
            )
        }
        is PackageUiState.Loading -> {
            // Show loading state
        }
        is PackageUiState.Error -> {
            // Show error state
        }
        else -> {
            // Handle other states
        }
    }
}

@Composable
private fun CreateEventContent(
    viewModel: CreateEventViewModel,
    onNavigateBack: () -> Unit,
    onEventCreated: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val mediaState by viewModel.mediaProcessingState.collectAsState()
    var currentStep by remember { mutableStateOf(0) }
    var showAIAssistDialog by remember { mutableStateOf(false) }
    var showSecurityCheckDialog by remember { mutableStateOf(false) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Event") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    // AI Assistant Button
                    IconButton(onClick = { showAIAssistDialog = true }) {
                        Icon(Icons.Default.AutoAwesome, "AI Assistant")
                    }
                    // Security Check Button
                    IconButton(onClick = { showSecurityCheckDialog = true }) {
                        Icon(Icons.Default.Security, "Security Check")
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Progress Indicator
            StepProgressIndicator(
                currentStep = currentStep,
                totalSteps = 5,
                labels = listOf("Basic Info", "Media", "Details", "Security", "Review")
            )

            // Content based on current step
            when (currentStep) {
                0 -> BasicInfoStep(
                    uiState = uiState,
                    onUpdateState = viewModel::updateEventState
                )
                1 -> MediaStep(
                    uiState = uiState,
                    mediaState = mediaState,
                    onAddImages = viewModel::processEventImages,
                    onAddVideo = viewModel::processEventVideo
                )
                2 -> DetailsStep(
                    uiState = uiState,
                    onUpdateState = viewModel::updateEventState,
                    onGenerateDescription = viewModel::generateDescription
                )
                3 -> SecurityStep(
                    uiState = uiState,
                    onUpdateState = viewModel::updateEventState,
                    onVerifyEvent = viewModel::getOptimizations
                )
                4 -> ReviewStep(
                    uiState = uiState,
                    onCreateEvent = viewModel::createEvent
                )
            }

            // Navigation Buttons
            Row(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(16.dp),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                if (currentStep > 0) {
                    Button(onClick = { currentStep-- }) {
                        Text("Previous")
                    }
                }
                if (currentStep < 4) {
                    Button(onClick = { currentStep++ }) {
                        Text("Next")
                    }
                }
            }
        }

        // AI Assistant Dialog
        if (showAIAssistDialog) {
            AIAssistantDialog(
                onDismiss = { showAIAssistDialog = false },
                onGenerateContent = {
                    viewModel.autoGenerateEvent()
                    showAIAssistDialog = false
                }
            )
        }

        // Security Check Dialog
        if (showSecurityCheckDialog) {
            SecurityCheckDialog(
                uiState = uiState,
                onDismiss = { showSecurityCheckDialog = false }
            )
        }
    }
}

@Composable
private fun BasicInfoStep(
    uiState: CreateEventUiState,
    onUpdateState: (CreateEventUiState) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Event Type Selection
        ExposedDropdownMenuBox(
            expanded = false,
            onExpandedChange = { }
        ) {
            OutlinedTextField(
                value = uiState.eventType.name,
                onValueChange = { },
                readOnly = true,
                label = { Text("Event Type") },
                modifier = Modifier.fillMaxWidth()
            )
            ExposedDropdownMenu(
                expanded = false,
                onDismissRequest = { }
            ) {
                EventType.values().forEach { type ->
                    DropdownMenuItem(
                        text = { Text(type.name) },
                        onClick = {
                            onUpdateState(uiState.copy(eventType = type))
                        }
                    )
                }
            }
        }

        Spacer(modifier = Modifier.height(16.dp))

        // Title
        OutlinedTextField(
            value = uiState.title,
            onValueChange = { onUpdateState(uiState.copy(title = it)) },
            label = { Text("Title") },
            modifier = Modifier.fillMaxWidth()
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Category
        OutlinedTextField(
            value = uiState.category,
            onValueChange = { onUpdateState(uiState.copy(category = it)) },
            label = { Text("Category") },
            modifier = Modifier.fillMaxWidth()
        )
    }
}

@Composable
private fun MediaStep(
    uiState: CreateEventUiState,
    mediaState: MediaProcessingState,
    onAddImages: (List<String>) -> Unit,
    onAddVideo: (String) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Media Grid
        MediaGrid(
            images = uiState.media.images,
            onAddImage = { /* Handle image selection */ },
            onRemoveImage = { /* Handle image removal */ }
        )

        Spacer(modifier = Modifier.height(16.dp))

        // Video Section
        if (uiState.media.reels.isNotEmpty()) {
            // Show video preview
            AsyncImage(
                model = uiState.media.thumbnails.firstOrNull(),
                contentDescription = "Video Thumbnail",
                modifier = Modifier
                    .fillMaxWidth()
                    .height(200.dp),
                contentScale = ContentScale.Crop
            )
        } else {
            // Upload video button
            OutlinedButton(
                onClick = { /* Handle video selection */ },
                modifier = Modifier.fillMaxWidth()
            ) {
                Icon(Icons.Default.VideoLibrary, contentDescription = null)
                Spacer(modifier = Modifier.width(8.dp))
                Text("Add Video")
            }
        }

        // Processing State
        when (mediaState) {
            is MediaProcessingState.Loading -> {
                LinearProgressIndicator(modifier = Modifier.fillMaxWidth())
            }
            is MediaProcessingState.Error -> {
                Text(
                    text = mediaState.message,
                    color = MaterialTheme.colorScheme.error
                )
            }
            else -> { /* Handle other states */ }
        }
    }
}

@Composable
private fun DetailsStep(
    uiState: CreateEventUiState,
    onUpdateState: (CreateEventUiState) -> Unit,
    onGenerateDescription: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Description with AI generation
        OutlinedTextField(
            value = uiState.description,
            onValueChange = { onUpdateState(uiState.copy(description = it)) },
            label = { Text("Description") },
            modifier = Modifier.fillMaxWidth(),
            minLines = 3,
            maxLines = 5
        )
        TextButton(
            onClick = onGenerateDescription,
            modifier = Modifier.align(Alignment.End)
        ) {
            Icon(Icons.Default.AutoAwesome, contentDescription = null)
            Spacer(modifier = Modifier.width(8.dp))
            Text("Generate Description")
        }

        // Other details (date, location, capacity, etc.)
        // ...
    }
}

@Composable
private fun SecurityStep(
    uiState: CreateEventUiState,
    onUpdateState: (CreateEventUiState) -> Unit,
    onVerifyEvent: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Security verification status
        Card(
            modifier = Modifier.fillMaxWidth(),
            colors = CardDefaults.cardColors(
                containerColor = MaterialTheme.colorScheme.secondaryContainer
            )
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Security Verification",
                    style = MaterialTheme.typography.titleMedium
                )
                Spacer(modifier = Modifier.height(8.dp))
                
                // Display security warnings if any
                uiState.media.contentWarnings?.forEach { warning ->
                    SecurityWarningItem(warning = warning)
                    Spacer(modifier = Modifier.height(4.dp))
                }

                Button(
                    onClick = onVerifyEvent,
                    modifier = Modifier.align(Alignment.End)
                ) {
                    Icon(Icons.Default.Security, contentDescription = null)
                    Spacer(modifier = Modifier.width(8.dp))
                    Text("Verify Event")
                }
            }
        }
    }
}

@Composable
private fun ReviewStep(
    uiState: CreateEventUiState,
    onCreateEvent: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        // Display all event details for review
        Card(
            modifier = Modifier.fillMaxWidth()
        ) {
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = "Event Summary",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                // Basic Info
                Text("Type: ${uiState.eventType}")
                Text("Title: ${uiState.title}")
                Text("Category: ${uiState.category}")
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Media Summary
                Text("Images: ${uiState.media.images.size}")
                Text("Videos: ${uiState.media.reels.size}")
                
                Spacer(modifier = Modifier.height(8.dp))
                
                // Security Status
                if (uiState.media.contentWarnings?.isEmpty() == true) {
                    Text("✅ No security warnings")
                } else {
                    Text("⚠️ Has security warnings")
                }
                
                Spacer(modifier = Modifier.height(16.dp))
                
                // Create Button
                Button(
                    onClick = onCreateEvent,
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Create Event")
                }
            }
        }
    }
}

@Composable
private fun AIAssistantDialog(
    onDismiss: () -> Unit,
    onGenerateContent: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AI Assistant") },
        text = {
            Text("Would you like the AI to help generate event content? This will include:")
            Column {
                Text("• Optimized description")
                Text("• SEO tags")
                Text("• Suggested hashtags")
                Text("• Content recommendations")
            }
        },
        confirmButton = {
            Button(onClick = onGenerateContent) {
                Text("Generate")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun SecurityCheckDialog(
    uiState: CreateEventUiState,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Security Check") },
        text = {
            Column {
                Text("Content Warnings: ${uiState.media.contentWarnings?.size ?: 0}")
                Text("Spam Score: ${uiState.spamScore}")
                if (uiState.isSpam) {
                    Text(
                        "⚠️ This content has been flagged as potential spam",
                        color = MaterialTheme.colorScheme.error
                    )
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