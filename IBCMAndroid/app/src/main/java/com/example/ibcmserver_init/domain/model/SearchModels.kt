package com.example.ibcmserver_init.domain.model

data class SearchResult(
    val id: String,
    val title: String,
    val description: String,
    val category: String,
    val price: String,
    val imageUrl: String? = null,
    val rating: Float? = null,
    val distance: String? = null,
    val timeToEvent: String? = null,
    val metadata: Map<String, Any> = emptyMap()
)

data class SearchFilter(
    val id: String,
    val name: String,
    val type: FilterType,
    val options: List<FilterOption> = emptyList()
)

data class FilterOption(
    val id: String,
    val name: String,
    val count: Int = 0
)

enum class FilterType {
    CATEGORY,
    PRICE_RANGE,
    DATE_RANGE,
    LOCATION,
    RATING,
    CUSTOM
}

data class SearchSuggestion(
    val text: String,
    val type: SuggestionType,
    val metadata: Map<String, Any> = emptyMap()
)

enum class SuggestionType {
    HISTORY,
    TRENDING,
    CATEGORY,
    LOCATION,
    AI_GENERATED
}

data class SearchResponse(
    val generalResults: List<SearchResult>,
    val timeBasedResults: List<SearchResult>,
    val locationBasedResults: List<SearchResult>,
    val priceBasedResults: List<SearchResult>,
    val totalResults: Int,
    val appliedFilters: List<SearchFilter>,
    val suggestions: List<SearchSuggestion>
)

data class SearchInsights(
    val popularCategories: List<CategoryInsight>,
    val priceRanges: List<PriceRangeInsight>,
    val timePatterns: List<TimePatternInsight>,
    val locationHotspots: List<LocationHotspot>
)

data class CategoryInsight(
    val category: String,
    val count: Int,
    val trend: TrendDirection,
    val popularTimes: List<PopularTime>
)

data class PriceRangeInsight(
    val range: String,
    val minPrice: Double,
    val maxPrice: Double,
    val count: Int,
    val trend: TrendDirection
)

data class TimePatternInsight(
    val dayOfWeek: Int,
    val hourOfDay: Int,
    val popularity: Float,
    val trend: TrendDirection
)

data class LocationHotspot(
    val name: String,
    val latitude: Double,
    val longitude: Double,
    val popularity: Float,
    val trend: TrendDirection
)

data class PopularTime(
    val dayOfWeek: Int,
    val hourOfDay: Int,
    val popularity: Float
)

enum class TrendDirection {
    UP,
    DOWN,
    STABLE
} 