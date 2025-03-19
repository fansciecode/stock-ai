package com.example.ibcmserver_init.ui.screens.payment

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.Check
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.NetworkResult
import com.example.ibcmserver_init.data.model.payment.PaymentRequest
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.viewmodel.PaymentViewModel

@Composable
fun PaymentScreen(
    orderId: String,
    amount: Double,
    onPaymentSuccess: () -> Unit,
    onPaymentFailure: (String) -> Unit,
    viewModel: PaymentViewModel = hiltViewModel()
) {
    val paymentState by viewModel.paymentState.collectAsState()
    val paymentIntentState by viewModel.paymentIntentState.collectAsState()
    
    var selectedPaymentMethod by remember { mutableStateOf<String?>(null) }
    var isProcessing by remember { mutableStateOf(false) }
    
    LaunchedEffect(paymentState) {
        when (paymentState) {
            is NetworkResult.Success -> {
                isProcessing = false
                onPaymentSuccess()
            }
            is NetworkResult.Error -> {
                isProcessing = false
                onPaymentFailure((paymentState as NetworkResult.Error).message)
            }
            else -> {}
        }
    }
    
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
            .verticalScroll(rememberScrollState()),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Payment Details",
            style = MaterialTheme.typography.headlineMedium,
            fontWeight = FontWeight.Bold
        )
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Order Summary",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = "Order ID: $orderId",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Amount: $${String.format("%.2f", amount)}",
                    style = MaterialTheme.typography.bodyMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }
        
        Card(
            modifier = Modifier.fillMaxWidth(),
            elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
        ) {
            Column(
                modifier = Modifier
                    .padding(16.dp)
                    .fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text(
                    text = "Select Payment Method",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                
                PaymentMethodOption(
                    title = "Credit Card",
                    isSelected = selectedPaymentMethod == "CREDIT_CARD",
                    onSelect = { selectedPaymentMethod = "CREDIT_CARD" }
                )
                
                PaymentMethodOption(
                    title = "PayPal",
                    isSelected = selectedPaymentMethod == "PAYPAL",
                    onSelect = { selectedPaymentMethod = "PAYPAL" }
                )
                
                PaymentMethodOption(
                    title = "Google Pay",
                    isSelected = selectedPaymentMethod == "GOOGLE_PAY",
                    onSelect = { selectedPaymentMethod = "GOOGLE_PAY" }
                )
            }
        }
        
        Button(
            onClick = {
                if (selectedPaymentMethod != null) {
                    isProcessing = true
                    viewModel.initiatePayment(
                        PaymentRequest(
                            orderId = orderId,
                            amount = amount,
                            paymentMethod = selectedPaymentMethod!!,
                            currency = "USD"
                        )
                    )
                }
            },
            modifier = Modifier
                .fillMaxWidth()
                .height(56.dp),
            enabled = selectedPaymentMethod != null && !isProcessing
        ) {
            if (isProcessing) {
                LoadingIndicator(
                    modifier = Modifier.size(24.dp),
                    color = MaterialTheme.colorScheme.onPrimary
                )
            } else {
                Text("Pay $${String.format("%.2f", amount)}")
            }
        }
    }
}

@Composable
private fun PaymentMethodOption(
    title: String,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Surface(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp),
        onClick = onSelect,
        color = if (isSelected) MaterialTheme.colorScheme.primaryContainer else MaterialTheme.colorScheme.surface,
        shape = MaterialTheme.shapes.medium
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = title,
                style = MaterialTheme.typography.bodyLarge
            )
            if (isSelected) {
                Icon(
                    imageVector = Icons.Default.Check,
                    contentDescription = "Selected",
                    tint = MaterialTheme.colorScheme.primary
                )
            }
        }
    }
} 