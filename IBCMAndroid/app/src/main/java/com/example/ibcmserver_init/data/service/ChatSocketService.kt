package com.example.ibcmserver_init.data.service

import com.example.ibcmserver_init.data.model.chat.ChatMessage
import com.example.ibcmserver_init.data.model.chat.ChatSocketEvent
import com.example.ibcmserver_init.data.model.chat.ChatSocketEventType
import io.socket.client.IO
import io.socket.client.Socket
import io.socket.emitter.Emitter
import kotlinx.coroutines.channels.awaitClose
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.callbackFlow
import kotlinx.coroutines.flow.flow
import org.json.JSONObject
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class ChatSocketService @Inject constructor() {
    private var socket: Socket? = null
    private val serverUrl = "http://your-server-url:3000" // Replace with your server URL

    fun connect(): Flow<ChatSocketEvent> = callbackFlow {
        try {
            val options = IO.Options().apply {
                reconnection = true
                reconnectionDelay = 1000
                reconnectionDelayMax = 5000
                reconnectionAttempts = 5
            }

            socket = IO.socket(serverUrl, options)

            socket?.apply {
                on(Socket.EVENT_CONNECT) {
                    trySend(ChatSocketEvent(ChatSocketEventType.CONNECTED, Unit))
                }

                on(Socket.EVENT_DISCONNECT) {
                    trySend(ChatSocketEvent(ChatSocketEventType.DISCONNECTED, Unit))
                }

                on(Socket.EVENT_CONNECT_ERROR) { args ->
                    trySend(ChatSocketEvent(ChatSocketEventType.ERROR, args[0]))
                }

                on("newMessage") { args ->
                    val message = args[0] as JSONObject
                    trySend(ChatSocketEvent(ChatSocketEventType.NEW_MESSAGE, message))
                }

                connect()
            }
        } catch (e: Exception) {
            trySend(ChatSocketEvent(ChatSocketEventType.ERROR, e))
        }

        awaitClose {
            socket?.disconnect()
        }
    }

    fun joinRoom(roomId: String): Flow<ChatSocketEvent> = flow {
        try {
            socket?.emit("joinRoom", JSONObject().put("roomId", roomId))
            emit(ChatSocketEvent(ChatSocketEventType.JOIN_ROOM, roomId))
        } catch (e: Exception) {
            emit(ChatSocketEvent(ChatSocketEventType.ERROR, e))
        }
    }

    fun sendMessage(message: ChatMessage): Flow<ChatSocketEvent> = flow {
        try {
            val messageJson = JSONObject().apply {
                put("roomId", message.roomId)
                put("message", JSONObject().apply {
                    put("id", message.id)
                    put("senderId", message.senderId)
                    put("content", message.content)
                    put("timestamp", message.timestamp)
                })
            }
            socket?.emit("sendMessage", messageJson)
            emit(ChatSocketEvent(ChatSocketEventType.SEND_MESSAGE, message))
        } catch (e: Exception) {
            emit(ChatSocketEvent(ChatSocketEventType.ERROR, e))
        }
    }

    fun disconnect() {
        socket?.disconnect()
    }
} 