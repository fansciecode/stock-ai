import asyncHandler from "express-async-handler";
import { UserModel } from "../models/userModel.js";

// Follow a user
export const followUser = asyncHandler(async (req, res) => {
    const userToFollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToFollow || !currentUser) {
        res.status(404);
        throw new Error("User not found");
    }

    if (currentUser.following.includes(userToFollow._id)) {
        res.status(400);
        throw new Error("Already following this user");
    }

    currentUser.following.push(userToFollow._id);
    userToFollow.followers.push(currentUser._id);

    await currentUser.save();
    await userToFollow.save();

    res.status(200).json({ message: "User followed successfully" });
});

// Unfollow a user
export const unfollowUser = asyncHandler(async (req, res) => {
    const userToUnfollow = await User.findById(req.params.id);
    const currentUser = await User.findById(req.user._id);

    if (!userToUnfollow || !currentUser) {
        res.status(404);
        throw new Error("User not found");
    }

    currentUser.following = currentUser.following.filter(id => id.toString() !== userToUnfollow._id.toString());
    userToUnfollow.followers = userToUnfollow.followers.filter(id => id.toString() !== currentUser._id.toString());

    await currentUser.save();
    await userToUnfollow.save();

    res.status(200).json({ message: "User unfollowed successfully" });
});

// Get followers of a user
export const getUserFollowers = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate("followers", "name email");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json(user.followers);
});

// Get users followed by a user
export const getUserFollowing = asyncHandler(async (req, res) => {
    const user = await User.findById(req.params.id).populate("following", "name email");

    if (!user) {
        res.status(404);
        throw new Error("User not found");
    }

    res.status(200).json(user.following);
});
