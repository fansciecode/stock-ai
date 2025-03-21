package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.package.EventPackage
import com.example.ibcmserver_init.data.model.package.UserEventLimit
import retrofit2.http.GET
import retrofit2.http.Path

interface PackageApi {
    @GET("packages")
    suspend fun getAvailablePackages(): List<EventPackage>

    @GET("packages/{packageId}")
    suspend fun getPackageDetails(@Path("packageId") packageId: String): EventPackage

    @GET("users/event-limit")
    suspend fun getUserEventLimit(): UserEventLimit
} 