package com.example.ibcmserver_init.data.repository

import android.location.Location

interface LocationRepository {
    suspend fun getCurrentLocation(): Location?
    
    fun getLastKnownLocation(): Location?
    
    fun startLocationUpdates()
    
    fun stopLocationUpdates()
    
    suspend fun requestLocationPermission(): Boolean
} 