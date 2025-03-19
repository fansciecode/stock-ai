package com.example.ibcmserver_init.ui.screens.order

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.order.*
import com.example.ibcmserver_init.ui.components.LoadingDialog
import com.example.ibcmserver_init.ui.viewmodel.OrderViewModel

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderDetailsScreen(
    orderId: String,
    onNavigateBack: () -> Unit,
    viewModel: OrderViewModel = hiltViewModel()
) {
    val orderState by viewModel.orderState.collectAsState()
    val paymentState by viewModel.paymentState.collectAsState()
    var showPaymentDialog by remember { mutableStateOf(false) }
    var showRefundDialog by remember { mutableStateOf(false) }

    LaunchedEffect(orderId) {
        viewModel.getOrder(orderId)
        viewModel.getPaymentStatus(orderId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Order Details") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                colors = TopAppBarDefaults.topAppBarColors(
                    containerColor = MaterialTheme.colorScheme.primary,
                    titleContentColor = MaterialTheme.colorScheme.onPrimary,
                    navigationIconContentColor = MaterialTheme.colorScheme.onPrimary
                )
            )
        }
    ) { paddingValues ->
        when (orderState) {
            is NetworkResult.Loading -> LoadingDialog()
            is NetworkResult.Success -> {
                val order = (orderState as NetworkResult.Success<Order>).data
                OrderContent(
                    order = order,
                    paymentState = paymentState,
                    onPaymentClick = { showPaymentDialog = true },
                    onRefundClick = { showRefundDialog = true },
                    onCancelOrder = { viewModel.cancelOrder(orderId) },
                    modifier = Modifier.padding(paddingValues)
                )

                if (showPaymentDialog) {
                    PaymentDialog(
                        order = order,
                        onDismiss = { showPaymentDialog = false },
                        onPaymentSubmit = { paymentInfo ->
                            viewModel.processPayment(orderId, paymentInfo)
                            showPaymentDialog = false
                        }
                    )
                }

                if (showRefundDialog) {
                    RefundDialog(
                        onDismiss = { showRefundDialog = false },
                        onRefundSubmit = { reason, amount ->
                            viewModel.requestRefund(orderId, reason, amount)
                            showRefundDialog = false
                        }
                    )
                }
            }
            is NetworkResult.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(paddingValues),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = (orderState as NetworkResult.Error).message ?: "Unknown error",
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            else -> Unit
        }
    }
}

@Composable
private fun OrderContent(
    order: Order,
    paymentState: NetworkResult<PaymentInfo>,
    onPaymentClick: () -> Unit,
    onRefundClick: () -> Unit,
    onCancelOrder: () -> Unit,
    modifier: Modifier = Modifier
) {
    Column(
        modifier = modifier
            .fillMaxSize()
            .verticalScroll(rememberScrollState())
            .padding(16.dp)
    ) {
        OrderHeader(order)
        Spacer(modifier = Modifier.height(16.dp))
        OrderItems(order)
        Spacer(modifier = Modifier.height(16.dp))
        PaymentSection(paymentState, onPaymentClick)
        Spacer(modifier = Modifier.height(16.dp))
        ActionButtons(
            orderStatus = order.status,
            onRefundClick = onRefundClick,
            onCancelOrder = onCancelOrder
        )
    }
}

@Composable
private fun OrderHeader(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            Text(
                text = "Order #${order.id}",
                style = MaterialTheme.typography.titleLarge
            )
            Spacer(modifier = Modifier.height(8.dp))
            Text(
                text = "Created: ${order.createdAt}",
                style = MaterialTheme.typography.bodyMedium
            )
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

@Composable
private fun OrderItems(order: Order) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            Text(
                text = "Order Items",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            when (order.orderType) {
                is OrderType.TicketOrder -> TicketOrderDetails(order.orderType)
                is OrderType.ProductOrder -> ProductOrderDetails(order.orderType)
                is OrderType.ServiceOrder -> ServiceOrderDetails(order.orderType)
            }
        }
    }
}

@Composable
private fun PaymentSection(
    paymentState: NetworkResult<PaymentInfo>,
    onPaymentClick: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth()
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            Text(
                text = "Payment",
                style = MaterialTheme.typography.titleMedium
            )
            Spacer(modifier = Modifier.height(8.dp))
            when (paymentState) {
                is NetworkResult.Success -> {
                    val payment = paymentState.data
                    PaymentDetails(payment)
                }
                is NetworkResult.Error -> {
                    Text(
                        text = paymentState.message ?: "Payment information unavailable",
                        color = MaterialTheme.colorScheme.error
                    )
                    Button(
                        onClick = onPaymentClick,
                        modifier = Modifier.fillMaxWidth()
                    ) {
                        Text("Make Payment")
                    }
                }
                else -> CircularProgressIndicator()
            }
        }
    }
}

@Composable
private fun ActionButtons(
    orderStatus: OrderStatus,
    onRefundClick: () -> Unit,
    onCancelOrder: () -> Unit
) {
    Row(
        modifier = Modifier.fillMaxWidth(),
        horizontalArrangement = Arrangement.SpaceEvenly
    ) {
        if (orderStatus == OrderStatus.COMPLETED) {
            Button(
                onClick = onRefundClick,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.secondary
                )
            ) {
                Text("Request Refund")
            }
        }
        
        if (orderStatus == OrderStatus.PENDING || orderStatus == OrderStatus.PROCESSING) {
            Button(
                onClick = onCancelOrder,
                colors = ButtonDefaults.buttonColors(
                    containerColor = MaterialTheme.colorScheme.error
                )
            ) {
                Text("Cancel Order")
            }
        }
    }
}

