package com.example.ibcmserver_init.ui.screens.event

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.layout.ContentScale
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.text.input.KeyboardType
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.*
import com.google.android.gms.maps.model.LatLng
import com.maxkeppeker.sheets.core.models.base.rememberSheetState
import com.maxkeppeler.sheets.calendar.CalendarDialog
import com.maxkeppeler.sheets.calendar.models.CalendarConfig
import com.maxkeppeler.sheets.calendar.models.CalendarSelection
import com.maxkeppeler.sheets.clock.ClockDialog
import com.maxkeppeler.sheets.clock.models.ClockSelection
import java.text.SimpleDateFormat
import java.util.*
import com.example.ibcmserver_init.ui.components.MapPreview

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun EventFormScreen(
    viewModel: EventFormViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val context = LocalContext.current

    val calendarState = rememberSheetState()
    val timeState = rememberSheetState()

    val imagePickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris: List<Uri> ->
        viewModel.onImagesSelected(uris)
    }

    val videoPickerLauncher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetContent()
    ) { uri: Uri? ->
        uri?.let { viewModel.onVideoSelected(it) }
    }

    BackHandler(enabled = uiState.isPreviewMode) {
        viewModel.togglePreviewMode()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(if (uiState.isEditing) "Edit Event" else "Create Event") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, "Back")
                    }
                },
                actions = {
                    if (uiState.isDraft) {
                        TextButton(onClick = { viewModel.clearDraft() }) {
                            Text("CLEAR DRAFT")
                        }
                    }
                    IconButton(onClick = { viewModel.togglePreviewMode() }) {
                        Icon(
                            if (uiState.isPreviewMode) Icons.Default.Edit else Icons.Default.Preview,
                            contentDescription = if (uiState.isPreviewMode) "Edit" else "Preview"
                        )
                    }
                    TextButton(
                        onClick = { 
                            viewModel.validateForm()
                            if (uiState.isValid) {
                                viewModel.saveEvent()
                                onNavigateBack()
                            }
                        }
                    ) {
                        Text("SAVE")
                    }
                }
            )
        }
    ) { padding ->
        if (uiState.isPreviewMode) {
            EventPreview(
                event = viewModel.createEventFromState(),
                modifier = Modifier.padding(padding)
            )
        } else {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(padding)
                    .verticalScroll(rememberScrollState())
            ) {
                // Images Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Event Images",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        Row(
                            modifier = Modifier
                                .horizontalScroll(rememberScrollState())
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(100.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable { imagePickerLauncher.launch("image/*") },
                                contentAlignment = Alignment.Center
                            ) {
                                Icon(Icons.Default.Add, "Add Image")
                            }
                            
                            uiState.images.forEach { imageUrl ->
                                AsyncImage(
                                    model = imageUrl,
                                    contentDescription = null,
                                    modifier = Modifier
                                        .size(100.dp)
                                        .clip(RoundedCornerShape(8.dp)),
                                    contentScale = ContentScale.Crop
                                )
                            }
                        }
                    }
                }

                // Basic Info Section with validation
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Basic Information",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = uiState.title,
                            onValueChange = { viewModel.onTitleChanged(it) },
                            label = { Text("Event Title") },
                            modifier = Modifier.fillMaxWidth(),
                            isError = uiState.validationErrors.containsKey("title"),
                            supportingText = {
                                uiState.validationErrors["title"]?.let { error ->
                                    Text(error, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        )
                        
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = uiState.description,
                            onValueChange = { viewModel.onDescriptionChanged(it) },
                            label = { Text("Description") },
                            modifier = Modifier.fillMaxWidth(),
                            minLines = 3,
                            isError = uiState.validationErrors.containsKey("description"),
                            supportingText = {
                                uiState.validationErrors["description"]?.let { error ->
                                    Text(error, color = MaterialTheme.colorScheme.error)
                                }
                            }
                        )
                    }
                }

                // Category Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Category",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        ExposedDropdownMenuBox(
                            expanded = uiState.isCategoryDropdownExpanded,
                            onExpandedChange = { viewModel.onCategoryDropdownExpandedChanged(it) }
                        ) {
                            OutlinedTextField(
                                value = uiState.category,
                                onValueChange = {},
                                readOnly = true,
                                trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = uiState.isCategoryDropdownExpanded) },
                                modifier = Modifier.fillMaxWidth()
                            )
                            ExposedDropdownMenu(
                                expanded = uiState.isCategoryDropdownExpanded,
                                onDismissRequest = { viewModel.onCategoryDropdownExpandedChanged(false) }
                            ) {
                                uiState.availableCategories.forEach { category ->
                                    DropdownMenuItem(
                                        text = { Text(category) },
                                        onClick = {
                                            viewModel.onCategorySelected(category)
                                            viewModel.onCategoryDropdownExpandedChanged(false)
                                        }
                                    )
                                }
                            }
                        }
                    }
                }

                // Date & Time Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Date & Time",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.SpaceBetween
                        ) {
                            OutlinedButton(
                                onClick = { calendarState.show() },
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.CalendarToday, null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(SimpleDateFormat("MMM dd, yyyy", Locale.getDefault())
                                    .format(uiState.date))
                            }
                            
                            Spacer(modifier = Modifier.width(16.dp))
                            
                            OutlinedButton(
                                onClick = { timeState.show() },
                                modifier = Modifier.weight(1f)
                            ) {
                                Icon(Icons.Default.Schedule, null)
                                Spacer(modifier = Modifier.width(8.dp))
                                Text(SimpleDateFormat("HH:mm", Locale.getDefault())
                                    .format(uiState.date))
                            }
                        }
                    }
                }

                // Location Section with Autocomplete
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Location",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        ExposedDropdownMenuBox(
                            expanded = uiState.isLocationDropdownExpanded,
                            onExpandedChange = { viewModel.onLocationDropdownExpandedChanged(it) }
                        ) {
                            OutlinedTextField(
                                value = uiState.location.address,
                                onValueChange = { viewModel.onLocationChanged(it) },
                                label = { Text("Address") },
                                modifier = Modifier.fillMaxWidth(),
                                isError = uiState.validationErrors.containsKey("location"),
                                supportingText = {
                                    uiState.validationErrors["location"]?.let { error ->
                                        Text(error, color = MaterialTheme.colorScheme.error)
                                    }
                                }
                            )
                            
                            if (uiState.locationSuggestions.isNotEmpty()) {
                                ExposedDropdownMenu(
                                    expanded = uiState.isLocationDropdownExpanded,
                                    onDismissRequest = { viewModel.onLocationDropdownExpandedChanged(false) }
                                ) {
                                    uiState.locationSuggestions.forEach { prediction ->
                                        DropdownMenuItem(
                                            text = { Text(prediction.getFullText(null).toString()) },
                                            onClick = {
                                                viewModel.onLocationSelected(prediction)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Price Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Price",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        Row(
                            modifier = Modifier.fillMaxWidth(),
                            horizontalArrangement = Arrangement.spacedBy(16.dp)
                        ) {
                            OutlinedTextField(
                                value = uiState.price.amount.toString(),
                                onValueChange = { viewModel.onPriceChanged(it.toFloatOrNull() ?: 0f) },
                                label = { Text("Amount") },
                                keyboardType = KeyboardType.Decimal,
                                modifier = Modifier.weight(1f)
                            )
                            
                            ExposedDropdownMenuBox(
                                expanded = uiState.isCurrencyDropdownExpanded,
                                onExpandedChange = { viewModel.onCurrencyDropdownExpandedChanged(it) },
                                modifier = Modifier.weight(1f)
                            ) {
                                OutlinedTextField(
                                    value = uiState.price.currency,
                                    onValueChange = {},
                                    readOnly = true,
                                    label = { Text("Currency") },
                                    trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = uiState.isCurrencyDropdownExpanded) }
                                )
                                ExposedDropdownMenu(
                                    expanded = uiState.isCurrencyDropdownExpanded,
                                    onDismissRequest = { viewModel.onCurrencyDropdownExpandedChanged(false) }
                                ) {
                                    uiState.availableCurrencies.forEach { currency ->
                                        DropdownMenuItem(
                                            text = { Text(currency) },
                                            onClick = {
                                                viewModel.onCurrencySelected(currency)
                                                viewModel.onCurrencyDropdownExpandedChanged(false)
                                            }
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                // Capacity Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Capacity",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(16.dp))
                        
                        OutlinedTextField(
                            value = uiState.capacity.maxAttendees.toString(),
                            onValueChange = { viewModel.onCapacityChanged(it.toIntOrNull() ?: 0) },
                            label = { Text("Maximum Attendees") },
                            keyboardType = KeyboardType.Number,
                            modifier = Modifier.fillMaxWidth()
                        )
                    }
                }

                // Video Reels Section
                Card(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(horizontal = 16.dp, vertical = 8.dp)
                ) {
                    Column(modifier = Modifier.padding(16.dp)) {
                        Text(
                            text = "Video Reels",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        
                        Row(
                            modifier = Modifier
                                .horizontalScroll(rememberScrollState())
                                .padding(vertical = 8.dp),
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            Box(
                                modifier = Modifier
                                    .size(120.dp, 200.dp)
                                    .clip(RoundedCornerShape(8.dp))
                                    .background(MaterialTheme.colorScheme.surfaceVariant)
                                    .clickable { videoPickerLauncher.launch("video/*") },
                                contentAlignment = Alignment.Center
                            ) {
                                Column(horizontalAlignment = Alignment.CenterHorizontally) {
                                    Icon(Icons.Default.VideoLibrary, "Add Video")
                                    Text("Add Reel", style = MaterialTheme.typography.labelMedium)
                                }
                            }
                            
                            uiState.reels.forEach { reel ->
                                Box(
                                    modifier = Modifier
                                        .size(120.dp, 200.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                ) {
                                    AsyncImage(
                                        model = reel.thumbnailUrl,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                    IconButton(
                                        onClick = { viewModel.onReelRemoved(reel.id) },
                                        modifier = Modifier.align(Alignment.TopEnd)
                                    ) {
                                        Icon(
                                            Icons.Default.Close,
                                            contentDescription = "Remove",
                                            tint = MaterialTheme.colorScheme.error
                                        )
                                    }
                                }
                            }
                        }
                    }
                }

                Spacer(modifier = Modifier.height(16.dp))
            }
        }
    }

    // Date Picker Dialog
    CalendarDialog(
        state = calendarState,
        selection = CalendarSelection.Date { date ->
            viewModel.onDateSelected(date)
        },
        config = CalendarConfig(monthSelection = true, yearSelection = true)
    )

    // Time Picker Dialog
    ClockDialog(
        state = timeState,
        selection = ClockSelection.HoursMinutes { hours, minutes ->
            viewModel.onTimeSelected(hours, minutes)
        }
    )

    // Show loading or error states
    if (uiState.isLoading) {
        Box(
            modifier = Modifier
                .fillMaxSize()
                .background(MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)),
            contentAlignment = Alignment.Center
        ) {
            CircularProgressIndicator()
        }
    }

    uiState.error?.let { error ->
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
private fun EventPreview(
    event: Event,
    modifier: Modifier = Modifier
) {
    var selectedImageIndex by remember { mutableStateOf(0) }
    var showFullScreenImage by remember { mutableStateOf(false) }
    var showFullScreenMap by remember { mutableStateOf(false) }

    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
    ) {
        // Image Gallery with Pager
        Box(
            modifier = Modifier
                .fillMaxWidth()
                .height(250.dp)
        ) {
            if (event.images.isNotEmpty()) {
                HorizontalPager(
                    count = event.images.size,
                    state = rememberPagerState { event.images.size }
                ) { page ->
                    AsyncImage(
                        model = event.images[page],
                        contentDescription = null,
                        modifier = Modifier
                            .fillMaxSize()
                            .clickable { 
                                selectedImageIndex = page
                                showFullScreenImage = true 
                            },
                        contentScale = ContentScale.Crop
                    )
                }
                
                // Image counter
                Surface(
                    modifier = Modifier
                        .padding(16.dp)
                        .align(Alignment.TopEnd),
                    shape = CircleShape,
                    color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
                ) {
                    Text(
                        text = "${selectedImageIndex + 1}/${event.images.size}",
                        modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                        style = MaterialTheme.typography.labelMedium
                    )
                }
            }
            
            Surface(
                modifier = Modifier
                    .fillMaxWidth()
                    .align(Alignment.BottomCenter),
                color = MaterialTheme.colorScheme.surface.copy(alpha = 0.8f)
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = event.title,
                        style = MaterialTheme.typography.headlineMedium
                    )
                    Text(
                        text = SimpleDateFormat("EEEE, MMM dd • HH:mm", Locale.getDefault())
                            .format(event.date),
                        style = MaterialTheme.typography.bodyLarge
                    )
                }
            }
        }

        // Event Details
        Column(
            modifier = Modifier.padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            // Status Badge
            Surface(
                color = when (event.status) {
                    EventStatus.UPCOMING -> MaterialTheme.colorScheme.primary
                    EventStatus.ONGOING -> MaterialTheme.colorScheme.secondary
                    EventStatus.COMPLETED -> MaterialTheme.colorScheme.tertiary
                    EventStatus.CANCELLED -> MaterialTheme.colorScheme.error
                },
                shape = RoundedCornerShape(16.dp),
                modifier = Modifier.padding(vertical = 8.dp)
            ) {
                Text(
                    text = event.status.name,
                    modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            }

            // Location with Map
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column {
                    MapPreview(
                        location = LatLng(event.location.latitude, event.location.longitude),
                        title = event.title,
                        onMapClick = { showFullScreenMap = true }
                    )
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(16.dp),
                        verticalAlignment = Alignment.CenterVertically,
                        horizontalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Icon(Icons.Default.LocationOn, null)
                        Column {
                            Text(event.location.address)
                            Text(
                                "${event.location.city}, ${event.location.country}",
                                style = MaterialTheme.typography.bodyMedium,
                                color = MaterialTheme.colorScheme.onSurfaceVariant
                            )
                        }
                    }
                }
            }

            // Price and Capacity Card
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Row(
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(16.dp),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.AttachMoney, null)
                        Text(
                            "${event.price.currency} ${String.format("%.2f", event.price.amount)}",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text("Price", style = MaterialTheme.typography.bodySmall)
                    }
                    
                    Divider(
                        modifier = Modifier
                            .height(32.dp)
                            .width(1.dp)
                    )
                    
                    Column(
                        horizontalAlignment = Alignment.CenterHorizontally
                    ) {
                        Icon(Icons.Default.Group, null)
                        Text(
                            "${event.capacity.maxAttendees}",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Text("Capacity", style = MaterialTheme.typography.bodySmall)
                    }
                }
            }

            // Description Card
            Card(
                modifier = Modifier.fillMaxWidth()
            ) {
                Column(
                    modifier = Modifier.padding(16.dp)
                ) {
                    Text(
                        text = "About",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Spacer(modifier = Modifier.height(8.dp))
                    Text(event.description)
                }
            }

            // Reels Preview
            if (event.reels.isNotEmpty()) {
                Card(
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Column(
                        modifier = Modifier.padding(16.dp)
                    ) {
                        Text(
                            text = "Event Reels",
                            style = MaterialTheme.typography.titleMedium
                        )
                        Spacer(modifier = Modifier.height(8.dp))
                        LazyRow(
                            horizontalArrangement = Arrangement.spacedBy(8.dp)
                        ) {
                            items(event.reels) { reel ->
                                Box(
                                    modifier = Modifier
                                        .size(120.dp, 200.dp)
                                        .clip(RoundedCornerShape(8.dp))
                                ) {
                                    AsyncImage(
                                        model = reel.thumbnailUrl,
                                        contentDescription = null,
                                        modifier = Modifier.fillMaxSize(),
                                        contentScale = ContentScale.Crop
                                    )
                                    Icon(
                                        Icons.Default.PlayCircle,
                                        contentDescription = null,
                                        modifier = Modifier
                                            .size(48.dp)
                                            .align(Alignment.Center),
                                        tint = Color.White
                                    )
                                    Surface(
                                        modifier = Modifier
                                            .align(Alignment.BottomStart)
                                            .padding(8.dp),
                                        color = Color.Black.copy(alpha = 0.6f),
                                        shape = RoundedCornerShape(4.dp)
                                    ) {
                                        Row(
                                            modifier = Modifier.padding(4.dp),
                                            horizontalArrangement = Arrangement.spacedBy(4.dp),
                                            verticalAlignment = Alignment.CenterVertically
                                        ) {
                                            Icon(
                                                Icons.Default.Favorite,
                                                contentDescription = null,
                                                modifier = Modifier.size(16.dp),
                                                tint = Color.White
                                            )
                                            Text(
                                                text = formatCount(reel.likes),
                                                color = Color.White,
                                                style = MaterialTheme.typography.labelSmall
                                            )
                                        }
                                    }
                                }
                            }
                        }
                    }
                }
            }
        }
    }

    // Full-screen image dialog
    if (showFullScreenImage) {
        Dialog(
            onDismissRequest = { showFullScreenImage = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier
                    .fillMaxSize()
                    .background(Color.Black)
            ) {
                AsyncImage(
                    model = event.images[selectedImageIndex],
                    contentDescription = null,
                    modifier = Modifier.fillMaxSize(),
                    contentScale = ContentScale.Fit
                )
                IconButton(
                    onClick = { showFullScreenImage = false },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close",
                        tint = Color.White
                    )
                }
            }
        }
    }

    // Full-screen map dialog
    if (showFullScreenMap) {
        Dialog(
            onDismissRequest = { showFullScreenMap = false },
            properties = DialogProperties(usePlatformDefaultWidth = false)
        ) {
            Box(
                modifier = Modifier.fillMaxSize()
            ) {
                MapPreview(
                    location = LatLng(event.location.latitude, event.location.longitude),
                    title = event.title,
                    modifier = Modifier.fillMaxSize()
                )
                IconButton(
                    onClick = { showFullScreenMap = false },
                    modifier = Modifier
                        .align(Alignment.TopEnd)
                        .padding(16.dp)
                ) {
                    Icon(
                        Icons.Default.Close,
                        contentDescription = "Close"
                    )
                }
            }
        }
    }
}

private fun formatCount(count: Int): String = when {
    count < 1000 -> count.toString()
    count < 1000000 -> String.format("%.1fK", count / 1000f)
    else -> String.format("%.1fM", count / 1000000f)
} 