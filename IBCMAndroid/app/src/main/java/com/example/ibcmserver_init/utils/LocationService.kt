package com.example.ibcmserver_init.utils

import android.content.Context
import com.example.ibcmserver_init.data.model.Location
import com.google.android.gms.maps.model.LatLng
import com.google.android.libraries.places.api.Places
import com.google.android.libraries.places.api.model.AutocompletePrediction
import com.google.android.libraries.places.api.model.Place
import com.google.android.libraries.places.api.net.FetchPlaceRequest
import com.google.android.libraries.places.api.net.FindAutocompletePredictionsRequest
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import kotlinx.coroutines.suspendCancellableCoroutine
import kotlin.coroutines.resume
import kotlin.coroutines.resumeWithException

class LocationService(context: Context, apiKey: String) {
    
    private val placesClient = Places.createClient(context).also {
        Places.initialize(context, apiKey)
    }

    fun getAutocompleteSuggestions(query: String): Flow<List<AutocompletePrediction>> = flow {
        if (query.length < 3) {
            emit(emptyList())
            return@flow
        }

        val request = FindAutocompletePredictionsRequest.builder()
            .setQuery(query)
            .build()

        val predictions = suspendCancellableCoroutine { continuation ->
            placesClient.findAutocompletePredictions(request)
                .addOnSuccessListener { response ->
                    continuation.resume(response.autocompletePredictions)
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }

        emit(predictions)
    }

    suspend fun getPlaceDetails(placeId: String): Location {
        val placeFields = listOf(
            Place.Field.ID,
            Place.Field.NAME,
            Place.Field.ADDRESS,
            Place.Field.LAT_LNG
        )

        val request = FetchPlaceRequest.builder(placeId, placeFields).build()

        val place = suspendCancellableCoroutine { continuation ->
            placesClient.fetchPlace(request)
                .addOnSuccessListener { response ->
                    continuation.resume(response.place)
                }
                .addOnFailureListener { exception ->
                    continuation.resumeWithException(exception)
                }
        }

        return Location(
            address = place.address ?: "",
            city = extractCity(place.address),
            country = extractCountry(place.address),
            latitude = place.latLng?.latitude ?: 0.0,
            longitude = place.latLng?.longitude ?: 0.0
        )
    }

    private fun extractCity(address: String?): String {
        if (address == null) return ""
        val parts = address.split(",")
        return if (parts.size >= 2) parts[parts.size - 2].trim() else ""
    }

    private fun extractCountry(address: String?): String {
        if (address == null) return ""
        val parts = address.split(",")
        return if (parts.isNotEmpty()) parts.last().trim() else ""
    }
} 