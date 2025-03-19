package com.example.ibcmserver_init.data.repository

import com.example.ibcmserver_init.data.api.SearchApi
import com.example.ibcmserver_init.data.local.SearchDao
import com.example.ibcmserver_init.domain.model.*
import kotlinx.coroutines.flow.Flow
import kotlinx.coroutines.flow.flow
import javax.inject.Inject
import javax.inject.Singleton

@Singleton
class SearchRepository @Inject constructor(
    private val searchApi: SearchApi,
    private val searchDao: SearchDao
) {
    suspend fun enhancedSearch(
        query: String,
        filters: Set<String> = emptySet()
    ): SearchResponse {
        return try {
            // Call the enhanced search API
            val response = searchApi.enhancedSearch(query, filters.toList())
            
            // Save to search history
            searchDao.insertSearchQuery(query)
            
            response
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun getSearchSuggestions(query: String): List<SearchSuggestion> {
        return try {
            searchApi.getSearchSuggestions(query)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getSmartFilters(): List<SearchFilter> {
        return try {
            searchApi.getSmartFilters()
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun getSearchHistory(): List<String> {
        return searchDao.getSearchHistory()
    }

    suspend fun getSearchInsights(): Flow<SearchInsights> = flow {
        try {
            val insights = searchApi.getSearchInsights()
            emit(insights)
        } catch (e: Exception) {
            // Log error but don't throw - insights are non-critical
            emit(SearchInsights(
                popularCategories = emptyList(),
                priceRanges = emptyList(),
                timePatterns = emptyList(),
                locationHotspots = emptyList()
            ))
        }
    }

    suspend fun processVoiceSearch(audioData: ByteArray): String {
        return try {
            searchApi.processVoiceSearch(audioData)
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun getLocationRecommendations(
        latitude: Double,
        longitude: Double
    ): List<SearchResult> {
        return try {
            searchApi.getLocationRecommendations(latitude, longitude)
        } catch (e: Exception) {
            emptyList()
        }
    }

    suspend fun clearSearchHistory() {
        searchDao.clearSearchHistory()
    }

    suspend fun deleteSearchQuery(query: String) {
        searchDao.deleteSearchQuery(query)
    }

    suspend fun getOptimizedResults(query: String): Flow<SearchResponse> = flow {
        try {
            val optimizedResults = searchApi.getOptimizedResults(query)
            emit(optimizedResults)
        } catch (e: Exception) {
            throw e
        }
    }

    suspend fun getPersonalizedRecommendations(): Flow<List<SearchResult>> = flow {
        try {
            val recommendations = searchApi.getPersonalizedRecommendations()
            emit(recommendations)
        } catch (e: Exception) {
            emit(emptyList())
        }
    }

    suspend fun improveSearchResults(
        query: String,
        selectedResult: SearchResult
    ) {
        try {
            searchApi.improveResults(query, selectedResult)
        } catch (e: Exception) {
            // Log error but don't throw - learning feedback is non-critical
        }
    }
} 