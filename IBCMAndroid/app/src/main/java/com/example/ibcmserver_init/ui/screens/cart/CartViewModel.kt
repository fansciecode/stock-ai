package com.example.ibcmserver_init.ui.screens.cart

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.ui.screens.event.ProductData
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.update
import kotlinx.coroutines.launch

data class CartState(
    val items: List<CartItem> = emptyList(),
    val totalAmount: Double = 0.0,
    val promoCode: String = "",
    val promoDiscount: Double = 0.0,
    val isLoading: Boolean = false,
    val error: String? = null
)

class CartViewModel : ViewModel() {
    private val _cartState = MutableStateFlow(CartState())
    val cartState: StateFlow<CartState> = _cartState

    fun addToCart(product: ProductData, quantity: Int = 1) {
        _cartState.update { currentState ->
            val currentItems = currentState.items.toMutableList()
            val existingItem = currentItems.find { it.product.id == product.id }

            if (existingItem != null) {
                val newQuantity = (existingItem.quantity + quantity).coerceAtMost(product.maxQuantity)
                val itemIndex = currentItems.indexOf(existingItem)
                currentItems[itemIndex] = existingItem.copy(quantity = newQuantity)
            } else {
                currentItems.add(CartItem(product, quantity.coerceAtMost(product.maxQuantity)))
            }

            currentState.copy(
                items = currentItems,
                totalAmount = calculateTotal(currentItems, currentState.promoDiscount)
            )
        }
    }

    fun updateQuantity(product: ProductData, quantity: Int) {
        _cartState.update { currentState ->
            val currentItems = currentState.items.toMutableList()
            val existingItem = currentItems.find { it.product.id == product.id }

            if (existingItem != null) {
                val itemIndex = currentItems.indexOf(existingItem)
                currentItems[itemIndex] = existingItem.copy(
                    quantity = quantity.coerceIn(1, product.maxQuantity)
                )
            }

            currentState.copy(
                items = currentItems,
                totalAmount = calculateTotal(currentItems, currentState.promoDiscount)
            )
        }
    }

    fun removeFromCart(product: ProductData) {
        _cartState.update { currentState ->
            val currentItems = currentState.items.filterNot { it.product.id == product.id }
            currentState.copy(
                items = currentItems,
                totalAmount = calculateTotal(currentItems, currentState.promoDiscount)
            )
        }
    }

    fun clearCart() {
        _cartState.update { it.copy(
            items = emptyList(),
            totalAmount = 0.0,
            promoCode = "",
            promoDiscount = 0.0
        ) }
    }

    fun applyPromoCode(code: String) {
        viewModelScope.launch {
            _cartState.update { it.copy(isLoading = true) }
            
            try {
                // TODO: Validate promo code with backend
                val discount = when (code.uppercase()) {
                    "WELCOME10" -> 0.10
                    "SPECIAL20" -> 0.20
                    else -> 0.0
                }

                _cartState.update { currentState ->
                    currentState.copy(
                        promoCode = if (discount > 0) code else "",
                        promoDiscount = discount,
                        totalAmount = calculateTotal(currentState.items, discount),
                        isLoading = false,
                        error = if (discount == 0.0) "Invalid promo code" else null
                    )
                }
            } catch (e: Exception) {
                _cartState.update { it.copy(
                    isLoading = false,
                    error = "Failed to apply promo code"
                ) }
            }
        }
    }

    private fun calculateTotal(items: List<CartItem>, promoDiscount: Double): Double {
        val subtotal = items.sumOf { item ->
            val price = item.product.price.removePrefix("₹").toDoubleOrNull() ?: 0.0
            price * item.quantity
        }
        return subtotal * (1 - promoDiscount)
    }
} 