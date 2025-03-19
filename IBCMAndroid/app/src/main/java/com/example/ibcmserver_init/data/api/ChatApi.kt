import retrofit2.http.*

interface ChatApi {
    @POST("chats")
    suspend fun accessChat(
        @Body request: AccessChatRequest
    ): Chat

    @GET("chats")
    suspend fun fetchChats(): List<Chat>

    @POST("chats/group")
    suspend fun createGroupChat(
        @Body request: CreateGroupRequest
    ): Chat

    @PUT("chats/rename")
    suspend fun renameGroup(
        @Body request: RenameGroupRequest
    ): Chat

    @PUT("chats/groupadd")
    suspend fun addToGroup(
        @Body request: GroupMemberRequest
    ): Chat

    @PUT("chats/groupremove")
    suspend fun removeFromGroup(
        @Body request: GroupMemberRequest
    ): Chat

    @GET("chats/{chatId}/messages")
    suspend fun getMessages(
        @Path("chatId") chatId: String
    ): List<Message>

    @POST("chats/{chatId}/message")
    suspend fun sendMessage(
        @Path("chatId") chatId: String,
        @Body request: SendMessageRequest
    ): Message
}

data class AccessChatRequest(
    val userId: String
)

data class CreateGroupRequest(
    val name: String,
    val users: List<String>
)

data class RenameGroupRequest(
    val chatId: String,
    val chatName: String
)

data class GroupMemberRequest(
    val chatId: String,
    val userId: String
)

data class SendMessageRequest(
    val content: String,
    val messageType: MessageType = MessageType.TEXT
) 