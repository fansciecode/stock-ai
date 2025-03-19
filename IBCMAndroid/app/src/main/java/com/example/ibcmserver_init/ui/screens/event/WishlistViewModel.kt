package com.example.ibcmserver_init.ui.screens.event

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class WishlistState(
    val wishlistedProducts: Set<String> = emptySet(),
    val isLoading: Boolean = false,
    val error: String? = null
)

class WishlistViewModel : ViewModel() {
    private val _wishlistState = MutableStateFlow(WishlistState())
    val wishlistState: StateFlow<WishlistState> = _wishlistState

    fun toggleWishlist(productId: String) {
        _wishlistState.update { currentState ->
            val updatedProducts = currentState.wishlistedProducts.toMutableSet()
            if (productId in updatedProducts) {
                updatedProducts.remove(productId)
            } else {
                updatedProducts.add(productId)
            }
            currentState.copy(wishlistedProducts = updatedProducts)
        }
        // TODO: Sync with backend
    }

    fun addToWishlist(productId: String) {
        _wishlistState.update { currentState ->
            val updatedProducts = currentState.wishlistedProducts.toMutableSet()
            updatedProducts.add(productId)
            currentState.copy(wishlistedProducts = updatedProducts)
        }
        // TODO: Sync with backend
    }

    fun removeFromWishlist(productId: String) {
        _wishlistState.update { currentState ->
            val updatedProducts = currentState.wishlistedProducts.toMutableSet()
            updatedProducts.remove(productId)
            currentState.copy(wishlistedProducts = updatedProducts)
        }
        // TODO: Sync with backend
    }

    fun clearWishlist() {
        _wishlistState.update { it.copy(wishlistedProducts = emptySet()) }
        // TODO: Sync with backend
    }

    fun loadWishlist() {
        viewModelScope.launch {
            _wishlistState.update { it.copy(isLoading = true) }
            try {
                // TODO: Load from backend
                _wishlistState.update { it.copy(isLoading = false) }
            } catch (e: Exception) {
                _wishlistState.update { 
                    it.copy(
                        isLoading = false,
                        error = "Failed to load wishlist"
                    )
                }
            }
        }
    }
} 