package com.example.ibcmserver_init.ui.screens.payment

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.payment.*
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.components.ErrorDialog
import com.example.ibcmserver_init.ui.theme.IBCMTheme

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentScreen(
    viewModel: PaymentViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onPaymentSuccess: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var showPaymentMethodDialog by remember { mutableStateOf(false) }
    var selectedPaymentMethod by remember { mutableStateOf<PaymentMethod?>(null) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Payment") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                }
            )
        }
    ) { padding ->
        Box(modifier = Modifier.padding(padding)) {
            when (uiState) {
                is PaymentUiState.Initial -> {
                    PaymentContent(
                        onPaymentMethodSelect = { showPaymentMethodDialog = true }
                    )
                }
                is PaymentUiState.Loading -> {
                    LoadingIndicator()
                }
                is PaymentUiState.Success -> {
                    PaymentSuccess(
                        paymentIntent = (uiState as PaymentUiState.Success).paymentIntent,
                        onDone = onPaymentSuccess
                    )
                }
                is PaymentUiState.Error -> {
                    ErrorDialog(
                        message = (uiState as PaymentUiState.Error).message,
                        onDismiss = { viewModel.getPaymentStatus("") }
                    )
                }
                else -> {
                    // Handle other states
                }
            }
        }

        if (showPaymentMethodDialog) {
            PaymentMethodDialog(
                onDismiss = { showPaymentMethodDialog = false },
                onPaymentMethodSelected = { method ->
                    selectedPaymentMethod = method
                    showPaymentMethodDialog = false
                }
            )
        }
    }
}

@Composable
private fun PaymentContent(
    onPaymentMethodSelect: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Select Payment Method",
            style = MaterialTheme.typography.titleLarge
        )

        PaymentMethodCard(
            icon = Icons.Default.CreditCard,
            title = "Credit Card",
            onClick = onPaymentMethodSelect
        )

        PaymentMethodCard(
            icon = Icons.Default.AccountBalance,
            title = "Bank Transfer",
            onClick = onPaymentMethodSelect
        )

        PaymentMethodCard(
            icon = Icons.Default.Payment,
            title = "Digital Wallet",
            onClick = onPaymentMethodSelect
        )
    }
}

@Composable
private fun PaymentMethodCard(
    icon: ImageVector,
    title: String,
    onClick: () -> Unit
) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .clickable(onClick = onClick),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.spacedBy(16.dp),
            verticalAlignment = Alignment.CenterVertically
        ) {
            Icon(icon, contentDescription = null)
            Text(title)
            Spacer(modifier = Modifier.weight(1f))
            Icon(Icons.Default.ChevronRight, contentDescription = null)
        }
    }
}

@Composable
private fun PaymentSuccess(
    paymentIntent: PaymentIntent,
    onDone: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally,
        verticalArrangement = Arrangement.Center
    ) {
        Icon(
            imageVector = Icons.Default.CheckCircle,
            contentDescription = null,
            modifier = Modifier.size(64.dp),
            tint = MaterialTheme.colorScheme.primary
        )

        Spacer(modifier = Modifier.height(16.dp))

        Text(
            text = "Payment Successful!",
            style = MaterialTheme.typography.headlineMedium,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(8.dp))

        Text(
            text = "Amount: ${paymentIntent.amount / 100.0} ${paymentIntent.currency.uppercase()}",
            style = MaterialTheme.typography.bodyLarge,
            textAlign = TextAlign.Center
        )

        Spacer(modifier = Modifier.height(32.dp))

        Button(
            onClick = onDone,
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Done")
        }
    }
}

@Composable
private fun PaymentMethodDialog(
    onDismiss: () -> Unit,
    onPaymentMethodSelected: (PaymentMethod) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Payment Method") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                // Add payment method options here
                // This would typically include saved cards, bank accounts, etc.
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 