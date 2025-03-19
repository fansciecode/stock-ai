package com.example.ibcmserver_init.data.repository

interface ImageRepository {
    suspend fun uploadImage(imageUri: String): String
    suspend fun uploadImages(imageUris: List<String>): List<String>
    suspend fun getImage(imageUrl: String): ByteArray
    suspend fun deleteImage(imageUrl: String)
    suspend fun compressImage(imageUri: String): String
} 