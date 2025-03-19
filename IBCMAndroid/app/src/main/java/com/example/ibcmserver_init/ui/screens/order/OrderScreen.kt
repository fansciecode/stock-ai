package com.example.ibcmserver_init.ui.screens.order

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.order.OrderStatus
import com.example.ibcmserver_init.data.model.order.OrderSummary
import com.example.ibcmserver_init.ui.components.LoadingDialog
import com.example.ibcmserver_init.ui.viewmodel.OrderViewModel

@Composable
fun OrderScreen(
    userId: String,
    onNavigateToOrderDetails: (String) -> Unit,
    viewModel: OrderViewModel = hiltViewModel()
) {
    var selectedStatus by remember { mutableStateOf<OrderStatus?>(null) }
    val ordersState by viewModel.ordersState.collectAsState()

    LaunchedEffect(userId, selectedStatus) {
        viewModel.getUserOrders(userId, selectedStatus)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("My Orders") },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            StatusFilter(
                selectedStatus = selectedStatus,
                onStatusSelected = { selectedStatus = it }
            )

            when (ordersState) {
                is NetworkResult.Loading -> LoadingDialog()
                is NetworkResult.Success -> {
                    val orders = (ordersState as NetworkResult.Success<List<OrderSummary>>).data
                    OrderList(
                        orders = orders,
                        onOrderClick = onNavigateToOrderDetails
                    )
                }
                is NetworkResult.Error -> {
                    Box(
                        modifier = Modifier.fillMaxSize(),
                        contentAlignment = Alignment.Center
                    ) {
                        Text(
                            text = (ordersState as NetworkResult.Error).message ?: "Unknown error",
                            color = MaterialTheme.colorScheme.error
                        )
                    }
                }
                else -> Unit
            }
        }
    }
}

@Composable
private fun StatusFilter(
    selectedStatus: OrderStatus?,
    onStatusSelected: (OrderStatus?) -> Unit
) {
    val statuses = OrderStatus.values().toList()

    Column(modifier = Modifier.padding(16.dp)) {
        Text(
            text = "Filter by Status",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        Row(
            modifier = Modifier
                .horizontalScroll(rememberScrollState())
                .padding(vertical = 8.dp)
        ) {
            FilterChip(
                selected = selectedStatus == null,
                onClick = { onStatusSelected(null) },
                label = { Text("All") },
                modifier = Modifier.padding(end = 8.dp)
            )

            statuses.forEach { status ->
                FilterChip(
                    selected = selectedStatus == status,
                    onClick = { onStatusSelected(status) },
                    label = { Text(status.name) },
                    modifier = Modifier.padding(end = 8.dp)
                )
            }
        }
    }
}

@Composable
private fun OrderList(
    orders: List<OrderSummary>,
    onOrderClick: (String) -> Unit
) {
    if (orders.isEmpty()) {
        Box(
            modifier = Modifier.fillMaxSize(),
            contentAlignment = Alignment.Center
        ) {
            Text("No orders found")
        }
    } else {
        LazyColumn(
            modifier = Modifier.fillMaxSize(),
            contentPadding = PaddingValues(16.dp),
            verticalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            items(orders) { order ->
                OrderCard(order = order, onClick = { onOrderClick(order.orderId) })
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OrderCard(
    order: OrderSummary,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Order #${order.orderId}",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = order.orderDate,
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = "Items: ${order.itemCount}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "$${order.totalAmount}",
                    style = MaterialTheme.typography.titleMedium
                )
            }

            Spacer(modifier = Modifier.height(8.dp))

            Surface(
                color = when (order.status) {
                    OrderStatus.COMPLETED -> MaterialTheme.colorScheme.primary
                    OrderStatus.PROCESSING -> MaterialTheme.colorScheme.secondary
                    OrderStatus.CANCELLED -> MaterialTheme.colorScheme.error
                    else -> MaterialTheme.colorScheme.surfaceVariant
                },
                shape = MaterialTheme.shapes.small
            ) {
                Text(
                    text = order.status.name,
                    modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            }
        }
    }
} 