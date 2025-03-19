import express from "express";
import { getMessages, sendMessage, accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup } from "../controllers/chatController.js";
import { protect } from "../middleware/authMiddleware.js";

const router = express.Router();

router.route("/").post(protect, accessChat).get(protect, fetchChats);
router.route("/group").post(protect, createGroupChat);
router.route("/rename").put(protect, renameGroup);
router.route("/groupadd").put(protect, addToGroup);
router.route("/groupremove").put(protect, removeFromGroup);
router.route("/").post(protect, accessChat).get(protect, fetchChats);
router.route("/:chatId/messages").get(protect, getMessages);
router.route("/:chatId/message").post(protect, sendMessage);

export default router;
