package com.example.ibcmserver_init.data.model

import com.google.android.gms.maps.model.LatLng

data class EventMarker(
    val id: String,
    val title: String,
    val subtitle: String? = null,
    val type: String,
    val position: LatLng,
    val eventId: String
) 