package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.model.User
import com.example.ibcmserver_init.data.model.UserPreferences
import com.example.ibcmserver_init.data.repository.UserRepository
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class MockUserRepositoryImpl @Inject constructor() : UserRepository {
    private val users = mutableMapOf<String, User>()
    private val currentUserFlow = MutableStateFlow<User?>(null)

    override suspend fun signup(email: String, password: String): Result<User> {
        return try {
            val userId = System.currentTimeMillis().toString()
            val user = User(
                id = userId,
                email = email,
                name = email.substringBefore("@"),
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            users[userId] = user
            currentUserFlow.value = user
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): Result<Boolean> {
        return try {
            val user = users.values.find { it.email == email }
            if (user != null) {
                currentUserFlow.value = user
                Result.success(true)
            } else {
                Result.success(false)
            }
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            currentUserFlow.value = null
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun getCurrentUser(): User? {
        return currentUserFlow.value
    }

    override fun observeCurrentUser(): Flow<User?> {
        return currentUserFlow.asStateFlow()
    }

    override suspend fun updateUserProfile(
        name: String?,
        bio: String?,
        avatarUrl: String?,
        interests: List<String>?
    ): Result<User> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            val updatedUser = currentUser.copy(
                name = name ?: currentUser.name,
                bio = bio ?: currentUser.bio,
                avatarUrl = avatarUrl ?: currentUser.avatarUrl,
                interests = interests ?: currentUser.interests,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(updatedUser)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateUserPreferences(preferences: UserPreferences): Result<UserPreferences> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            val updatedUser = currentUser.copy(
                preferences = preferences,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(preferences)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun addFriend(friendId: String): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            val friend = users[friendId] ?: return Result.failure(Exception("Friend not found"))
            
            val updatedUser = currentUser.copy(
                friends = currentUser.friends + friendId,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeFriend(friendId: String): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            
            val updatedUser = currentUser.copy(
                friends = currentUser.friends - friendId,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun blockUser(userId: String): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            
            val updatedUser = currentUser.copy(
                blockedUsers = currentUser.blockedUsers + userId,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun unblockUser(userId: String): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            
            val updatedUser = currentUser.copy(
                blockedUsers = currentUser.blockedUsers - userId,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun updateNotificationToken(token: String): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            
            val updatedUser = currentUser.copy(
                notificationToken = token,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun removeNotificationToken(): Result<Unit> {
        return try {
            val currentUser = currentUserFlow.value ?: return Result.failure(Exception("No user logged in"))
            
            val updatedUser = currentUser.copy(
                notificationToken = null,
                updatedAt = System.currentTimeMillis()
            )
            users[currentUser.id] = updatedUser
            currentUserFlow.value = updatedUser
            Result.success(Unit)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }
} 