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
import com.example.ibcmserver_init.data.models.*
import com.example.ibcmserver_init.ui.components.*
import com.example.ibcmserver_init.ui.theme.IBCMTheme
import java.text.NumberFormat
import java.util.*

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PaymentManagementScreen(
    viewModel: PaymentManagementViewModel = hiltViewModel(),
    onNavigateToTransaction: (String) -> Unit,
    onNavigateToSettlement: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    var selectedTab by remember { mutableStateOf(0) }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Payment Management") },
                actions = {
                    IconButton(onClick = { viewModel.refreshPayments() }) {
                        Icon(Icons.Default.Refresh, contentDescription = "Refresh")
                    }
                }
            )
        }
    ) { padding ->
        Column(
            modifier = Modifier
                .fillMaxSize()
                .padding(padding)
        ) {
            // Earnings Summary Card
            EarningsSummaryCard(uiState.earningsSummary)

            // Tab Layout
            TabRow(selectedTabIndex = selectedTab) {
                Tab(
                    selected = selectedTab == 0,
                    onClick = { selectedTab = 0 },
                    text = { Text("Transactions") }
                )
                Tab(
                    selected = selectedTab == 1,
                    onClick = { selectedTab = 1 },
                    text = { Text("Settlements") }
                )
                Tab(
                    selected = selectedTab == 2,
                    onClick = { selectedTab = 2 },
                    text = { Text("Deductions") }
                )
            }

            // Tab Content
            when (selectedTab) {
                0 -> TransactionsList(
                    transactions = uiState.recentTransactions,
                    onTransactionClick = onNavigateToTransaction
                )
                1 -> SettlementsList(
                    settlements = uiState.settlements,
                    onSettlementClick = onNavigateToSettlement
                )
                2 -> DeductionsList(deductions = uiState.deductions)
            }
        }

        // Loading Indicator
        if (uiState.isLoading) {
            Box(
                modifier = Modifier.fillMaxSize(),
                contentAlignment = Alignment.Center
            ) {
                CircularProgressIndicator()
            }
        }

        // Error Message
        uiState.error?.let { error ->
            Snackbar(
                modifier = Modifier.padding(16.dp)
            ) {
                Text(error)
                Spacer(modifier = Modifier.weight(1f))
                TextButton(onClick = { viewModel.refreshPayments() }) {
                    Text("Retry")
                }
            }
        }

        // Transaction Details Dialog
        uiState.selectedTransaction?.let { transaction ->
            TransactionDetailsDialog(
                transaction = transaction,
                onDismiss = { viewModel.clearSelectedTransaction() }
            )
        }

        // Settlement Details Dialog
        uiState.selectedSettlement?.let { settlement ->
            SettlementDetailsDialog(
                settlement = settlement,
                onDismiss = { viewModel.clearSelectedSettlement() }
            )
        }
    }
}

@Composable
private fun EarningsSummaryCard(summary: EarningsSummary?) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Column(
            modifier = Modifier.padding(16.dp)
        ) {
            Text(
                text = "Earnings Summary",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            Spacer(modifier = Modifier.height(16.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                EarningsItem(
                    label = "Total Earnings",
                    amount = summary?.totalEarnings ?: 0.0
                )
                EarningsItem(
                    label = "Pending",
                    amount = summary?.pendingEarnings ?: 0.0
                )
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                EarningsItem(
                    label = "Available",
                    amount = summary?.availableEarnings ?: 0.0
                )
                EarningsItem(
                    label = "Deductions",
                    amount = summary?.totalDeductions ?: 0.0
                )
            }
        }
    }
}

@Composable
private fun EarningsItem(label: String, amount: Double) {
    Column {
        Text(
            text = label,
            style = MaterialTheme.typography.bodyMedium,
            color = MaterialTheme.colorScheme.onSurfaceVariant
        )
        Text(
            text = formatCurrency(amount),
            style = MaterialTheme.typography.titleMedium,
            fontWeight = FontWeight.Bold
        )
    }
}

