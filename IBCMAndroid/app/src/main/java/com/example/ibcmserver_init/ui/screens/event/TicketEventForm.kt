package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.ibcmserver_init.data.model.event.TicketType
import com.example.ibcmserver_init.data.model.event.ValidityPeriod
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketEventForm(
    onTicketTypeCreated: (TicketType) -> Unit
) {
    var showAddTicketDialog by remember { mutableStateOf(false) }
    var ticketTypes by remember { mutableStateOf<List<TicketType>>(emptyList()) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Ticket Types",
            style = MaterialTheme.typography.titleMedium
        )

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(ticketTypes) { ticketType ->
                TicketTypeCard(
                    ticketType = ticketType,
                    onDelete = {
                        ticketTypes = ticketTypes.filter { it.id != ticketType.id }
                    }
                )
            }
        }

        Button(
            onClick = { showAddTicketDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Add Ticket Type")
        }
    }

    if (showAddTicketDialog) {
        AddTicketTypeDialog(
            onDismiss = { showAddTicketDialog = false },
            onTicketTypeCreated = { ticketType ->
                ticketTypes = ticketTypes + ticketType
                onTicketTypeCreated(ticketType)
                showAddTicketDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddTicketTypeDialog(
    onDismiss: () -> Unit,
    onTicketTypeCreated: (TicketType) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("0.00") }
    var quantity by remember { mutableStateOf("0") }
    var benefits by remember { mutableStateOf("") }
    var startDate by remember { mutableStateOf("") }
    var endDate by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Ticket Type") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Price") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = quantity,
                    onValueChange = { quantity = it },
                    label = { Text("Quantity") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = benefits,
                    onValueChange = { benefits = it },
                    label = { Text("Benefits (comma-separated)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = startDate,
                    onValueChange = { startDate = it },
                    label = { Text("Start Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = endDate,
                    onValueChange = { endDate = it },
                    label = { Text("End Date (YYYY-MM-DD)") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val ticketType = TicketType(
                        id = java.util.UUID.randomUUID().toString(),
                        name = name,
                        description = description,
                        price = price.toDoubleOrNull() ?: 0.0,
                        quantity = quantity.toIntOrNull() ?: 0,
                        benefits = benefits.split(",").map { it.trim() }.filter { it.isNotEmpty() },
                        validityPeriod = if (startDate.isNotEmpty() && endDate.isNotEmpty()) {
                            ValidityPeriod(startDate, endDate)
                        } else null
                    )
                    onTicketTypeCreated(ticketType)
                },
                enabled = name.isNotBlank() && description.isNotBlank() &&
                        price.toDoubleOrNull() != null && quantity.toIntOrNull() != null
            ) {
                Text("Add")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketTypeCard(
    ticketType: TicketType,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = ticketType.name,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete"
                    )
                }
            }

            Text(
                text = ticketType.description,
                style = MaterialTheme.typography.bodyMedium
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Price: $${ticketType.price}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Quantity: ${ticketType.quantity}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (ticketType.benefits.isNotEmpty()) {
                Text(
                    text = "Benefits:",
                    style = MaterialTheme.typography.titleSmall
                )
                ticketType.benefits.forEach { benefit ->
                    Text(
                        text = "• $benefit",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            ticketType.validityPeriod?.let { validity ->
                Text(
                    text = "Valid: ${validity.startDate} to ${validity.endDate}",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        }
    }
} 