package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.User
import com.example.ibcmserver_init.data.model.UserPreferences
import kotlinx.coroutines.flow.Flow

interface UserRepository {
    suspend fun login(email: String, password: String): User
    suspend fun signup(email: String, password: String, displayName: String): User
    suspend fun getCurrentUser(): User?
    suspend fun getUserById(userId: String): User
    suspend fun updateUserProfile(user: User): User
    suspend fun updateUserPreferences(preferences: UserPreferences): UserPreferences
    suspend fun getUserPreferences(): UserPreferences
    suspend fun getCreatedEvents(): List<Event>
    suspend fun getAttendingEvents(): List<Event>
    suspend fun getInterestedEvents(): List<Event>
    suspend fun addFriend(friendId: String)
    suspend fun removeFriend(friendId: String)
    suspend fun blockUser(userId: String)
    suspend fun unblockUser(userId: String)
    suspend fun getFriends(): List<User>
    suspend fun getBlockedUsers(): List<User>
    suspend fun searchUsers(query: String): List<User>
    suspend fun logout()
    suspend fun deleteAccount()
    fun observeCurrentUser(): Flow<User?>
} 