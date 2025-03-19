package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.animation.*
import androidx.compose.foundation.background
import androidx.compose.foundation.clickable
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.text.font.FontWeight
import androidx.compose.ui.text.style.TextDecoration
import androidx.compose.ui.unit.dp

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketBookingSection(
    tickets: List<TicketType>,
    onBookTicket: (TicketType, Int) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedTicket by remember { mutableStateOf<TicketType?>(null) }
    var showBookingSheet by remember { mutableStateOf(false) }
    var quantity by remember { mutableStateOf(1) }

    Column(modifier = modifier.fillMaxWidth()) {
        Text(
            text = "Ticket price",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold,
            modifier = Modifier.padding(horizontal = 16.dp, vertical = 8.dp)
        )

        Row(
            modifier = Modifier
                .fillMaxWidth()
                .horizontalScroll(rememberScrollState()),
            horizontalArrangement = Arrangement.spacedBy(16.dp)
        ) {
            Spacer(modifier = Modifier.width(16.dp))
            tickets.forEach { ticket ->
                TicketCard(
                    ticket = ticket,
                    isSelected = selectedTicket == ticket,
                    onClick = {
                        selectedTicket = ticket
                        showBookingSheet = true
                    }
                )
            }
            Spacer(modifier = Modifier.width(16.dp))
        }
    }

    if (showBookingSheet && selectedTicket != null) {
        ModalBottomSheet(
            onDismissRequest = { showBookingSheet = false },
            dragHandle = { BottomSheetDefaults.DragHandle() }
        ) {
            BookingSheet(
                ticket = selectedTicket!!,
                quantity = quantity,
                onQuantityChange = { quantity = it },
                onBook = {
                    onBookTicket(selectedTicket!!, quantity)
                    showBookingSheet = false
                    quantity = 1
                }
            )
        }
    }
}

@Composable
private fun TicketCard(
    ticket: TicketType,
    isSelected: Boolean,
    onClick: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .width(160.dp)
            .clickable(onClick = onClick),
        colors = CardDefaults.cardColors(
            containerColor = if (isSelected) 
                MaterialTheme.colorScheme.primaryContainer 
            else 
                MaterialTheme.colorScheme.surface
        ),
        elevation = CardDefaults.cardElevation(
            defaultElevation = if (isSelected) 8.dp else 2.dp
        )
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = ticket.name,
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
            
            if (ticket.description != null) {
                Text(
                    text = ticket.description,
                    style = MaterialTheme.typography.bodySmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Member price",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "₹${ticket.memberPrice}",
                style = MaterialTheme.typography.titleLarge,
                fontWeight = FontWeight.Bold
            )
            
            Spacer(modifier = Modifier.height(4.dp))
            
            Text(
                text = "Regular price",
                style = MaterialTheme.typography.bodySmall
            )
            Text(
                text = "₹${ticket.regularPrice}",
                style = MaterialTheme.typography.bodyMedium.copy(
                    textDecoration = TextDecoration.LineThrough
                )
            )

            if (ticket.availableCount != null) {
                Spacer(modifier = Modifier.height(8.dp))
                Text(
                    text = "${ticket.availableCount} tickets left",
                    style = MaterialTheme.typography.bodySmall,
                    color = if (ticket.availableCount < 10) 
                        MaterialTheme.colorScheme.error 
                    else 
                        MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
        }
    }
}

@Composable
private fun BookingSheet(
    ticket: TicketType,
    quantity: Int,
    onQuantityChange: (Int) -> Unit,
    onBook: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(horizontal = 16.dp, vertical = 24.dp)
    ) {
        Text(
            text = "Book Tickets",
            style = MaterialTheme.typography.titleLarge,
            fontWeight = FontWeight.Bold
        )

        Spacer(modifier = Modifier.height(24.dp))

        // Ticket Details
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween
        ) {
            Column {
                Text(
                    text = ticket.name,
                    style = MaterialTheme.typography.titleMedium
                )
                if (ticket.description != null) {
                    Text(
                        text = ticket.description,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
            Text(
                text = "₹${ticket.memberPrice}",
                style = MaterialTheme.typography.titleMedium,
                fontWeight = FontWeight.Bold
            )
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Quantity Selector
        Row(
            modifier = Modifier.fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = "Quantity",
                style = MaterialTheme.typography.titleMedium
            )
            Row(
                verticalAlignment = Alignment.CenterVertically,
                modifier = Modifier
                    .background(
                        MaterialTheme.colorScheme.surfaceVariant,
                        RoundedCornerShape(8.dp)
                    )
                    .padding(horizontal = 8.dp)
            ) {
                IconButton(
                    onClick = { if (quantity > 1) onQuantityChange(quantity - 1) }
                ) {
                    Icon(Icons.Default.Remove, null)
                }
                Text(
                    text = quantity.toString(),
                    modifier = Modifier.padding(horizontal = 16.dp),
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(
                    onClick = { 
                        if (ticket.availableCount == null || quantity < ticket.availableCount) {
                            onQuantityChange(quantity + 1)
                        }
                    }
                ) {
                    Icon(Icons.Default.Add, null)
                }
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        // Price Breakdown
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .background(
                    MaterialTheme.colorScheme.surfaceVariant,
                    RoundedCornerShape(12.dp)
                )
                .padding(16.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Ticket Price")
                Text("₹${ticket.memberPrice} × $quantity")
            }
            Spacer(modifier = Modifier.height(8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text("Booking Fee")
                Text("₹50")
            }
            Divider(modifier = Modifier.padding(vertical = 8.dp))
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    "Total Amount",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
                Text(
                    "₹${ticket.memberPrice * quantity + 50}",
                    style = MaterialTheme.typography.titleMedium,
                    fontWeight = FontWeight.Bold
                )
            }
        }

        Spacer(modifier = Modifier.height(24.dp))

        Button(
            onClick = onBook,
            modifier = Modifier.fillMaxWidth(),
            enabled = quantity > 0 && (ticket.availableCount == null || quantity <= ticket.availableCount)
        ) {
            Text("Book Now")
        }
    }
}

data class TicketType(
    val id: String,
    val name: String,
    val description: String? = null,
    val memberPrice: Double,
    val regularPrice: Double,
    val availableCount: Int? = null,
    val isActive: Boolean = true
) 