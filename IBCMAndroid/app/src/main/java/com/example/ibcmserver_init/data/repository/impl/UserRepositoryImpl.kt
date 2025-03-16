package com.example.ibcmserver_init.data.repository.impl

import com.example.ibcmserver_init.data.api.UserApiService
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.User
import com.example.ibcmserver_init.data.model.UserPreferences
import com.example.ibcmserver_init.data.repository.UserRepository
import com.google.firebase.auth.FirebaseAuth
import com.google.firebase.firestore.FieldValue
import com.google.firebase.firestore.FirebaseFirestore
import com.google.firebase.firestore.Query
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.tasks.await
import java.time.LocalDate
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class UserRepositoryImpl @Inject constructor(
    private val userApiService: UserApiService,
    private val auth: FirebaseAuth,
    private val firestore: FirebaseFirestore
) : UserRepository {

    private val usersCollection = firestore.collection("users")
    private val eventsCollection = firestore.collection("events")
    private val currentUserFlow = MutableStateFlow<User?>(null)

    override suspend fun signup(email: String, password: String): Result<User> {
        return try {
            val authResult = auth.createUserWithEmailAndPassword(email, password).await()
            val userId = authResult.user?.uid ?: throw Exception("Failed to create user")
            
            val user = User(
                id = userId,
                email = email,
                name = email.substringBefore("@"),
                createdAt = System.currentTimeMillis(),
                updatedAt = System.currentTimeMillis()
            )
            
            usersCollection.document(userId).set(user).await()
            currentUserFlow.value = user
            Result.success(user)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun login(email: String, password: String): Result<Boolean> {
        return try {
            val authResult = auth.signInWithEmailAndPassword(email, password).await()
            val userId = authResult.user?.uid ?: return Result.success(false)
            
            val userDoc = usersCollection.document(userId).get().await()
            val user = userDoc.toObject(User::class.java)
            currentUserFlow.value = user
            Result.success(true)
        } catch (e: Exception) {
            Result.failure(e)
        }
    }

    override suspend fun logout(): Result<Unit> {
        return try {
            auth.signOut()
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

    override suspend fun updateUserProfile(user: User): User {
        val userId = user.id
        usersCollection.document(userId).set(user).await()
        currentUserFlow.value = user
        return user
    }

    override suspend fun updateUserPreferences(preferences: UserPreferences): UserPreferences {
        val currentUser = getCurrentUser() ?: throw Exception("No user logged in")
        val updatedUser = currentUser.copy(
            preferences = preferences,
            updatedAt = System.currentTimeMillis()
        )
        usersCollection.document(currentUser.id).set(updatedUser).await()
        currentUserFlow.value = updatedUser
        return preferences
    }

    override suspend fun updateUserInterests(userId: String, categories: List<String>) {
        usersCollection.document(userId)
            .update("selectedCategories", categories)
            .await()
    }

    override suspend fun addFriend(friendId: String) {
        val currentUser = getCurrentUser() ?: throw Exception("No user logged in")
        val updatedUser = currentUser.copy(
            friends = currentUser.friends + friendId,
            updatedAt = System.currentTimeMillis()
        )
        usersCollection.document(currentUser.id).set(updatedUser).await()
        currentUserFlow.value = updatedUser
    }

    override suspend fun removeFriend(friendId: String) {
        val currentUser = getCurrentUser() ?: throw Exception("No user logged in")
        val updatedUser = currentUser.copy(
            friends = currentUser.friends - friendId,
            updatedAt = System.currentTimeMillis()
        )
        usersCollection.document(currentUser.id).set(updatedUser).await()
        currentUserFlow.value = updatedUser
    }

    override suspend fun blockUser(userId: String) {
        val currentUser = getCurrentUser() ?: throw Exception("No user logged in")
        val updatedUser = currentUser.copy(
            blockedUsers = currentUser.blockedUsers + userId,
            updatedAt = System.currentTimeMillis()
        )
        usersCollection.document(currentUser.id).set(updatedUser).await()
        currentUserFlow.value = updatedUser
    }

    override suspend fun unblockUser(userId: String) {
        val currentUser = getCurrentUser() ?: throw Exception("No user logged in")
        val updatedUser = currentUser.copy(
            blockedUsers = currentUser.blockedUsers - userId,
            updatedAt = System.currentTimeMillis()
        )
        usersCollection.document(currentUser.id).set(updatedUser).await()
        currentUserFlow.value = updatedUser
    }

    override suspend fun getCreatedEvents(): List<Event> {
        val userId = auth.currentUser?.uid ?: throw Exception("User not logged in")
        val querySnapshot = eventsCollection
            .whereEqualTo("creatorId", userId)
            .get()
            .await()

        return querySnapshot.documents.mapNotNull { doc ->
            doc.toObject(Event::class.java)?.copy(id = doc.id)
        }
    }

    override suspend fun getAttendingEvents(): List<Event> {
        val userId = auth.currentUser?.uid ?: throw Exception("User not logged in")
        val querySnapshot = eventsCollection
            .whereArrayContains("attendees", userId)
            .get()
            .await()

        return querySnapshot.documents.mapNotNull { doc ->
            doc.toObject(Event::class.java)?.copy(id = doc.id)
        }
    }

    override suspend fun getInterestedEvents(): List<Event> {
        val userId = auth.currentUser?.uid ?: throw Exception("User not logged in")
        val querySnapshot = eventsCollection
            .whereArrayContains("interestedUsers", userId)
            .get()
            .await()

        return querySnapshot.documents.mapNotNull { doc ->
            doc.toObject(Event::class.java)?.copy(id = doc.id)
        }
    }

    override suspend fun updateNotificationToken(token: String) {
        val userId = auth.currentUser?.uid ?: throw Exception("User not logged in")
        usersCollection.document(userId)
            .update("notificationToken", token)
            .await()
    }

    override suspend fun removeNotificationToken() {
        val userId = auth.currentUser?.uid ?: throw Exception("User not logged in")
        usersCollection.document(userId)
            .update("notificationToken", null)
            .await()
    }

    override suspend fun getUserById(userId: String): User {
        val snapshot = usersCollection.document(userId).get().await()
        return snapshot.toObject(User::class.java) ?: throw IllegalStateException("User not found")
    }

    override suspend fun getUserPreferences(): UserPreferences {
        val userId = auth.currentUser?.uid ?: throw IllegalStateException("User not logged in")
        val snapshot = usersCollection.document(userId).get().await()
        val preferencesMap = snapshot.get("preferences") as? Map<String, Any> ?: emptyMap()
        return UserPreferences.fromMap(preferencesMap)
    }

    override suspend fun getFriends(): List<User> {
        val userId = auth.currentUser?.uid ?: throw IllegalStateException("User not logged in")
        val user = getUserById(userId)
        return user.friends.map { friendId -> getUserById(friendId) }
    }

    override suspend fun getBlockedUsers(): List<User> {
        val userId = auth.currentUser?.uid ?: throw IllegalStateException("User not logged in")
        val user = getUserById(userId)
        return user.blockedUsers.map { blockedId -> getUserById(blockedId) }
    }

    override suspend fun searchUsers(query: String): List<User> {
        val snapshot = usersCollection
            .whereGreaterThanOrEqualTo("displayName", query)
            .whereLessThanOrEqualTo("displayName", query + '\uf8ff')
            .get()
            .await()
        return snapshot.toObjects(User::class.java)
    }

    override suspend fun deleteAccount() {
        val userId = auth.currentUser?.uid ?: throw IllegalStateException("User not logged in")
        usersCollection.document(userId).delete().await()
        auth.currentUser?.delete()?.await()
    }
} 