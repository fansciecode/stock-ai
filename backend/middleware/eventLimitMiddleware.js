import asyncHandler from "express-async-handler";
import { UserModel } from "../models/userModel.js";

export const checkEventLimit = asyncHandler(async (req, res, next) => {
  const user = await UserModel.findById(req.user._id);
  
  if (!user) {
    res.status(401);
    throw new Error("User not found");
  }

   // If event limit feature is disabled (for testing phase)
   if (process.env.EVENT_LIMIT_DISABLED === "true") {
    return next();
  }

  if (user.eventLimit <= 0) {
    res.status(403);
    throw new Error("Event creation limit exceeded. Please upgrade your plan.");
  }

  next();
});
