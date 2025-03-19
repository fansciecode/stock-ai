package com.example.ibcmserver_init.ui.screens.search

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.repository.SearchRepository
import com.example.ibcmserver_init.domain.model.SearchResult
import com.example.ibcmserver_init.domain.model.SearchFilter
import com.example.ibcmserver_init.domain.model.SearchSuggestion
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.asStateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch
import javax.inject.Inject

data class SearchUiState(
    val query: String = "",
    val results: List<SearchResult> = emptyList(),
    val suggestions: List<SearchSuggestion> = emptyList(),
    val filters: List<SearchFilter> = emptyList(),
    val selectedFilters: Set<String> = emptySet(),
    val isLoading: Boolean = false,
    val error: String? = null,
    val searchHistory: List<String> = emptyList(),
    val timeBasedResults: List<SearchResult> = emptyList(),
    val locationBasedResults: List<SearchResult> = emptyList(),
    val priceBasedResults: List<SearchResult> = emptyList(),
    val showVoiceSearch: Boolean = false,
    val isVoiceSearchActive: Boolean = false
)

@HiltViewModel
class SearchViewModel @Inject constructor(
    private val searchRepository: SearchRepository
) : ViewModel() {

    private val _uiState = MutableStateFlow(SearchUiState())
    val uiState: StateFlow<SearchUiState> = _uiState.asStateFlow()

    init {
        loadInitialData()
    }

    private fun loadInitialData() {
        viewModelScope.launch {
            try {
                val filters = searchRepository.getSmartFilters()
                val history = searchRepository.getSearchHistory()
                _uiState.update { state ->
                    state.copy(
                        filters = filters,
                        searchHistory = history,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }

    fun onQueryChange(query: String) {
        _uiState.update { it.copy(query = query) }
        if (query.isNotEmpty()) {
            getSuggestions(query)
        } else {
            _uiState.update { it.copy(suggestions = emptyList()) }
        }
    }

    private fun getSuggestions(query: String) {
        viewModelScope.launch {
            try {
                val suggestions = searchRepository.getSearchSuggestions(query)
                _uiState.update { it.copy(suggestions = suggestions) }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message) }
            }
        }
    }

    fun search(query: String = _uiState.value.query) {
        viewModelScope.launch {
            _uiState.update { it.copy(isLoading = true, error = null) }
            try {
                val results = searchRepository.enhancedSearch(
                    query = query,
                    filters = _uiState.value.selectedFilters
                )
                _uiState.update { state ->
                    state.copy(
                        results = results.generalResults,
                        timeBasedResults = results.timeBasedResults,
                        locationBasedResults = results.locationBasedResults,
                        priceBasedResults = results.priceBasedResults,
                        isLoading = false
                    )
                }
            } catch (e: Exception) {
                _uiState.update { it.copy(error = e.message, isLoading = false) }
            }
        }
    }

    fun toggleFilter(filterId: String) {
        _uiState.update { state ->
            val newFilters = state.selectedFilters.toMutableSet()
            if (newFilters.contains(filterId)) {
                newFilters.remove(filterId)
            } else {
                newFilters.add(filterId)
            }
            state.copy(selectedFilters = newFilters)
        }
        search() // Refresh search with new filters
    }

    fun startVoiceSearch() {
        _uiState.update { it.copy(showVoiceSearch = true, isVoiceSearchActive = true) }
    }

    fun processVoiceResult(text: String) {
        _uiState.update { 
            it.copy(
                query = text,
                showVoiceSearch = false,
                isVoiceSearchActive = false
            )
        }
        search(text)
    }

    fun cancelVoiceSearch() {
        _uiState.update { it.copy(showVoiceSearch = false, isVoiceSearchActive = false) }
    }

    fun clearError() {
        _uiState.update { it.copy(error = null) }
    }

    fun clearSearch() {
        _uiState.update { 
            it.copy(
                query = "",
                results = emptyList(),
                suggestions = emptyList(),
                timeBasedResults = emptyList(),
                locationBasedResults = emptyList(),
                priceBasedResults = emptyList()
            )
        }
    }
} 