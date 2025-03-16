package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.repository.AuthRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FirebaseFirestore
import kotlinx.coroutines.tasks.await
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class AuthRepositoryImpl @Inject constructor(
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : AuthRepository {

    override suspend fun login(email: String, password: String): Boolean {
        return try {
            auth.signInWithEmailAndPassword(email, password).await()
            true
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun signup(email: String, password: String, displayName: String): Boolean {
        return try {
            val result = auth.createUserWithEmailAndPassword(email, password).await()
            result.user?.let { user ->
                val userDoc = hashMapOf(
                    "id" to user.uid,
                    "email" to email,
                    "displayName" to displayName,
                    "createdAt" to System.currentTimeMillis(),
                    "updatedAt" to System.currentTimeMillis()
                )
                firestore.collection("users").document(user.uid).set(userDoc).await()
            }
            true
        } catch (e: Exception) {
            false
        }
    }

    override suspend fun logout() {
        auth.signOut()
    }

    override suspend fun getCurrentUserId(): String? {
        return auth.currentUser?.uid
    }
} 