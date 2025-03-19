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

    // AI-powered states
    val eventSuggestionState by viewModel.eventSuggestionState.collectAsState()
    val eventOptimizationState by viewModel.eventOptimizationState.collectAsState()
    val eventAnalyticsState by viewModel.eventAnalyticsState.collectAsState()
    val marketingMaterialsState by viewModel.marketingMaterialsState.collectAsState()

    var showAIAssistantDialog by remember { mutableStateOf(false) }
    var showOptimizationDialog by remember { mutableStateOf(false) }
    var showMarketingDialog by remember { mutableStateOf(false) }

    var showImagePicker by remember { mutableStateOf(false) }
    var showDocumentPicker by remember { mutableStateOf(false) }

    var categories by remember { mutableStateOf<List<String>>(emptyList()) }
    var featuredProducts by remember { mutableStateOf<List<Product>>(emptyList()) }
    var selectedImages by remember { mutableStateOf<List<ImageContent>>(emptyList()) }
    var selectedDocuments by remember { mutableStateOf<List<DocumentContent>>(emptyList()) }

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
                },
                actions = {
                    // AI Assistant button
                    IconButton(onClick = { showAIAssistantDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Assistant,
                            contentDescription = "AI Assistant"
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

            // Catalog Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Event Catalog",
                        style = MaterialTheme.typography.titleMedium
                    )

                    // Categories
                    OutlinedTextField(
                        value = categories.joinToString(", "),
                        onValueChange = { input ->
                            categories = input.split(",").map { it.trim() }.filter { it.isNotEmpty() }
                        },
                        label = { Text("Categories (comma-separated)") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    // Featured Products
                    if (selectedEventType is EventType.ProductEvent) {
                        Text(
                            text = "Featured Products",
                            style = MaterialTheme.typography.titleSmall
                        )
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            items(featuredProducts) { product ->
                                FeaturedProductChip(
                                    product = product,
                                    onRemove = { featuredProducts = featuredProducts - product }
                                )
                            }
                        }
                    }
                }
            }

            // Media Upload Section
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "Event Media",
                        style = MaterialTheme.typography.titleMedium
                    )

                    // Images
                    Button(
                        onClick = { showImagePicker = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Add Images")
                    }

                    if (selectedImages.isNotEmpty()) {
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp),
                            contentPadding = PaddingValues(vertical = 8.dp)
                        ) {
                            items(selectedImages) { image ->
                                ImagePreview(
                                    image = image,
                                    onRemove = { selectedImages = selectedImages - image }
                                )
                            }
                        }
                    }

                    // Documents
                    Button(
                        onClick = { showDocumentPicker = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Add Documents")
                    }

                    if (selectedDocuments.isNotEmpty()) {
                        LazyColumn(
                            verticalArrangement = Arrangement.spacedBy(4.dp)
                        ) {
                            items(selectedDocuments) { document ->
                                DocumentPreview(
                                    document = document,
                                    onRemove = { selectedDocuments = selectedDocuments - document }
                                )
                            }
                        }
                    }
                }
            }

            // AI Assistant Card
            Card(
                modifier = Modifier.fillMaxWidth(),
                elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
            ) {
                Column(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    verticalArrangement = Arrangement.spacedBy(8.dp)
                ) {
                    Text(
                        text = "AI-Powered Features",
                        style = MaterialTheme.typography.titleMedium
                    )
                    
                    Button(
                        onClick = { showAIAssistantDialog = true },
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Get Event Suggestions")
                    }

                    Button(
                        onClick = { showOptimizationDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedEventType != null
                    ) {
                        Text("Optimize Event Settings")
                    }

                    Button(
                        onClick = { showMarketingDialog = true },
                        modifier = Modifier.fillMaxWidth(),
                        enabled = selectedEventType != null
                    ) {
                        Text("Generate Marketing Materials")
                    }
                }
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
                        catalog = if (selectedEventType is EventType.ProductEvent) {
                            Catalog(
                                id = "",
                                name = title,
                                categories = categories,
                                featuredProducts = featuredProducts.map { it.id },
                                lastUpdated = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
                            )
                        } else null,
                        media = selectedImages.map { MediaContent(
                            id = "",
                            url = it.uri.toString(),
                            type = "image",
                            description = ""
                        ) },
                        documents = selectedDocuments.map { Document(
                            id = "",
                            name = it.name,
                            url = it.uri.toString(),
                            type = it.type,
                            uploadedAt = LocalDateTime.now().format(DateTimeFormatter.ISO_DATE_TIME)
                        ) },
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

        // AI Assistant Dialog
        if (showAIAssistantDialog) {
            AIAssistantDialog(
                onDismiss = { showAIAssistantDialog = false },
                onGenerateSuggestion = { basicInfo ->
                    viewModel.generateEventSuggestion(basicInfo)
                },
                suggestionState = eventSuggestionState
            )
        }

        // Optimization Dialog
        if (showOptimizationDialog) {
            OptimizationDialog(
                onDismiss = { showOptimizationDialog = false },
                onOptimize = { eventId ->
                    viewModel.optimizeEvent(eventId)
                },
                optimizationState = eventOptimizationState
            )
        }

        // Marketing Materials Dialog
        if (showMarketingDialog) {
            MarketingMaterialsDialog(
                onDismiss = { showMarketingDialog = false },
                onGenerate = { eventId ->
                    viewModel.generateMarketingMaterials(eventId)
                },
                marketingState = marketingMaterialsState
            )
        }

        // Image Picker Dialog
        if (showImagePicker) {
            ImagePickerDialog(
                onDismiss = { showImagePicker = false },
                onImagesSelected = { images ->
                    selectedImages = selectedImages + images
                    showImagePicker = false
                }
            )
        }

        // Document Picker Dialog
        if (showDocumentPicker) {
            DocumentPickerDialog(
                onDismiss = { showDocumentPicker = false },
                onDocumentsSelected = { documents ->
                    selectedDocuments = selectedDocuments + documents
                    showDocumentPicker = false
                }
            )
        }

        // Loading states
        when {
            eventSuggestionState is NetworkResult.Loading -> LoadingDialog(message = "Generating event suggestions...")
            eventOptimizationState is NetworkResult.Loading -> LoadingDialog(message = "Optimizing event settings...")
            marketingMaterialsState is NetworkResult.Loading -> LoadingDialog(message = "Generating marketing materials...")
        }

        // Error states
        listOf(
            eventSuggestionState,
            eventOptimizationState,
            marketingMaterialsState
        ).forEach { state ->
            if (state is NetworkResult.Error) {
                AlertDialog(
                    onDismissRequest = { viewModel.resetStates() },
                    title = { Text("Error") },
                    text = { Text(state.message) },
                    confirmButton = {
                        TextButton(onClick = { viewModel.resetStates() }) {
                            Text("OK")
                        }
                    }
                )
            }
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

@Composable
fun AIAssistantDialog(
    onDismiss: () -> Unit,
    onGenerateSuggestion: (EventBasicInfo) -> Unit,
    suggestionState: NetworkResult<EnhancedEvent>
) {
    var title by remember { mutableStateOf("") }
    var eventType by remember { mutableStateOf("") }
    var expectedAttendance by remember { mutableStateOf("") }
    var budget by remember { mutableStateOf("") }
    var targetAudience by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AI Event Assistant") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = title,
                    onValueChange = { title = it },
                    label = { Text("Event Title") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = eventType,
                    onValueChange = { eventType = it },
                    label = { Text("Event Type") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = expectedAttendance,
                    onValueChange = { expectedAttendance = it },
                    label = { Text("Expected Attendance") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = budget,
                    onValueChange = { budget = it },
                    label = { Text("Budget (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = targetAudience,
                    onValueChange = { targetAudience = it },
                    label = { Text("Target Audience (Optional)") },
                    modifier = Modifier.fillMaxWidth()
                )

                when (suggestionState) {
                    is NetworkResult.Success -> {
                        Text(
                            text = "Suggestion generated successfully!",
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.primary
                        )
                    }
                    is NetworkResult.Error -> {
                        Text(
                            text = suggestionState.message,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    else -> {}
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val basicInfo = EventBasicInfo(
                        eventType = eventType,
                        title = title,
                        expectedAttendance = expectedAttendance.toIntOrNull() ?: 0,
                        preferences = EventPreferences(
                            budget = budget.toDoubleOrNull(),
                            targetAudience = targetAudience.takeIf { it.isNotBlank() }
                        )
                    )
                    onGenerateSuggestion(basicInfo)
                },
                enabled = title.isNotBlank() && eventType.isNotBlank() &&
                        expectedAttendance.toIntOrNull() != null
            ) {
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
fun OptimizationDialog(
    onDismiss: () -> Unit,
    onOptimize: (String) -> Unit,
    optimizationState: NetworkResult<EventOptimization>
) {
    var eventId by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Optimize Event") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = eventId,
                    onValueChange = { eventId = it },
                    label = { Text("Event ID") },
                    modifier = Modifier.fillMaxWidth()
                )

                when (optimizationState) {
                    is NetworkResult.Success -> {
                        val optimization = optimizationState.data
                        Column {
                            Text(
                                text = "Optimization Suggestions:",
                                style = MaterialTheme.typography.titleSmall
                            )
                            optimization.recommendations.forEach { recommendation ->
                                Text(
                                    text = "• ${recommendation.description}",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                            }
                        }
                    }
                    is NetworkResult.Error -> {
                        Text(
                            text = optimizationState.message,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    else -> {}
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onOptimize(eventId) },
                enabled = eventId.isNotBlank()
            ) {
                Text("Optimize")
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
fun MarketingMaterialsDialog(
    onDismiss: () -> Unit,
    onGenerate: (String) -> Unit,
    marketingState: NetworkResult<MarketingMaterials>
) {
    var eventId by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Generate Marketing Materials") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = eventId,
                    onValueChange = { eventId = it },
                    label = { Text("Event ID") },
                    modifier = Modifier.fillMaxWidth()
                )

                when (marketingState) {
                    is NetworkResult.Success -> {
                        val materials = marketingState.data
                        Column {
                            Text(
                                text = "Generated Materials:",
                                style = MaterialTheme.typography.titleSmall
                            )
                            Text("Social Media Posts: ${materials.socialMedia.posts.size}")
                            Text("Email Templates: ${materials.emailCampaign.templates.size}")
                            Text("Promotional Offers: ${materials.promotionalOffers.size}")
                        }
                    }
                    is NetworkResult.Error -> {
                        Text(
                            text = marketingState.message,
                            style = MaterialTheme.typography.bodyMedium,
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                    else -> {}
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onGenerate(eventId) },
                enabled = eventId.isNotBlank()
            ) {
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
private fun FeaturedProductChip(
    product: Product,
    onRemove: () -> Unit
) {
    FilterChip(
        selected = true,
        onClick = {},
        label = { Text(product.name) },
        trailingIcon = {
            IconButton(onClick = onRemove) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove"
                )
            }
        }
    )
}

@Composable
private fun ImagePreview(
    image: ImageContent,
    onRemove: () -> Unit
) {
    Box(
        modifier = Modifier
            .size(80.dp)
            .clip(MaterialTheme.shapes.small)
    ) {
        AsyncImage(
            model = image.uri,
            contentDescription = null,
            modifier = Modifier.fillMaxSize(),
            contentScale = ContentScale.Crop
        )
        IconButton(
            onClick = onRemove,
            modifier = Modifier.align(Alignment.TopEnd)
        ) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Remove",
                tint = MaterialTheme.colorScheme.onSurface
            )
        }
    }
}

@Composable
private fun DocumentPreview(
    document: DocumentContent,
    onRemove: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        horizontalArrangement = Arrangement.SpaceBetween,
        verticalAlignment = Alignment.CenterVertically
    ) {
        Row(
            horizontalArrangement = Arrangement.spacedBy(8.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(
                imageVector = when (document.type) {
                    "pdf" -> Icons.Default.PictureAsPdf
                    "doc" -> Icons.Default.Description
                    else -> Icons.Default.InsertDriveFile
                },
                contentDescription = document.type,
                tint = MaterialTheme.colorScheme.primary
            )
            Text(
                text = document.name,
                style = MaterialTheme.typography.bodyMedium
            )
        }
        IconButton(onClick = onRemove) {
            Icon(
                imageVector = Icons.Default.Close,
                contentDescription = "Remove"
            )
        }
    }
} 