package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.event.*
import com.example.ibcmserver_init.ui.components.LoadingDialog
import com.example.ibcmserver_init.ui.viewmodel.EnhancedEventViewModel
import com.example.ibcmserver_init.utils.NetworkResult
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EnhancedEventCreationScreen(
    viewModel: EnhancedEventViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    var title by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var category by remember { mutableStateOf("") }
    var selectedEventType by remember { mutableStateOf<EventType?>(null) }
    var showEventTypeDialog by remember { mutableStateOf(false) }

    val eventCreationState by viewModel.eventCreationState.collectAsState()

    LaunchedEffect(eventCreationState) {
        when (eventCreationState) {
            is NetworkResult.Success -> {
                onNavigateBack()
            }
            else -> {}
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Create Event") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(
                            imageVector = Icons.Default.ArrowBack,
                            contentDescription = "Back"
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
                .verticalScroll(rememberScrollState())
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Basic event details
            OutlinedTextField(
                value = title,
                onValueChange = { title = it },
                label = { Text("Event Title") },
                modifier = Modifier.fillMaxWidth()
            )

            OutlinedTextField(
                value = description,
                onValueChange = { description = it },
                label = { Text("Description") },
                modifier = Modifier.fillMaxWidth(),
                minLines = 3
            )

            OutlinedTextField(
                value = category,
                onValueChange = { category = it },
                label = { Text("Category") },
                modifier = Modifier.fillMaxWidth()
            )

            // Event type selection
            Button(
                onClick = { showEventTypeDialog = true },
                modifier = Modifier.fillMaxWidth()
            ) {
                Text(selectedEventType?.let {
                    when (it) {
                        is EventType.TicketEvent -> "Ticket Event"
                        is EventType.ServiceEvent -> "Service Event"
                        is EventType.ProductEvent -> "Product Event"
                    }
                } ?: "Select Event Type")
            }

            when (selectedEventType) {
                is EventType.TicketEvent -> TicketEventForm(
                    onTicketTypeCreated = { ticketType ->
                        // Handle ticket type creation
                    }
                )
                is EventType.ServiceEvent -> ServiceEventForm(
                    onServiceDetailsCreated = { serviceDetails ->
                        // Handle service details creation
                    }
                )
                is EventType.ProductEvent -> ProductEventForm(
                    onProductCreated = { product ->
                        // Handle product creation
                    }
                )
                null -> {}
            }

            Spacer(modifier = Modifier.height(16.dp))

            Button(
                onClick = {
                    val event = EnhancedEvent(
                        id = "",
                        title = title,
                        description = description,
                        category = category,
                        eventType = selectedEventType ?: return@Button,
                        startDateTime = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME),
                        endDateTime = LocalDateTime.now().plusHours(2)
                            .format(DateTimeFormatter.ISO_DATE_TIME),
                        location = Location(
                            address = "",
                            latitude = 0.0,
                            longitude = 0.0,
                            city = "",
                            state = "",
                            country = "",
                            postalCode = ""
                        ),
                        creatorId = "", // Set from user session
                        status = EventStatus.DRAFT,
                        visibility = EventVisibility.PRIVATE,
                        pricing = PricingDetails(
                            currency = "USD",
                            basePrice = 0.0
                        ),
                        media = emptyList(),
                        tags = emptyList(),
                        metadata = EventMetadata(
                            createdAt = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME),
                            updatedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
                        )
                    )
                    viewModel.createEvent(event)
                },
                modifier = Modifier.fillMaxWidth(),
                enabled = title.isNotBlank() && description.isNotBlank() &&
                        category.isNotBlank() && selectedEventType != null
            ) {
                Text("Create Event")
            }
        }

        if (showEventTypeDialog) {
            EventTypeSelectionDialog(
                onDismiss = { showEventTypeDialog = false },
                onEventTypeSelected = {
                    selectedEventType = it
                    showEventTypeDialog = false
                }
            )
        }

        when (eventCreationState) {
            is NetworkResult.Loading -> {
                LoadingDialog()
            }
            is NetworkResult.Error -> {
                val error = (eventCreationState as NetworkResult.Error).message
                AlertDialog(
                    onDismissRequest = { viewModel.resetStates() },
                    title = { Text("Error") },
                    text = { Text(error) },
                    confirmButton = {
                        TextButton(onClick = { viewModel.resetStates() }) {
                            Text("OK")
                        }
                    }
                )
            }
            else -> {}
        }
    }
}

@Composable
fun EventTypeSelectionDialog(
    onDismiss: () -> Unit,
    onEventTypeSelected: (EventType) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Event Type") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Button(
                    onClick = {
                        onEventTypeSelected(
                            EventType.TicketEvent(
                                ticketTypes = emptyList(),
                                venue = Venue(
                                    id = "",
                                    name = "",
                                    address = "",
                                    capacity = 0,
                                    facilities = emptyList()
                                )
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Ticket Event")
                }

                Button(
                    onClick = {
                        onEventTypeSelected(
                            EventType.ServiceEvent(
                                serviceDetails = ServiceDetails(
                                    duration = 60,
                                    maxParticipants = 1,
                                    requirements = emptyList(),
                                    cancellationPolicy = ""
                                ),
                                availability = emptyList(),
                                provider = ServiceProvider(
                                    id = "",
                                    name = "",
                                    specialization = "",
                                    rating = 0.0,
                                    experience = 0,
                                    certifications = emptyList()
                                )
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Service Event")
                }

                Button(
                    onClick = {
                        onEventTypeSelected(
                            EventType.ProductEvent(
                                products = emptyList(),
                                catalog = Catalog(
                                    id = "",
                                    name = "",
                                    categories = emptyList(),
                                    featuredProducts = emptyList(),
                                    lastUpdated = LocalDateTime.now()
                                        .format(DateTimeFormatter.ISO_DATE_TIME)
                                ),
                                deliveryOptions = emptyList()
                            )
                        )
                    },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Product Event")
                }
            }
        },
        confirmButton = {},
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 