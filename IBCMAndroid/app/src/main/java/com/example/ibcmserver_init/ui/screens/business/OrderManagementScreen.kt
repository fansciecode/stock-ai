package com.example.ibcmserver_init.ui.screens.business

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.ui.components.*
import com.example.ibcmserver_init.ui.theme.IBCMTheme
import java.text.NumberFormat
import java.util.*
import androidx.compose.foundation.Image
import androidx.compose.material.icons.filled.QrCodeScanner
import androidx.compose.ui.graphics.asImageBitmap
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.res.painterResource
import com.google.zxing.BarcodeFormat
import com.google.zxing.qrcode.QRCodeWriter
import com.google.zxing.common.BitMatrix
import com.google.zxing.BinaryBitmap
import com.google.zxing.MultiFormatReader
import com.google.zxing.client.android.BeepManager
import com.journeyapps.barcodescanner.BarcodeCallback
import com.journeyapps.barcodescanner.DecoratedBarcodeView
import com.journeyapps.barcodescanner.DefaultDecoderFactory
import android.graphics.Bitmap
import android.graphics.Color
import androidx.compose.runtime.remember
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.graphics.toArgb
import androidx.compose.ui.viewinterop.AndroidView
import androidx.compose.ui.window.Dialog
import androidx.compose.ui.window.DialogProperties

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun OrderManagementScreen(
    viewModel: OrderManagementViewModel = hiltViewModel(),
    onNavigateToOrderDetails: (String) -> Unit,
    onNavigateToDeliveryDetails: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedOrderIds by viewModel.selectedOrderIds.collectAsState()
    val otpVerificationState by viewModel.otpVerificationState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }
    var showFilterDialog by remember { mutableStateOf(false) }
    var showBatchActionsDialog by remember { mutableStateOf(false) }
    var showQrScanner by remember { mutableStateOf(false) }
    var showDigitalBookingDetails by remember { mutableStateOf(false) }
    var showQrGeneration by remember { mutableStateOf(false) }

    // Handle OTP verification state
    LaunchedEffect(otpVerificationState) {
        when (otpVerificationState) {
            is OtpVerificationState.Success -> {
                // Show success message
                viewModel.resetOtpVerificationState()
            }
            is OtpVerificationState.Error -> {
                // Show error message
                viewModel.resetOtpVerificationState()
            }
            else -> {} // Handle other states if needed
        }
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Order Management") },
                actions = {
                    // Filter Button
                    IconButton(onClick = { showFilterDialog = true }) {
                        Icon(Icons.Default.FilterList, contentDescription = "Filter")
                    }
                    // Batch Actions Button (only show when orders are selected)
                    if (selectedOrderIds.isNotEmpty()) {
                        IconButton(onClick = { showBatchActionsDialog = true }) {
                            Icon(Icons.Default.MoreVert, contentDescription = "Batch Actions")
                        }
                    }
                    // Refresh Button
                    IconButton(onClick = { viewModel.refreshOrders() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(modifier = Modifier.fillMaxSize()) {
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(paddingValues)
            ) {
                // Order Summary Card
                OrderSummaryCard(uiState.orderSummary)

                // Tab Layout
                TabRow(selectedTabIndex = selectedTab) {
                    Tab(
                        selected = selectedTab == 0,
                        onClick = { selectedTab = 0 },
                        text = { Text("Orders") }
                    )
                    Tab(
                        selected = selectedTab == 1,
                        onClick = { selectedTab = 1 },
                        text = { Text("Digital Bookings") }
                    )
                }

                // Show appropriate content based on selected tab
                when (selectedTab) {
                    0 -> {
                        // Orders List
                        OrdersList(
                            orders = uiState.orders[OrderStatus.values()[selectedTab]] ?: emptyList(),
                            selectedOrderIds = selectedOrderIds,
                            onOrderClick = onNavigateToOrderDetails,
                            onOrderSelect = { viewModel.toggleOrderSelection(it) }
                        )
                    }
                    1 -> {
                        // Digital bookings list
                        DigitalBookingsList(
                            bookings = uiState.digitalBookings,
                            onBookingClick = { showDigitalBookingDetails = true }
                        )
                    }
                }
            }

            // Loading indicator
            if (uiState.isLoading || otpVerificationState is OtpVerificationState.Loading) {
                CircularProgressIndicator(
                    modifier = Modifier
                        .size(50.dp)
                        .align(Alignment.Center)
                )
            }

            // Error messages
            uiState.error?.let { error ->
                Snackbar(
                    modifier = Modifier
                        .padding(16.dp)
                        .align(Alignment.BottomCenter)
                ) {
                    Text(error)
                    Spacer(modifier = Modifier.weight(1f))
                    TextButton(onClick = { viewModel.refreshOrders() }) {
                        Text("Retry")
                    }
                }
            }

            // OTP verification error message
            if (otpVerificationState is OtpVerificationState.Error) {
                Snackbar(
                    modifier = Modifier
                        .padding(16.dp)
                        .align(Alignment.BottomCenter)
                ) {
                    Text((otpVerificationState as OtpVerificationState.Error).message)
                }
            }
        }

        // Dialogs
        if (showFilterDialog) {
            OrderFilterDialog(
                currentFilter = uiState.currentFilter,
                onApplyFilter = {
                    viewModel.setOrderFilter(it)
                    showFilterDialog = false
                },
                onDismiss = { showFilterDialog = false }
            )
        }

        if (showBatchActionsDialog) {
            BatchActionsDialog(
                onUpdateStatus = { status ->
                    viewModel.updateBatchOrderStatus(status)
                    showBatchActionsDialog = false
                },
                onUpdateDeliveryStatus = { status ->
                    viewModel.updateBatchDeliveryStatus(status)
                    showBatchActionsDialog = false
                },
                onDismiss = { showBatchActionsDialog = false }
            )
        }

        // Order Details Dialog
        uiState.selectedOrder?.let { order ->
            OrderDetailsDialog(
                order = order,
                onDismiss = { viewModel.clearSelectedOrder() },
                onUpdateStatus = { status ->
                    viewModel.updateOrderStatus(order.id, status)
                    viewModel.clearSelectedOrder()
                },
                onVerifyOtp = { status, otp ->
                    viewModel.verifyOtpAndUpdateOrderStatus(order.id, status, otp)
                }
            )
        }

        // Delivery Details Dialog
        uiState.selectedDelivery?.let { delivery ->
            DeliveryDetailsDialog(
                delivery = delivery,
                onDismiss = { viewModel.clearSelectedDelivery() },
                onUpdateStatus = { status ->
                    viewModel.updateDeliveryStatus(delivery.id, status)
                    viewModel.clearSelectedDelivery()
                },
                onVerifyOtp = { status, otp ->
                    viewModel.verifyOtpAndUpdateDeliveryStatus(delivery.id, status, otp)
                }
            )
        }

        // Digital Booking Details Dialog
        if (showDigitalBookingDetails) {
            uiState.selectedDigitalBooking?.let { booking ->
                DigitalBookingDetailsDialog(
                    booking = booking,
                    onDismiss = { showDigitalBookingDetails = false },
                    onVerifyQr = { showQrScanner = true },
                    onGenerateQr = { showQrGeneration = true }
                )
            }
        }

        // QR Scanner Dialog
        if (showQrScanner) {
            QrCodeVerificationDialog(
                onVerify = { qrContent ->
                    viewModel.verifyDigitalBookingQr(qrContent)
                    showQrScanner = false
                },
                onDismiss = { showQrScanner = false }
            )
        }

        // QR Generation Dialog
        if (showQrGeneration) {
            uiState.selectedDigitalBooking?.let { booking ->
                QrCodeGenerationDialog(
                    booking = booking,
                    onDismiss = { showQrGeneration = false },
                    onGenerate = { content ->
                        viewModel.generateDigitalBookingQr(content)
                        showQrGeneration = false
                    }
                )
            }
        }
    }
}

@Composable
private fun OrderSummaryCard(summary: OrderSummary?) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Order Summary",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem(
                    label = "Total Orders",
                    value = summary?.totalOrders?.toString() ?: "0"
                )
                SummaryItem(
                    label = "Pending",
                    value = summary?.pendingOrders?.toString() ?: "0"
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                SummaryItem(
                    label = "Total Revenue",
                    value = formatCurrency(summary?.totalRevenue ?: 0.0)
                )
                SummaryItem(
                    label = "Avg. Order Value",
                    value = formatCurrency(summary?.averageOrderValue ?: 0.0)
                )
            }
        }
    }
}

