package com.example.ibcmserver_init.ui.components

import androidx.compose.foundation.background
import androidx.compose.foundation.layout.*
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
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.*
import com.example.ibcmserver_init.data.model.EventMarker
import com.example.ibcmserver_init.ui.theme.IBCMTheme

@Composable
fun MapComponent(
    markers: List<EventMarker>,
    currentLocation: LatLng,
    onMarkerClick: (EventMarker) -> Unit,
    onEventClick: (String) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedMarker by remember { mutableStateOf<EventMarker?>(null) }
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(currentLocation, 15f)
    }

    Box(modifier = modifier) {
        GoogleMap(
            modifier = Modifier.fillMaxSize(),
            cameraPositionState = cameraPositionState,
            properties = MapProperties(
                mapType = MapType.NORMAL,
                isMyLocationEnabled = true,
                mapStyleOptions = MapStyleOptions("""
                    [
                        {
                            "featureType": "all",
                            "elementType": "geometry.fill",
                            "stylers": [
                                {
                                    "color": "#E8F5E9"
                                }
                            ]
                        }
                    ]
                """.trimIndent())
            ),
            uiSettings = MapUiSettings(
                zoomControlsEnabled = false,
                myLocationButtonEnabled = false
            ),
            onMapClick = { selectedMarker = null }
        ) {
            markers.forEach { marker ->
                MarkerInfoWindow(
                    state = MarkerState(position = marker.position),
                    onClick = { 
                        selectedMarker = marker
                        onMarkerClick(marker)
                        true
                    }
                ) {
                    CustomMarker(marker)
                }
            }
        }

        // Event Preview Card
        selectedMarker?.let { marker ->
            Surface(
                modifier = Modifier
                    .align(Alignment.BottomCenter)
                    .padding(16.dp)
                    .fillMaxWidth(),
                shape = RoundedCornerShape(16.dp),
                color = MaterialTheme.colorScheme.surface,
                shadowElevation = 8.dp,
            ) {
                EventPreviewCard(
                    marker = marker,
                    onEventClick = { onEventClick(marker.eventId) }
                )
            }
        }
    }
}

@Composable
private fun CustomMarker(marker: EventMarker) {
    Surface(
        shape = RoundedCornerShape(12.dp),
        color = Color.White,
        shadowElevation = 4.dp
    ) {
        Row(
            modifier = Modifier.padding(8.dp),
            verticalAlignment = Alignment.CenterVertically,
            horizontalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Box(
                modifier = Modifier
                    .size(32.dp)
                    .clip(CircleShape)
                    .background(Color(0xFF2E7D32)), // Exact green color from design
                contentAlignment = Alignment.Center
            ) {
                Icon(
                    imageVector = when (marker.type) {
                        "MUSIC" -> Icons.Default.MusicNote
                        "FOOD" -> Icons.Default.Restaurant
                        "SPORTS" -> Icons.Default.SportsBasketball
                        "CYCLING" -> Icons.Default.DirectionsBike
                        else -> Icons.Default.Event
                    },
                    contentDescription = null,
                    tint = Color.White,
                    modifier = Modifier.size(20.dp)
                )
            }
            
            Column {
                Text(
                    text = marker.title,
                    style = MaterialTheme.typography.bodyMedium
                )
                if (marker.subtitle != null) {
                    Text(
                        text = marker.subtitle,
                        style = MaterialTheme.typography.bodySmall,
                        color = MaterialTheme.colorScheme.onSurfaceVariant
                    )
                }
            }
        }
    }
}

@Composable
private fun EventPreviewCard(
    marker: EventMarker,
    onEventClick: () -> Unit
) {
    Column(
        modifier = Modifier
            .clickable(onClick = onEventClick)
            .padding(16.dp)
    ) {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = marker.title,
                    style = MaterialTheme.typography.titleMedium,
                    color = MaterialTheme.colorScheme.onSurface
                )
                Text(
                    text = marker.subtitle ?: "",
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            IconButton(onClick = onEventClick) {
                Icon(
                    imageVector = Icons.Default.ArrowForward,
                    contentDescription = "View Event Details"
                )
            }
        }
    }
} 