interface ExternalEventsApi {
    @GET("external/events/search")
    suspend fun searchNearbyEvents(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 5,
        @Query("type") type: String? = null,
        @Query("keyword") keyword: String? = null
    ): ExternalEventsSearchResponse

    @GET("external/events/{source}/{id}")
    suspend fun getEventDetails(
        @Path("source") source: String,
        @Path("id") id: String
    ): ExternalEventDetailsResponse

    @GET("external/offers/search")
    suspend fun searchOffers(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 5,
        @Query("category") category: String? = null
    ): OffersSearchResponse

    @GET("external/events/category")
    suspend fun searchByCategory(
        @Query("latitude") latitude: Double,
        @Query("longitude") longitude: Double,
        @Query("radius") radius: Int = 5,
        @Query("category") category: String,
        @Query("subcategory") subcategory: String? = null
    ): CategorySearchResponse
}

data class ExternalEventsSearchResponse(
    val success: Boolean,
    val count: Int,
    val data: List<ExternalEventData>
)

data class ExternalEventData(
    val id: String,
    val name: String,
    val location: EventLocation,
    val type: String,
    val rating: Double,
    val photos: List<String>,
    val openNow: Boolean,
    val priceLevel: Int
)

data class EventLocation(
    val lat: Double,
    val lng: Double,
    val address: String
)

data class ExternalEventDetailsResponse(
    val success: Boolean,
    val data: ExternalEventDetails
)

data class ExternalEventDetails(
    val id: String,
    val name: String,
    val description: String,
    val location: EventLocation,
    val photos: List<String>,
    val rating: Double,
    val internalRating: Double,
    val totalInternalReviews: Int,
    val openingHours: List<String>,
    val website: String?,
    val phoneNumber: String?
)

data class OffersSearchResponse(
    val success: Boolean,
    val data: OffersData
)

data class OffersData(
    val localOffers: List<LocalOffer>,
    val onlineOffers: List<OnlineOffer>
)

data class LocalOffer(
    val id: String,
    val title: String,
    val description: String,
    val venue: String,
    val location: EventLocation,
    val expiryDate: String
)

data class OnlineOffer(
    val id: String,
    val title: String,
    val platform: String,
    val category: String,
    val couponCode: String,
    val expiryDate: String
)

data class CategorySearchResponse(
    val success: Boolean,
    val data: List<CategoryEventData>
)

data class CategoryEventData(
    val id: String,
    val source: String,
    val type: String,
    val title: String,
    val address: String,
    val location: EventLocation,
    val rating: Double,
    val totalRatings: Int,
    val photos: List<String>,
    val openNow: Boolean,
    val category: String,
    val types: List<String>
) 