package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.User
import com.example.ibcmserver_init.data.model.Event
import com.example.ibcmserver_init.data.model.UserSettings
import retrofit2.Response
import retrofit2.http.*

interface UserApiService {
    @POST("auth/login")
    suspend fun login(@Body credentials: Map<String, String>): Response<User>

    @POST("auth/signup")
    suspend fun signup(@Body userData: Map<String, String>): Response<User>

    @POST("auth/logout")
    suspend fun logout(): Response<Unit>

    @GET("users/me")
    suspend fun getCurrentUser(): Response<User>

    @PUT("users/me")
    suspend fun updateProfile(@Body user: User): Response<User>

    @PUT("users/me/preferences")
    suspend fun updatePreferences(@Body preferences: Map<String, Any>): Response<User>

    @PUT("users/me/categories")
    suspend fun updateCategories(@Body categories: Map<String, List<String>>): Response<User>

    @DELETE("users/me")
    suspend fun deleteAccount(): Response<Unit>

    @POST("auth/reset-password")
    suspend fun resetPassword(@Body data: Map<String, String>): Response<Unit>

    @POST("auth/verify-email")
    suspend fun verifyEmail(@Body data: Map<String, String>): Response<Unit>

    @PUT("users/me/profile-picture")
    suspend fun updateProfilePicture(@Body data: Map<String, String>): Response<String>

    @GET("users/{id}")
    suspend fun getUserById(@Path("id") userId: String): Response<User>

    @GET("users/search")
    suspend fun searchUsers(@Query("q") query: String): List<User>

    @PATCH("users/me")
    suspend fun updateUser(@Body userData: Map<String, Any>): Response<User>

    @GET("users/{userId}/events/attending")
    suspend fun getAttendingEvents(@Path("userId") userId: String): Response<List<Event>>

    @GET("users/{userId}/settings")
    suspend fun getUserSettings(@Path("userId") userId: String): Response<UserSettings>

    @PUT("users/{userId}/settings")
    suspend fun updateUserSettings(
        @Path("userId") userId: String,
        @Body settings: Map<String, Any>
    ): User

    @POST("users")
    suspend fun createUser(@Body user: User): User

    @PUT("users/{id}")
    suspend fun updateUser(
        @Path("id") userId: String,
        @Body user: UserUpdateRequest
    ): Response<User>

    @DELETE("users/{userId}")
    suspend fun deleteUser(@Path("userId") userId: String)

    @GET("users/{userId}/friends")
    suspend fun getUserFriends(@Path("userId") userId: String): List<User>

    @POST("users/{userId}/friends/{friendId}")
    suspend fun addFriend(
        @Path("userId") userId: String,
        @Path("friendId") friendId: String
    )

    @DELETE("users/{userId}/friends/{friendId}")
    suspend fun removeFriend(
        @Path("userId") userId: String,
        @Path("friendId") friendId: String
    )

    @GET("users/{userId}/blocked")
    suspend fun getBlockedUsers(@Path("userId") userId: String): List<User>

    @POST("users/{userId}/block/{blockedId}")
    suspend fun blockUser(
        @Path("userId") userId: String,
        @Path("blockedId") blockedId: String
    )

    @DELETE("users/{userId}/block/{blockedId}")
    suspend fun unblockUser(
        @Path("userId") userId: String,
        @Path("blockedId") blockedId: String
    )

    @PUT("users/{userId}/password")
    suspend fun updatePassword(
        @Path("userId") userId: String,
        @Body passwordData: Map<String, String>
    )

    @POST("users/{userId}/verify")
    suspend fun verifyUser(@Path("userId") userId: String)

    @GET("users/{userId}/notifications")
    suspend fun getUserNotifications(@Path("userId") userId: String): List<Map<String, Any>>

    @PUT("users/{userId}/notifications/{notificationId}")
    suspend fun updateNotificationStatus(
        @Path("userId") userId: String,
        @Path("notificationId") notificationId: String,
        @Query("read") read: Boolean
    )

    @GET("users/{userId}/preferences")
    suspend fun getUserPreferences(@Path("userId") userId: String): Map<String, Any>

    @PUT("users/{userId}/preferences")
    suspend fun updateUserPreferences(
        @Path("userId") userId: String,
        @Body preferences: Map<String, Any>
    ): User

    @POST("users/{id}/follow")
    suspend fun followUser(@Path("id") userId: String): Response<Unit>

    @POST("users/{id}/unfollow")
    suspend fun unfollowUser(@Path("id") userId: String): Response<Unit>

    @GET("users/{id}/followers")
    suspend fun getUserFollowers(@Path("id") userId: String): Response<List<User>>

    @GET("users/{id}/following")
    suspend fun getUserFollowing(@Path("id") userId: String): Response<List<User>>
}

data class UserUpdateRequest(
    val displayName: String?,
    val email: String?,
    val bio: String?,
    val profilePictureUrl: String?
) 