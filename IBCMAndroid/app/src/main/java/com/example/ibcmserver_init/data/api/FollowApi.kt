package com.example.ibcmserver_init.data.api

import com.example.ibcmserver_init.data.model.follow.FollowResponse
import com.example.ibcmserver_init.data.model.follow.FollowersResponse
import com.example.ibcmserver_init.data.model.follow.FollowingResponse
import retrofit2.http.POST
import retrofit2.http.Path
import retrofit2.http.GET

interface FollowApi {
    @POST("follow/{userId}")
    suspend fun followUser(@Path("userId") userId: String): FollowResponse

    @POST("unfollow/{userId}")
    suspend fun unfollowUser(@Path("userId") userId: String): FollowResponse

    @GET("followers/{userId}")
    suspend fun getFollowers(@Path("userId") userId: String): FollowersResponse

    @GET("following/{userId}")
    suspend fun getFollowing(@Path("userId") userId: String): FollowingResponse
} 