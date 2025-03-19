package com.example.ibcmserver_init.ui.components

import androidx.compose.foundation.layout.fillMaxWidth
import androidx.compose.foundation.layout.height
import androidx.compose.runtime.Composable
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.google.android.gms.maps.model.CameraPosition
import com.google.android.gms.maps.model.LatLng
import com.google.maps.android.compose.GoogleMap
import com.google.maps.android.compose.Marker
import com.google.maps.android.compose.MarkerState
import com.google.maps.android.compose.rememberCameraPositionState

@Composable
fun MapPreview(
    location: LatLng,
    title: String,
    modifier: Modifier = Modifier,
    onMapClick: () -> Unit = {}
) {
    val cameraPositionState = rememberCameraPositionState {
        position = CameraPosition.fromLatLngZoom(location, 15f)
    }

    GoogleMap(
        modifier = modifier
            .fillMaxWidth()
            .height(200.dp),
        cameraPositionState = cameraPositionState,
        onMapClick = { onMapClick() }
    ) {
        Marker(
            state = MarkerState(position = location),
            title = title
        )
    }
} 