package com.example.ibcmserver_init.data.model.follow

data class FollowResponse(
    val success: Boolean,
    val message: String,
    val followerCount: Int,
    val followingCount: Int
)

data class FollowersResponse(
    val success: Boolean,
    val followers: List<Follower>
)

data class FollowingResponse(
    val success: Boolean,
    val following: List<Following>
)

data class Follower(
    val userId: String,
    val name: String,
    val profileImage: String?,
    val isFollowing: Boolean
)

data class Following(
    val userId: String,
    val name: String,
    val profileImage: String?,
    val isFollowing: Boolean
) 