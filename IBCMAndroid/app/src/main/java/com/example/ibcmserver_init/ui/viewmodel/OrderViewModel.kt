package com.example.ibcmserver_init.ui.viewmodel

import androidx.lifecycle.ViewModel
import androidx.lifecycle.viewModelScope
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.order.*
import com.example.ibcmserver_init.data.repository.OrderRepository
import dagger.hilt.android.lifecycle.HiltViewModel
import kotlinx.coroutines.flow.MutableStateFlow
import kotlinx.coroutines.flow.StateFlow
import kotlinx.coroutines.flow.catch
import kotlinx.coroutines.launch
import javax.inject.Inject

@HiltViewModel
class OrderViewModel @Inject constructor(
    private val orderRepository: OrderRepository
) : ViewModel() {

    private val _orderState = MutableStateFlow<NetworkResult<Order>>(NetworkResult.Initial())
    val orderState: StateFlow<NetworkResult<Order>> = _orderState

    private val _ordersState = MutableStateFlow<NetworkResult<List<Order>>>(NetworkResult.Initial())
    val ordersState: StateFlow<NetworkResult<List<Order>>> = _ordersState

    private val _settlementState = MutableStateFlow<NetworkResult<SettlementDetails>>(NetworkResult.Initial())
    val settlementState: StateFlow<NetworkResult<SettlementDetails>> = _settlementState

    private val _settlementsState = MutableStateFlow<NetworkResult<List<SettlementDetails>>>(NetworkResult.Initial())
    val settlementsState: StateFlow<NetworkResult<List<SettlementDetails>>> = _settlementsState

    fun createOrder(order: Order) {
        viewModelScope.launch {
            orderRepository.createOrder(order)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun getOrder(orderId: String) {
        viewModelScope.launch {
            orderRepository.getOrder(orderId)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun updateOrderStatus(orderId: String, status: OrderStatus) {
        viewModelScope.launch {
            orderRepository.updateOrderStatus(orderId, status)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun updateDeliveryDetails(orderId: String, details: DeliveryDetails) {
        viewModelScope.launch {
            orderRepository.updateDeliveryDetails(orderId, details)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun processCreatorSettlement(orderId: String) {
        viewModelScope.launch {
            orderRepository.processCreatorSettlement(orderId)
                .catch { e -> _settlementState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _settlementState.value = it }
        }
    }

    fun getCreatorSettlements(creatorId: String) {
        viewModelScope.launch {
            orderRepository.getCreatorSettlements(creatorId)
                .catch { e -> _settlementsState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _settlementsState.value = it }
        }
    }

    fun requestRefund(orderId: String, request: RefundDetails) {
        viewModelScope.launch {
            orderRepository.requestRefund(orderId, request)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun updateTrackingInfo(orderId: String, trackingInfo: TrackingInfo) {
        viewModelScope.launch {
            orderRepository.updateTrackingInfo(orderId, trackingInfo)
                .catch { e -> _orderState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _orderState.value = it }
        }
    }

    fun getCustomerOrders(customerId: String) {
        viewModelScope.launch {
            orderRepository.getCustomerOrders(customerId)
                .catch { e -> _ordersState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _ordersState.value = it }
        }
    }

    fun getCreatorOrders(creatorId: String) {
        viewModelScope.launch {
            orderRepository.getCreatorOrders(creatorId)
                .catch { e -> _ordersState.value = NetworkResult.Error(e.message ?: "Unknown error") }
                .collect { _ordersState.value = it }
        }
    }

    fun resetStates() {
        _orderState.value = NetworkResult.Initial()
        _ordersState.value = NetworkResult.Initial()
        _settlementState.value = NetworkResult.Initial()
        _settlementsState.value = NetworkResult.Initial()
    }
} 