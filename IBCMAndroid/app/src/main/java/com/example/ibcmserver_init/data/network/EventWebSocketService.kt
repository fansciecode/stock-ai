package com.example.ibcmserver_init.data.network

import kotlinx.serialization.SerialName
import kotlinx.serialization.Serializable
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.MutableSharedFlow
import okhttp3.OkHttpClient
import okhttp3.Request
import okhttp3.WebSocket
import okhttp3.WebSocketListener
import javax.inject.Inject
import javax.inject.Singleton

@Serializable
data class EventUpdate(
    @SerialName("event_id") val eventId: String,
    @SerialName("type") val type: UpdateType,
    @SerialName("data") val data: Map<String, String>,
    @SerialName("timestamp") val timestamp: String
)

@Serializable
data class ChatMessage(
    @SerialName("event_id") val eventId: String,
    @SerialName("sender_id") val senderId: String,
    @SerialName("sender_name") val senderName: String,
    @SerialName("content") val content: String,
    @SerialName("timestamp") val timestamp: String
)

@Serializable
enum class UpdateType {
    @SerialName("details_changed") DETAILS_CHANGED,
    @SerialName("attendee_joined") ATTENDEE_JOINED,
    @SerialName("attendee_left") ATTENDEE_LEFT,
    @SerialName("event_cancelled") EVENT_CANCELLED,
    @SerialName("event_started") EVENT_STARTED,
    @SerialName("event_ended") EVENT_ENDED
}

interface EventWebSocketService {
    fun connect()
    fun disconnect()
    fun observeEventUpdates(eventId: String): Flow<EventUpdate>
    fun observeEventChat(eventId: String): Flow<ChatMessage>
    fun sendChatMessage(eventId: String, message: String)
    fun joinEvent(eventId: String)
    fun leaveEvent(eventId: String)
    fun isConnected(): Boolean
}

@Singleton
class EventWebSocketServiceImpl @Inject constructor(
    private val okHttpClient: OkHttpClient
) : EventWebSocketService {
    private var webSocket: WebSocket? = null
    private var isConnected = false
    
    private val eventUpdates = MutableSharedFlow<EventUpdate>()
    private val chatMessages = MutableSharedFlow<ChatMessage>()
    
    override fun connect() {
        if (isConnected) return
        
        val request = Request.Builder()
            .url("wss://your-websocket-server.com/events")
            .build()
            
        webSocket = okHttpClient.newWebSocket(request, object : WebSocketListener() {
            override fun onOpen(webSocket: WebSocket, response: okhttp3.Response) {
                isConnected = true
            }
            
            override fun onClosed(webSocket: WebSocket, code: Int, reason: String) {
                isConnected = false
            }
            
            override fun onFailure(webSocket: WebSocket, t: Throwable, response: okhttp3.Response?) {
                isConnected = false
                // TODO: Implement reconnection logic
            }
        })
    }
    
    override fun disconnect() {
        webSocket?.close(1000, "Normal closure")
        webSocket = null
        isConnected = false
    }
    
    override fun observeEventUpdates(eventId: String): Flow<EventUpdate> {
        return eventUpdates
    }
    
    override fun observeEventChat(eventId: String): Flow<ChatMessage> {
        return chatMessages
    }
    
    override fun sendChatMessage(eventId: String, message: String) {
        val messageJson = """
            {
                "type": "chat",
                "event_id": "$eventId",
                "content": "$message"
            }
        """.trimIndent()
        webSocket?.send(messageJson)
    }
    
    override fun joinEvent(eventId: String) {
        val joinJson = """
            {
                "type": "join",
                "event_id": "$eventId"
            }
        """.trimIndent()
        webSocket?.send(joinJson)
    }
    
    override fun leaveEvent(eventId: String) {
        val leaveJson = """
            {
                "type": "leave",
                "event_id": "$eventId"
            }
        """.trimIndent()
        webSocket?.send(leaveJson)
    }
    
    override fun isConnected(): Boolean = isConnected
} 