package com.example.ibcmserver_init.data.repository

interface AuthRepository {
    suspend fun login(email: String, password: String): Boolean
    suspend fun signup(email: String, password: String, displayName: String): Boolean
    suspend fun getCurrentUserId(): String?
    suspend fun logout()
} 