@Composable
private fun SummaryItem(label: String, value: String) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = value,
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun OrdersList(
    orders: List<Order>,
    selectedOrderIds: Set<String>,
    onOrderClick: (String) -> Unit,
    onOrderSelect: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(orders) { order ->
            OrderItem(
                order = order,
                isSelected = selectedOrderIds.contains(order.id),
                onClick = { onOrderClick(order.id) },
                onSelect = { onOrderSelect(order.id) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun OrderItem(
    order: Order,
    isSelected: Boolean,
    onClick: () -> Unit,
    onSelect: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        onClick = onClick
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Checkbox(
                checked = isSelected,
                onCheckedChange = { onSelect() }
            )
            Column(modifier = Modifier.weight(1f)) {
                Text(
                    text = "Order #${order.id}",
                    style = MaterialTheme.typography.bodyLarge,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = order.createdAt,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(order.totalAmount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                OrderStatusChip(status = order.status)
            }
        }
    }
}

@Composable
private fun OrderStatusChip(status: OrderStatus) {
    Surface(
        color = when (status) {
            OrderStatus.PENDING -> MaterialTheme.colorScheme.secondaryContainer
            OrderStatus.CONFIRMED -> MaterialTheme.colorScheme.primaryContainer
            OrderStatus.PREPARING -> MaterialTheme.colorScheme.tertiaryContainer
            OrderStatus.READY -> MaterialTheme.colorScheme.primaryContainer
            OrderStatus.IN_TRANSIT -> MaterialTheme.colorScheme.secondaryContainer
            OrderStatus.DELIVERED -> MaterialTheme.colorScheme.primaryContainer
            OrderStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer
            OrderStatus.REFUNDED -> MaterialTheme.colorScheme.errorContainer
        },
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = when (status) {
                OrderStatus.PENDING -> MaterialTheme.colorScheme.onSecondaryContainer
                OrderStatus.CONFIRMED -> MaterialTheme.colorScheme.onPrimaryContainer
                OrderStatus.PREPARING -> MaterialTheme.colorScheme.onTertiaryContainer
                OrderStatus.READY -> MaterialTheme.colorScheme.onPrimaryContainer
                OrderStatus.IN_TRANSIT -> MaterialTheme.colorScheme.onSecondaryContainer
                OrderStatus.DELIVERED -> MaterialTheme.colorScheme.onPrimaryContainer
                OrderStatus.CANCELLED -> MaterialTheme.colorScheme.onErrorContainer
                OrderStatus.REFUNDED -> MaterialTheme.colorScheme.onErrorContainer
            }
        )
    }
}

@Composable
private fun OrderFilterDialog(
    currentFilter: OrderFilter?,
    onApplyFilter: (OrderFilter) -> Unit,
    onDismiss: () -> Unit
) {
    var status by remember { mutableStateOf(currentFilter?.status) }
    var type by remember { mutableStateOf(currentFilter?.type) }
    var startDate by remember { mutableStateOf(currentFilter?.startDate) }
    var endDate by remember { mutableStateOf(currentFilter?.endDate) }
    var minAmount by remember { mutableStateOf(currentFilter?.minAmount) }
    var maxAmount by remember { mutableStateOf(currentFilter?.maxAmount) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Filter Orders") },
        text = {
            Column {
                // Status Dropdown
                ExposedDropdownMenuBox(
                    expanded = false,
                    onExpandedChange = {}
                ) {
                    TextField(
                        value = status?.name ?: "All",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Status") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) },
                        modifier = Modifier.menuAnchor()
                    )
                }

                // Type Dropdown
                ExposedDropdownMenuBox(
                    expanded = false,
                    onExpandedChange = {}
                ) {
                    TextField(
                        value = type?.name ?: "All",
                        onValueChange = {},
                        readOnly = true,
                        label = { Text("Type") },
                        trailingIcon = { ExposedDropdownMenuDefaults.TrailingIcon(expanded = false) },
                        modifier = Modifier.menuAnchor()
                    )
                }

                // Amount Range
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween
                ) {
                    TextField(
                        value = minAmount?.toString() ?: "",
                        onValueChange = { minAmount = it.toDoubleOrNull() },
                        label = { Text("Min Amount") },
                        modifier = Modifier.weight(1f)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    TextField(
                        value = maxAmount?.toString() ?: "",
                        onValueChange = { maxAmount = it.toDoubleOrNull() },
                        label = { Text("Max Amount") },
                        modifier = Modifier.weight(1f)
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    onApplyFilter(
                        OrderFilter(
                            status = status,
                            type = type,
                            startDate = startDate,
                            endDate = endDate,
                            minAmount = minAmount,
                            maxAmount = maxAmount
                        )
                    )
                }
            ) {
                Text("Apply")
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
private fun BatchActionsDialog(
    onUpdateStatus: (OrderStatus) -> Unit,
    onUpdateDeliveryStatus: (DeliveryStatus) -> Unit,
    onDismiss: () -> Unit
) {
    var showStatusOptions by remember { mutableStateOf(false) }
    var showDeliveryOptions by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Batch Actions") },
        text = {
            Column {
                TextButton(
                    onClick = { showStatusOptions = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Update Order Status")
                }
                TextButton(
                    onClick = { showDeliveryOptions = true },
                    modifier = Modifier.fillMaxWidth()
                ) {
                    Text("Update Delivery Status")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )

    if (showStatusOptions) {
        AlertDialog(
            onDismissRequest = { showStatusOptions = false },
            title = { Text("Update Order Status") },
            text = {
                Column {
                    OrderStatus.values().forEach { status ->
                        TextButton(
                            onClick = { onUpdateStatus(status) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(status.name)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showStatusOptions = false }) {
                    Text("Cancel")
                }
            }
        )
    }

    if (showDeliveryOptions) {
        AlertDialog(
            onDismissRequest = { showDeliveryOptions = false },
            title = { Text("Update Delivery Status") },
            text = {
                Column {
                    DeliveryStatus.values().forEach { status ->
                        TextButton(
                            onClick = { onUpdateDeliveryStatus(status) },
                            modifier = Modifier.fillMaxWidth()
                        ) {
                            Text(status.name)
                        }
                    }
                }
            },
            confirmButton = {
                TextButton(onClick = { showDeliveryOptions = false }) {
                    Text("Cancel")
                }
            }
        )
    }
}

private fun formatCurrency(amount: Double): String {
    return NumberFormat.getCurrencyInstance(Locale.getDefault()).format(amount)
}

@Composable
private fun OtpVerificationDialog(
    phoneNumber: String,
    title: String,
    onVerify: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var otpValue by remember { mutableStateOf("") }
    var isError by remember { mutableStateOf(false) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(title) },
        text = {
            Column {
                Text(
                    text = "Enter OTP sent to $phoneNumber",
                    style = MaterialTheme.typography.bodyMedium
                )
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = otpValue,
                    onValueChange = { 
                        if (it.length <= 6) {
                            otpValue = it
                            isError = false
                        }
                    },
                    label = { Text("Enter OTP") },
                    keyboardOptions = KeyboardOptions(
                        keyboardType = KeyboardType.NumberPassword,
                        imeAction = ImeAction.Done
                    ),
                    singleLine = true,
                    isError = isError,
                    supportingText = if (isError) {
                        { Text("Invalid OTP") }
                    } else null,
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { 
                    if (otpValue.length == 6) {
                        onVerify(otpValue)
                    } else {
                        isError = true
                    }
                },
                enabled = otpValue.isNotEmpty()
            ) {
                Text("Verify")
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
private fun OrderDetailsDialog(
    order: Order,
    onDismiss: () -> Unit,
    onUpdateStatus: (OrderStatus) -> Unit,
    onVerifyOtp: (OrderStatus, String) -> Unit
) {
    var showOtpDialog by remember { mutableStateOf(false) }
    var selectedStatus by remember { mutableStateOf<OrderStatus?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Order Details") },
        text = {
            Column {
                Text("Order #${order.id}")
                Text("Customer: ${order.customerName}")
                Text("Date: ${order.orderDate}")
                Text("Total: ${formatCurrency(order.totalAmount)}")
                Spacer(modifier = Modifier.height(16.dp))
                Text("Items:")
                order.items.forEach { item ->
                    Text("${item.name} x${item.quantity} - ${formatCurrency(item.price)}")
                }
                if (order.deliveryAddress != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Text("Delivery Address:")
                    Text(order.deliveryAddress)
                }
            }
        },
        confirmButton = {
            Column {
                OrderStatus.values().forEach { status ->
                    TextButton(
                        onClick = { 
                            when (status) {
                                OrderStatus.DELIVERED, OrderStatus.REFUNDED -> {
                                    selectedStatus = status
                                    showOtpDialog = true
                                }
                                else -> onUpdateStatus(status)
                            }
                        }
                    ) {
                        Text(status.name)
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )

    if (showOtpDialog && selectedStatus != null) {
        OtpVerificationDialog(
            phoneNumber = order.customerPhone,
            title = "Verify ${selectedStatus!!.name}",
            onVerify = { otp ->
                onVerifyOtp(selectedStatus!!, otp)
                showOtpDialog = false
            },
            onDismiss = { showOtpDialog = false }
        )
    }
}

@Composable
private fun DeliveryDetailsDialog(
    delivery: Delivery,
    onDismiss: () -> Unit,
    onUpdateStatus: (DeliveryStatus) -> Unit,
    onVerifyOtp: (DeliveryStatus, String) -> Unit
) {
    var showOtpDialog by remember { mutableStateOf(false) }
    var selectedStatus by remember { mutableStateOf<DeliveryStatus?>(null) }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Delivery Details") },
        text = {
            Column {
                Text("Delivery #${delivery.id}")
                Text("Customer: ${delivery.customerName}")
                Text("Address: ${delivery.deliveryAddress}")
                Text("ETA: ${delivery.estimatedDeliveryTime}")
                delivery.trackingNumber?.let {
                    Text("Tracking: $it")
                }
                delivery.deliveryNotes?.let {
                    Text("Notes: $it")
                }
            }
        },
        confirmButton = {
            Column {
                DeliveryStatus.values().forEach { status ->
                    TextButton(
                        onClick = { 
                            when (status) {
                                DeliveryStatus.DELIVERED, DeliveryStatus.RETURNED -> {
                                    selectedStatus = status
                                    showOtpDialog = true
                                }
                                else -> onUpdateStatus(status)
                            }
                        }
                    ) {
                        Text(status.name)
                    }
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )

    if (showOtpDialog && selectedStatus != null) {
        OtpVerificationDialog(
            phoneNumber = delivery.customerPhone,
            title = "Verify ${selectedStatus!!.name}",
            onVerify = { otp ->
                onVerifyOtp(selectedStatus!!, otp)
                showOtpDialog = false
            },
            onDismiss = { showOtpDialog = false }
        )
    }
}

@Composable
private fun QrCodeVerificationDialog(
    onVerify: (String) -> Unit,
    onDismiss: () -> Unit
) {
    var scannedCode by remember { mutableStateOf<String?>(null) }
    val context = LocalContext.current
    val beepManager = remember { BeepManager(context) }

    Dialog(
        onDismissRequest = onDismiss,
        properties = DialogProperties(usePlatformDefaultWidth = false)
    ) {
        Card(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Column(
                modifier = Modifier.padding(16.dp),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "Scan QR Code",
                    style = MaterialTheme.typography.titleLarge
                )
                Spacer(modifier = Modifier.height(16.dp))
                
                // QR Scanner View
                AndroidView(
                    factory = { context ->
                        DecoratedBarcodeView(context).apply {
                            barcodeView.decoderFactory = DefaultDecoderFactory(
                                listOf(BarcodeFormat.QR_CODE)
                            )
                            barcodeView.decodeContinuous(object : BarcodeCallback {
                                override fun barcodeResult(result: com.journeyapps.barcodescanner.BarcodeResult) {
                                    scannedCode = result.text
                                    beepManager.playBeepSoundAndVibrate()
                                }
                            })
                            barcodeView.resume()
                        }
                    },
                    modifier = Modifier
                        .size(300.dp)
                        .padding(16.dp)
                )

                Spacer(modifier = Modifier.height(16.dp))

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceEvenly
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Button(
                        onClick = { 
                            scannedCode?.let { onVerify(it) }
                        },
                        enabled = scannedCode != null
                    ) {
                        Text("Verify")
                    }
                }
            }
        }
    }
}

@Composable
private fun DigitalBookingDetailsDialog(
    booking: DigitalBooking,
    onDismiss: () -> Unit,
    onVerifyQr: () -> Unit,
    onGenerateQr: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Digital Booking Details") },
        text = {
            Column {
                Text("Booking #${booking.id}")
                Text("Customer: ${booking.customerName}")
                Text("Event: ${booking.eventName}")
                Text("Date: ${booking.bookingDate}")
                Text("Seats: ${booking.seats.joinToString(", ")}")
                Text("Status: ${booking.status}")
                
                if (booking.qrCode != null) {
                    Spacer(modifier = Modifier.height(8.dp))
                    Image(
                        bitmap = booking.qrCode.asImageBitmap(),
                        contentDescription = "Booking QR Code",
                        modifier = Modifier
                            .size(200.dp)
                            .padding(8.dp)
                    )
                }
            }
        },
        confirmButton = {
            Column {
                TextButton(onClick = onVerifyQr) {
                    Text("Verify QR Code")
                }
                TextButton(onClick = onGenerateQr) {
                    Text("Generate New QR Code")
                }
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun QrCodeGenerationDialog(
    booking: DigitalBooking,
    onDismiss: () -> Unit,
    onGenerate: (String) -> Unit
) {
    var qrContent by remember { mutableStateOf("") }
    
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Generate QR Code") },
        text = {
            Column {
                Text("Booking #${booking.id}")
                Text("Customer: ${booking.customerName}")
                Spacer(modifier = Modifier.height(16.dp))
                OutlinedTextField(
                    value = qrContent,
                    onValueChange = { qrContent = it },
                    label = { Text("QR Code Content") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = { onGenerate(qrContent) },
                enabled = qrContent.isNotEmpty()
            ) {
                Text("Generate")
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
private fun DigitalBookingsList(
    bookings: List<DigitalBooking>,
    onBookingClick: (DigitalBooking) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(bookings) { booking ->
            DigitalBookingItem(
                booking = booking,
                onClick = { onBookingClick(booking) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun DigitalBookingItem(
    booking: DigitalBooking,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        onClick = onClick
    ) {
        Column(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth()
        ) {
            Text(
                text = "Booking #${booking.id}",
                style = MaterialTheme.typography.bodyLarge,
                fontWeight = FontWeight.Bold
            )
            Text(
                text = booking.eventName,
                style = MaterialTheme.typography.bodyMedium
            )
            Text(
                text = "Seats: ${booking.seats.joinToString(", ")}",
                style = MaterialTheme.typography.bodyMedium
            )
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = booking.bookingDate,
                    style = MaterialTheme.typography.bodyMedium
                )
                BookingStatusChip(status = booking.status)
            }
        }
    }
}

@Composable
private fun BookingStatusChip(status: BookingStatus) {
    Surface(
        color = when (status) {
            BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.primaryContainer
            BookingStatus.CHECKED_IN -> MaterialTheme.colorScheme.secondaryContainer
            BookingStatus.CANCELLED -> MaterialTheme.colorScheme.errorContainer
        },
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = when (status) {
                BookingStatus.CONFIRMED -> MaterialTheme.colorScheme.onPrimaryContainer
                BookingStatus.CHECKED_IN -> MaterialTheme.colorScheme.onSecondaryContainer
                BookingStatus.CANCELLED -> MaterialTheme.colorScheme.onErrorContainer
            }
        )
    }
} 