@Module
@InstallIn(SingletonComponent::class)
object ChatModule {

    @Provides
    @Singleton
    fun provideChatApi(retrofit: Retrofit): ChatApi {
        return retrofit.create(ChatApi::class.java)
    }

    @Provides
    @Singleton
    fun provideChatSocketService(
        @ApplicationContext context: Context,
        gson: Gson
    ): ChatSocketService {
        return ChatSocketService(gson)
    }

    @Provides
    @Singleton
    fun provideChatDao(database: AppDatabase): ChatDao {
        return database.chatDao()
    }

    @Provides
    @Singleton
    fun provideChatRepository(
        chatApi: ChatApi,
        chatSocketService: ChatSocketService,
        chatDao: ChatDao
    ): ChatRepository {
        return ChatRepository(chatApi, chatSocketService, chatDao)
    }

    @Provides
    @Singleton
    fun provideGson(): Gson {
        return GsonBuilder()
            .registerTypeAdapter(Date::class.java, DateTypeAdapter())
            .create()
    }
}

class DateTypeAdapter : JsonSerializer<Date>, JsonDeserializer<Date> {
    override fun serialize(
        src: Date?,
        typeOfSrc: Type?,
        context: JsonSerializationContext?
    ): JsonElement {
        return JsonPrimitive(src?.time)
    }

    override fun deserialize(
        json: JsonElement?,
        typeOfT: Type?,
        context: JsonDeserializationContext?
    ): Date {
        return Date(json?.asLong ?: 0)
    }
} 