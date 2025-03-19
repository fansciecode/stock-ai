interface GrowthApi {
    @GET("landing-content")
    suspend fun getLandingContent(
        @Query("latitude") latitude: Double? = null,
        @Query("longitude") longitude: Double? = null,
        @Query("city") city: String? = null
    ): LandingContentResponse

    @POST("track-activity")
    suspend fun trackAnonymousActivity(
        @Body request: TrackActivityRequest
    ): TrackActivityResponse

    @GET("share-content/{eventId}")
    suspend fun getShareContent(
        @Path("eventId") eventId: String
    ): ShareContentResponse

    @POST("track-share")
    suspend fun trackShareActivity(
        @Body request: TrackShareRequest
    ): TrackShareResponse

    @GET("seo-metadata")
    suspend fun getSeoMetadata(
        @Query("page") page: String,
        @Query("data") data: Map<String, String>? = null
    ): SeoMetadataResponse
}

data class LandingContentResponse(
    val success: Boolean,
    val data: LandingContentData
)

data class LandingContentData(
    val highlights: Highlights,
    val statistics: Statistics,
    val popularCategories: List<PopularCategory>
)

data class Highlights(
    val trending: List<TrendingEvent>,
    val featured: List<TrendingEvent>,
    val thisWeekend: List<TrendingEvent>,
    val offers: List<Offer>
)

data class TrendingEvent(
    val id: String,
    val title: String,
    val category: String,
    val location: EventLocation,
    val thumbnail: String,
    val date: String
)

data class Statistics(
    val totalEvents: String,
    val activeOffers: String,
    val cities: String,
    val categories: String
)

data class PopularCategory(
    val name: String,
    val count: Int,
    val icon: String
)

data class TrackActivityRequest(
    val sessionId: String,
    val activity: ActivityData
)

data class ActivityData(
    val type: String,
    val eventId: String?,
    val category: String?,
    val timestamp: String
)

data class TrackActivityResponse(
    val success: Boolean,
    val data: PromptData
)

data class PromptData(
    val shouldPrompt: Boolean,
    val prompt: SignupPrompt?
)

data class SignupPrompt(
    val title: String,
    val message: String,
    val benefits: List<String>,
    val cta: String
)

data class ShareContentResponse(
    val success: Boolean,
    val data: ShareContentData
)

data class ShareContentData(
    val whatsapp: SharePlatform,
    val twitter: SharePlatform,
    val facebook: SharePlatform
)

data class SharePlatform(
    val text: String,
    val quote: String? = null,
    val hashtag: String? = null
)

data class TrackShareRequest(
    val eventId: String,
    val platform: String,
    val shareId: String,
    val referrer: String? = null
)

data class TrackShareResponse(
    val success: Boolean,
    val data: ShareMetrics
)

data class ShareMetrics(
    val shares: Int,
    val views: Int,
    val signups: Int
)

data class SeoMetadataResponse(
    val success: Boolean,
    val data: SeoMetadata
)

data class SeoMetadata(
    val title: String,
    val description: String,
    val keywords: List<String>,
    val structuredData: Map<String, Any>
) 