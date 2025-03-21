package com.example.ibcmserver_init.data.repositories

import com.example.ibcmserver_init.data.api.PackageApi
import com.example.ibcmserver_init.data.model.package.EventPackage
import com.example.ibcmserver_init.data.model.package.UserEventLimit
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class PackageRepository @Inject constructor(
    private val packageApi: PackageApi
) {
    suspend fun getAvailablePackages(): List<EventPackage> {
        return packageApi.getAvailablePackages()
    }

    suspend fun getPackageDetails(packageId: String): EventPackage {
        return packageApi.getPackageDetails(packageId)
    }

    suspend fun getUserEventLimit(): UserEventLimit {
        return packageApi.getUserEventLimit()
    }
} 