@Composable
private fun PaymentDetails(payment: PaymentInfo) {
    Column {
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Amount:")
            Text("$${payment.amount}")
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Method:")
            Text(payment.method.name)
        }
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Text("Status:")
            Text(payment.status.name)
        }
        if (payment.transactionId.isNotEmpty()) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Transaction ID:")
                Text(payment.transactionId)
            }
        }
    }
}

@Composable
private fun TicketOrderDetails(ticketOrder: OrderType.TicketOrder) {
    Column {
        Text("Event ID: ${ticketOrder.eventId}")
        Text("Total Seats: ${ticketOrder.totalSeats}")
        Spacer(modifier = Modifier.height(8.dp))
        Text("Tickets:", style = MaterialTheme.typography.titleSmall)
        ticketOrder.tickets.forEach { ticket ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("Ticket ID: ${ticket.ticketId}")
                    Text("Type: ${ticket.ticketType}")
                    Text("Seat: ${ticket.seatInfo.section} - ${ticket.seatInfo.row}${ticket.seatInfo.seatNumber}")
                    Text("Price: $${ticket.price}")
                }
            }
        }
    }
}

@Composable
private fun ProductOrderDetails(productOrder: OrderType.ProductOrder) {
    Column {
        Text("Event ID: ${productOrder.eventId}")
        Spacer(modifier = Modifier.height(8.dp))
        Text("Products:", style = MaterialTheme.typography.titleSmall)
        productOrder.products.forEach { product ->
            Card(
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Column(modifier = Modifier.padding(8.dp)) {
                    Text("Product ID: ${product.productId}")
                    Text("Quantity: ${product.quantity}")
                    Text("Price: $${product.price}")
                    if (product.customizations.isNotEmpty()) {
                        Text("Customizations:", style = MaterialTheme.typography.titleSmall)
                        product.customizations.forEach { (key, value) ->
                            Text("$key: $value")
                        }
                    }
                }
            }
        }
        Spacer(modifier = Modifier.height(8.dp))
        Text("Delivery Details:", style = MaterialTheme.typography.titleSmall)
        with(productOrder.deliveryDetails) {
            Text("Method: ${method.name}")
            Text("Contact: $contactNumber")
            if (instructions.isNotEmpty()) {
                Text("Instructions: $instructions")
            }
            with(address) {
                Text("Address:")
                Text("$street")
                Text("$city, $state $postalCode")
                Text(country)
                if (additionalInfo.isNotEmpty()) {
                    Text("Additional Info: $additionalInfo")
                }
            }
        }
    }
}

@Composable
private fun ServiceOrderDetails(serviceOrder: OrderType.ServiceOrder) {
    Column {
        Text("Service ID: ${serviceOrder.serviceId}")
        Text("Provider ID: ${serviceOrder.providerId}")
        Text("Appointment Time: ${serviceOrder.appointmentTime}")
        Text("Duration: ${serviceOrder.duration} minutes")
    }
}

@Composable
private fun PaymentDialog(
    order: Order,
    onDismiss: () -> Unit,
    onPaymentSubmit: (PaymentInfo) -> Unit
) {
    var selectedMethod by remember { mutableStateOf(PaymentMethod.CREDIT_CARD) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Payment Details") },
        text = {
            Column {
                Text("Amount: $${order.payment.amount}")
                Spacer(modifier = Modifier.height(16.dp))
                Text("Select Payment Method:")
                PaymentMethod.values().forEach { method ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .padding(vertical = 4.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = selectedMethod == method,
                            onClick = { selectedMethod = method }
                        )
                        Text(method.name)
                    }
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    onPaymentSubmit(
                        PaymentInfo(
                            amount = order.payment.amount,
                            method = selectedMethod,
                            status = PaymentStatus.PENDING
                        )
                    )
                }
            ) {
                Text("Proceed")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
private fun RefundDialog(
    onDismiss: () -> Unit,
    onRefundSubmit: (String, Double) -> Unit
) {
    var reason by remember { mutableStateOf("") }
    var amount by remember { mutableStateOf("") }
    var showError by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Request Refund") },
        text = {
            Column {
                OutlinedTextField(
                    value = reason,
                    onValueChange = { reason = it },
                    label = { Text("Reason") },
                    modifier = Modifier.fillMaxWidth()
                )
                Spacer(modifier = Modifier.height(8.dp))
                OutlinedTextField(
                    value = amount,
                    onValueChange = { amount = it },
                    label = { Text("Amount") },
                    modifier = Modifier.fillMaxWidth()
                )
                if (showError) {
                    Text(
                        text = "Please fill all fields correctly",
                        color = MaterialTheme.colorScheme.error,
                        modifier = Modifier.padding(top = 8.dp)
                    )
                }
            }
        },
        confirmButton = {
            Button(
                onClick = {
                    val amountDouble = amount.toDoubleOrNull()
                    if (reason.isNotBlank() && amountDouble != null) {
                        onRefundSubmit(reason, amountDouble)
                    } else {
                        showError = true
                    }
                }
            ) {
                Text("Submit")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 