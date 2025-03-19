package com.example.ibcmserver_init.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.event.Product
import com.example.ibcmserver_init.data.repository.EnhancedEventRepository
import com.example.ibcmserver_init.utils.NetworkResult
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.collectLatest
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class ProductDetailsViewModel @Inject constructor(
    private val repository: EnhancedEventRepository
) : ViewModel() {

    private val _productState = MutableStateFlow<NetworkResult<Product>>(NetworkResult.Initial())
    val productState: StateFlow<NetworkResult<Product>> = _productState

    private val _orderState = MutableStateFlow<NetworkResult<Unit>>(NetworkResult.Initial())
    val orderState: StateFlow<NetworkResult<Unit>> = _orderState

    fun loadProduct(productId: String) {
        viewModelScope.launch {
            _productState.value = NetworkResult.Loading()
            try {
                repository.getProduct(productId).collectLatest { result ->
                    _productState.value = result
                }
            } catch (e: Exception) {
                _productState.value = NetworkResult.Error("Failed to load product: ${e.message}")
            }
        }
    }

    fun placeOrder(eventId: String, productId: String, quantity: Int) {
        viewModelScope.launch {
            _orderState.value = NetworkResult.Loading()
            try {
                repository.placeProductOrder(eventId, productId, quantity).collectLatest { result ->
                    _orderState.value = result
                }
            } catch (e: Exception) {
                _orderState.value = NetworkResult.Error("Failed to place order: ${e.message}")
            }
        }
    }

    fun resetOrderState() {
        _orderState.value = NetworkResult.Initial()
    }
} 