import asyncHandler from "express-async-handler";
import Chat from "../models/chatModel.js";
import { UserModel } from "../models/userModel.js";
import { db, messaging } from '../config/firebaseConfig.js';
import admin from 'firebase-admin';

// @desc Access or create a one-on-one chat
// @route POST /api/chats
// @access Private
const accessChat = asyncHandler(async (req, res) => {
    const { userId } = req.body;

    if (!userId) {
        console.log("UserId param not sent with request");
        return res.sendStatus(400);
    }

    let chat = await Chat.findOne({
        participants: { 
            $all: [req.user._id, userId],
            $size: 2
        }
    }).populate('participants', 'name email');
    
    if (chat) {
        res.json(chat);
    } else {
        chat = await Chat.create({
            participants: [req.user._id, userId]
        });
        chat = await chat.populate('participants', 'name email');
        res.status(201).json(chat);
    }
});

// @desc Fetch all chats for a user
// @route GET /api/chats
// @access Private
const fetchChats = asyncHandler(async (req, res) => {
    const chats = await Chat.find({
        participants: req.user._id
    })
    .populate('participants', 'name email')
    .populate('lastMessage')
    .sort('-updatedAt');

    res.json(chats);
});

// @desc Create a group chat
// @route POST /api/chats/group
// @access Private
const createGroupChat = asyncHandler(async (req, res) => {
    const { users, name } = req.body;

    if (!users || users.length < 2) {
        res.status(400);
        throw new Error("A group chat requires at least two members.");
    }

    users.push(req.user._id);

    const groupChat = await Chat.create({
        chatName: name,
        isGroupChat: true,
        users,
        groupAdmin: req.user._id,
    });

    res.status(201).json(groupChat);
});

// @desc Rename a group chat
// @route PUT /api/chats/rename
// @access Private
const renameGroup = asyncHandler(async (req, res) => {
    const { chatId, chatName } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(chatId, { chatName }, { new: true });

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.json(updatedChat);
    }
});

// @desc Add user to group chat
// @route PUT /api/chats/groupadd
// @access Private
const addToGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $push: { users: userId } },
        { new: true }
    );

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.json(updatedChat);
    }
});

// @desc Remove user from group chat
// @route PUT /api/chats/groupremove
// @access Private
const removeFromGroup = asyncHandler(async (req, res) => {
    const { chatId, userId } = req.body;

    const updatedChat = await Chat.findByIdAndUpdate(
        chatId,
        { $pull: { users: userId } },
        { new: true }
    );

    if (!updatedChat) {
        res.status(404);
        throw new Error("Chat not found");
    } else {
        res.json(updatedChat);
    }
});

// @desc Get all messages in a chat
// @route GET /api/chats/:chatId/messages
// @access Private
const getMessages = asyncHandler(async (req, res) => {
    const messages = await Message.find({ chat: req.params.chatId })
        .populate("sender", "name email")
        .populate("chat");

    res.status(200).json(messages);
});

// @desc Send a message in a chat
// @route POST /api/chats/:chatId/message
// @access Private
const sendMessage = asyncHandler(async (req, res) => {
    const { content, messageType = 'TEXT' } = req.body;
    const chatId = req.params.chatId;

    const chat = await Chat.findById(chatId);
    if (!chat) {
        res.status(404);
        throw new Error('Chat not found');
    }

    const message = {
        sender: req.user._id,
        content,
        messageType,
        readBy: [{ user: req.user._id, readAt: new Date() }]
    };

    chat.messages.push(message);
    chat.lastMessage = message;
    await chat.save();

    // Add Firebase real-time update
    try {
        // Store message in Firebase
        await db.collection('chats').doc(chatId).collection('messages').add({
            senderId: req.user._id.toString(),
            content,
            messageType,
            timestamp: admin.firestore.FieldValue.serverTimestamp(),
            readBy: [{
                userId: req.user._id.toString(),
                readAt: new Date()
            }]
        });

        // Get FCM tokens of other participants
        const otherParticipants = chat.participants.filter(
            p => p.toString() !== req.user._id.toString()
        );

        const users = await User.find({
            _id: { $in: otherParticipants }
        });

        const tokens = users.flatMap(user => 
            user.fcmTokens?.map(t => t.token) || []
        );

        // Send FCM notifications if tokens exist
        if (tokens.length > 0) {
            await messaging.sendMulticast({
                tokens,
                notification: {
                    title: `New message from ${req.user.name}`,
                    body: content.substring(0, 100)
                },
                data: {
                    chatId,
                    messageId: message._id.toString(),
                    type: 'CHAT'
                }
            });
        }
    } catch (error) {
        console.error('Firebase error:', error);
        // Continue execution - Firebase is enhancement, not critical
    }

    res.status(201).json(message);
});

export {getMessages, sendMessage, accessChat, fetchChats, createGroupChat, renameGroup, addToGroup, removeFromGroup };
