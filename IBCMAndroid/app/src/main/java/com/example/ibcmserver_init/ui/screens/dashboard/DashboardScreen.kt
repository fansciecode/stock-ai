package com.example.ibcmserver_init.ui.screens.dashboard

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyRow
import androidx.compose.foundation.lazy.items
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
import androidx.compose.ui.text.style.TextOverflow
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.Event
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DashboardScreen(
    onEventClick: (String) -> Unit,
    onEventCreationClick: () -> Unit,
    onEventSearchClick: () -> Unit,
    onProfileClick: () -> Unit,
    onCategoryClick: (String) -> Unit,
    onLocationClick: () -> Unit,
    onNotificationClick: () -> Unit,
    onMapMarkerClick: (String) -> Unit = onEventClick,
    viewModel: DashboardViewModel = hiltViewModel()
) {
    var currentLocation by remember { mutableStateOf("L B Nagar") }
    val events by viewModel.events.collectAsState()
    
    Scaffold(
        topBar = {
            TopAppBar(
                title = {
                    SearchBar(
                        onSearchClick = onEventSearchClick
                    )
                },
                actions = {
                    IconButton(onClick = onNotificationClick) {
                        Icon(Icons.Default.Notifications, "Notifications")
                    }
                    IconButton(onClick = onProfileClick) {
                        Icon(Icons.Default.Person, "Profile")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Location Header
            LocationHeader(
                location = currentLocation,
                onLocationClick = onLocationClick
            )
            
            // Categories with navigation
            CategoryRow(onCategoryClick = onCategoryClick)
            
            // Map with event markers
            Box(
                modifier = Modifier
                    .fillMaxWidth()
                    .height(300.dp)
            ) {
                EventMap(
                    events = events,
                    currentLocation = LatLng(17.3850, 78.4867),
                    onEventClick = onMapMarkerClick
                )
            }
            
            // Create Event Card
            CreateEventCard(
                onClick = onEventCreationClick,
                modifier = Modifier.padding(16.dp)
            )
            
            // Nearest Events
            NearestEvents(
                events = events,
                onEventClick = onEventClick
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun SearchBar(
    onSearchClick: () -> Unit
) {
    OutlinedTextField(
        value = "",
        onValueChange = { },
        placeholder = { Text("Search") },
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp),
        leadingIcon = {
            Icon(Icons.Default.Search, "Search")
        },
        enabled = false,
        colors = TextFieldDefaults.outlinedTextFieldColors(
            disabledBorderColor = MaterialTheme.colorScheme.outline.copy(alpha = 0.3f),
            disabledTextColor = MaterialTheme.colorScheme.onSurface
        ),
        shape = RoundedCornerShape(8.dp),
        singleLine = true,
        onClick = onSearchClick
    )
}

@Composable
private fun LocationHeader(
    location: String,
    onLocationClick: () -> Unit
) {
    Row(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onLocationClick)
            .padding(horizontal = 16.dp, vertical = 8.dp),
        verticalAlignment = Alignment.CenterVertically
    ) {
        Icon(
            imageVector = Icons.Default.LocationOn,
            contentDescription = "Location",
            tint = MaterialTheme.colorScheme.primary
        )
        Spacer(modifier = Modifier.width(8.dp))
        Text(
            text = location,
            style = MaterialTheme.typography.bodyMedium
        )
        Icon(
            imageVector = Icons.Default.KeyboardArrowDown,
            contentDescription = "Change location"
        )
    }
}

@Composable
private fun CategoryRow(
    onCategoryClick: (String) -> Unit
) {
    val categories = listOf(
        "Sports" to Icons.Default.SportsSoccer,
        "Food" to Icons.Default.Restaurant,
        "Travel" to Icons.Default.Flight,
        "Movies" to Icons.Default.Movie,
        "Search" to Icons.Default.Search
    )
    
    LazyRow(
        horizontalArrangement = Arrangement.spacedBy(16.dp),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(categories) { (name, icon) ->
            Column(
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Box(
                    modifier = Modifier
                        .size(48.dp)
                        .clip(CircleShape)
                        .background(MaterialTheme.colorScheme.surfaceVariant),
                    contentAlignment = Alignment.Center
                ) {
                    Icon(
                        imageVector = icon,
                        contentDescription = name,
                        tint = MaterialTheme.colorScheme.primary
                    )
                }
                Spacer(modifier = Modifier.height(4.dp))
                Text(
                    text = name,
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
}

@Composable
private fun EventMap(
    events: List<Event>,
    currentLocation: LatLng,
    onEventClick: (String) -> Unit
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(currentLocation, 12f)
    }
    
    GoogleMap(
        modifier = Modifier.fillMaxSize(),
        cameraPositionState = cameraPositionState,
        properties = MapProperties(mapType = MapType.NORMAL)
    ) {
        events.forEach { event ->
            // Add markers for each event
            Marker(
                state = MarkerState(position = LatLng(event.latitude, event.longitude)),
                title = event.title,
                snippet = event.description,
                onClick = {
                    onEventClick(event.id)
                    true
                }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun CreateEventCard(
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        onClick = onClick,
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surface
        )
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Create New event",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "Create new sports, music, cycling, etc .. with your friends",
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            FloatingActionButton(
                onClick = onClick,
                containerColor = MaterialTheme.colorScheme.primary,
                contentColor = MaterialTheme.colorScheme.onPrimary
            ) {
                Icon(Icons.Default.Add, "Create Event")
            }
        }
    }
}

@Composable
private fun NearestEvents(
    events: List<Event>,
    onEventClick: (String) -> Unit
) {
    Column(
        modifier = Modifier.padding(vertical = 16.dp)
    ) {
        Text(
            text = "Nearest Events",
            style = MaterialTheme.typography.titleLarge,
            modifier = Modifier.padding(horizontal = 16.dp)
        )
        Spacer(modifier = Modifier.height(8.dp))
        LazyRow(
            contentPadding = PaddingValues(horizontal = 16.dp),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(events) { event ->
                EventCard(
                    event = event,
                    onClick = { onEventClick(event.id) }
                )
            }
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
        Column {
            AsyncImage(
                model = event.imageUrl,
                contentDescription = null,
                modifier = Modifier
                    .fillMaxWidth()
                    .height(150.dp),
                contentScale = ContentScale.Crop
            )
            Column(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(
                    text = event.title,
                    style = MaterialTheme.typography.titleMedium,
                    maxLines = 1,
                    overflow = TextOverflow.Ellipsis
                )
                Spacer(modifier = Modifier.height(4.dp))
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    Text(
                        text = event.category,
                        style = MaterialTheme.typography.bodySmall
                    )
                    Text(
                        text = "${event.attendees.size}/${event.maxAttendees}",
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
} 