@Composable
private fun TransactionsList(
    transactions: List<Transaction>,
    onTransactionClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(transactions) { transaction ->
            TransactionItem(
                transaction = transaction,
                onClick = { onTransactionClick(transaction.id) }
            )
        }
    }
}

@Composable
private fun TransactionItem(
    transaction: Transaction,
    onClick: () -> Unit
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
            Column {
                Text(
                    text = transaction.description,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = transaction.type.name,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(transaction.amount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusChip(status = transaction.status)
            }
        }
    }
}

@Composable
private fun SettlementsList(
    settlements: List<Settlement>,
    onSettlementClick: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(settlements) { settlement ->
            SettlementItem(
                settlement = settlement,
                onClick = { onSettlementClick(settlement.id) }
            )
        }
    }
}

@Composable
private fun SettlementItem(
    settlement: Settlement,
    onClick: () -> Unit
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
            Column {
                Text(
                    text = "Settlement #${settlement.id}",
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = settlement.timestamp,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(settlement.amount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                StatusChip(status = settlement.status)
            }
        }
    }
}

@Composable
private fun DeductionsList(deductions: List<Deduction>) {
    LazyColumn(
        modifier = Modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp)
    ) {
        items(deductions) { deduction ->
            DeductionItem(deduction = deduction)
        }
    }
}

@Composable
private fun DeductionItem(deduction: Deduction) {
    Card(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 4.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(16.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = deduction.description,
                    style = MaterialTheme.typography.bodyLarge
                )
                Text(
                    text = deduction.type.name,
                    style = MaterialTheme.typography.bodyMedium,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Column(horizontalAlignment = Alignment.End) {
                Text(
                    text = formatCurrency(deduction.amount),
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    text = deduction.timestamp,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun StatusChip(status: TransactionStatus) {
    Surface(
        color = when (status) {
            TransactionStatus.COMPLETED -> MaterialTheme.colorScheme.primaryContainer
            TransactionStatus.PENDING -> MaterialTheme.colorScheme.secondaryContainer
            TransactionStatus.FAILED -> MaterialTheme.colorScheme.errorContainer
            TransactionStatus.REFUNDED -> MaterialTheme.colorScheme.tertiaryContainer
            TransactionStatus.CANCELLED -> MaterialTheme.colorScheme.surfaceVariant
        },
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall,
            color = when (status) {
                TransactionStatus.COMPLETED -> MaterialTheme.colorScheme.onPrimaryContainer
                TransactionStatus.PENDING -> MaterialTheme.colorScheme.onSecondaryContainer
                TransactionStatus.FAILED -> MaterialTheme.colorScheme.onErrorContainer
                TransactionStatus.REFUNDED -> MaterialTheme.colorScheme.onTertiaryContainer
                TransactionStatus.CANCELLED -> MaterialTheme.colorScheme.onSurfaceVariant
            }
        )
    }
}

@Composable
private fun TransactionDetailsDialog(
    transaction: Transaction,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Transaction Details") },
        text = {
            Column {
                Text("Transaction #${transaction.id}")
                Text("Amount: ₹${transaction.amount}")
                Text("Date: ${transaction.date}")
                Text("Type: ${transaction.type}")
                Text("Status: ${transaction.status}")
                transaction.description?.let {
                    Text("Description: $it")
                }
                transaction.orderId?.let {
                    Text("Order ID: $it")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

@Composable
private fun SettlementDetailsDialog(
    settlement: Settlement,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Settlement Details") },
        text = {
            Column {
                Text("Settlement #${settlement.id}")
                Text("Amount: ₹${settlement.amount}")
                Text("Date: ${settlement.date}")
                Text("Status: ${settlement.status}")
                Text("Payment Method: ${settlement.paymentMethod}")
                settlement.transactionIds.forEach {
                    Text("Transaction ID: $it")
                }
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

private fun formatCurrency(amount: Double): String {
    return NumberFormat.getCurrencyInstance(Locale.getDefault()).format(amount)
} 