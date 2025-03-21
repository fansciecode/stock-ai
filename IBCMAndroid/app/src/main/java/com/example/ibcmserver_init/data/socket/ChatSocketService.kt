import io.socket.client.IO
import io.socket.client.Socket
import kotlinx.coroutines.channels.Channel
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.receiveAsFlow
import javax.inject.Inject
import javax.inject.Singleton
import com.google.gson.Gson
import kotlinx.coroutines.CoroutineScope
import kotlinx.coroutines.Dispatchers
import kotlinx.coroutines.SupervisorJob
import kotlinx.coroutines.launch

@Singleton
class ChatSocketService @Inject constructor(
    private val gson: Gson
) {
    private var socket: Socket? = null
    private val scope = CoroutineScope(SupervisorJob() + Dispatchers.IO)
    private val _messages = Channel<Message>()
    val messages: Flow<Message> = _messages.receiveAsFlow()

    fun connect(serverUrl: String, authToken: String) {
        try {
            val options = IO.Options().apply {
                auth = mapOf("token" to authToken)
            }
            socket = IO.socket(serverUrl, options)
            
            setupSocketListeners()
            socket?.connect()
        } catch (e: Exception) {
            e.printStackTrace()
        }
    }

    private fun setupSocketListeners() {
        socket?.let { socket ->
            socket.on(Socket.EVENT_CONNECT) {
                println("Socket connected")
            }

            socket.on(Socket.EVENT_DISCONNECT) {
                println("Socket disconnected")
            }

            socket.on("newMessage") { args ->
                args.firstOrNull()?.toString()?.let { messageJson ->
                    try {
                        val message = gson.fromJson(messageJson, Message::class.java)
                        scope.launch {
                            _messages.send(message)
                        }
                    } catch (e: Exception) {
                        e.printStackTrace()
                    }
                }
            }
        }
    }

    fun joinRoom(roomId: String) {
        socket?.emit("joinRoom", gson.toJson(mapOf("roomId" to roomId)))
    }

    fun sendMessage(roomId: String, message: Message) {
        val messageData = mapOf(
            "roomId" to roomId,
            "message" to message
        )
        socket?.emit("sendMessage", gson.toJson(messageData))
    }

    fun disconnect() {
        socket?.disconnect()
        socket = null
    }

    fun isConnected(): Boolean = socket?.connected() == true
} 