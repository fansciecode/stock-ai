package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.grid.GridCells
import androidx.compose.foundation.lazy.grid.LazyVerticalGrid
import androidx.compose.foundation.lazy.grid.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.event.*
import com.example.ibcmserver_init.ui.components.LoadingDialog
import com.example.ibcmserver_init.ui.viewmodel.TicketBookingViewModel
import com.example.ibcmserver_init.utils.NetworkResult

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TicketBookingScreen(
    eventId: String,
    onNavigateBack: () -> Unit,
    viewModel: TicketBookingViewModel = hiltViewModel()
) {
    val bookingState by viewModel.bookingState.collectAsState()
    val seatingState by viewModel.seatingState.collectAsState()
    val selectedSeats by viewModel.selectedSeats.collectAsState()
    val aiRecommendations by viewModel.aiRecommendations.collectAsState()

    var showSeatSelectionDialog by remember { mutableStateOf(false) }
    var showAIRecommendationsDialog by remember { mutableStateOf(false) }

    LaunchedEffect(eventId) {
        viewModel.loadEventDetails(eventId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Book Tickets") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    IconButton(onClick = { showAIRecommendationsDialog = true }) {
                        Icon(Icons.Default.Assistant, contentDescription = "AI Recommendations")
                    }
                }
            )
        }
    ) { padding ->
        when (val state = bookingState) {
            is NetworkResult.Loading -> {
                LoadingDialog(message = "Loading event details...")
            }
            is NetworkResult.Success -> {
                BookingContent(
                    event = state.data,
                    seatingState = seatingState,
                    selectedSeats = selectedSeats,
                    onSeatSelect = { viewModel.toggleSeatSelection(it) },
                    onBookTickets = { viewModel.bookTickets() },
                    modifier = Modifier.padding(padding)
                )
            }
            is NetworkResult.Error -> {
                Box(
                    modifier = Modifier
                        .fillMaxSize()
                        .padding(padding),
                    contentAlignment = Alignment.Center
                ) {
                    Text(
                        text = state.message,
                        style = MaterialTheme.typography.bodyLarge,
                        color = MaterialTheme.colorScheme.error
                    )
                }
            }
            else -> {}
        }
    }

    if (showAIRecommendationsDialog) {
        AIRecommendationsDialog(
            recommendations = aiRecommendations,
            onDismiss = { showAIRecommendationsDialog = false },
            onApplyRecommendation = { seats ->
                viewModel.applyRecommendedSeats(seats)
                showAIRecommendationsDialog = false
            }
        )
    }
}

@Composable
private fun BookingContent(
    event: EnhancedEvent,
    seatingState: NetworkResult<SeatingArrangement>,
    selectedSeats: List<SeatInfo>,
    onSeatSelect: (SeatInfo) -> Unit,
    onBookTickets: () -> Unit,
    modifier: Modifier = Modifier
) {
    LazyColumn(
        modifier = modifier.fillMaxSize(),
        contentPadding = PaddingValues(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        item {
            Text(
                text = event.title,
                style = MaterialTheme.typography.headlineMedium
            )
        }

        item {
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
                    Text(
                        text = "Seating Arrangement",
                        style = MaterialTheme.typography.titleMedium
                    )
                    when (seatingState) {
                        is NetworkResult.Success -> {
                            SeatingGrid(
                                seating = seatingState.data,
                                selectedSeats = selectedSeats,
                                onSeatSelect = onSeatSelect
                            )
                        }
                        is NetworkResult.Loading -> {
                            CircularProgressIndicator(
                                modifier = Modifier.align(Alignment.CenterHorizontally)
                            )
                        }
                        is NetworkResult.Error -> {
                            Text(
                                text = seatingState.message,
                                color = MaterialTheme.colorScheme.error
                            )
                        }
                        else -> {}
                    }
                }
            }
        }

        item {
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
                    Text(
                        text = "Selected Seats",
                        style = MaterialTheme.typography.titleMedium
                    )
                    if (selectedSeats.isEmpty()) {
                        Text(
                            text = "No seats selected",
                            style = MaterialTheme.typography.bodyMedium
                        )
                    } else {
                        selectedSeats.forEach { seat ->
                            Row(
                                modifier = Modifier.fillMaxWidth(),
                                horizontalArrangement = Arrangement.SpaceBetween,
                                verticalAlignment = Alignment.CenterVertically
                            ) {
                                Text(
                                    text = "Section ${seat.section}, Row ${seat.row}, Seat ${seat.number}",
                                    style = MaterialTheme.typography.bodyMedium
                                )
                                IconButton(onClick = { onSeatSelect(seat) }) {
                                    Icon(Icons.Default.Close, contentDescription = "Remove")
                                }
                            }
                        }
                    }
                }
            }
        }

        item {
            Button(
                onClick = onBookTickets,
                modifier = Modifier.fillMaxWidth(),
                enabled = selectedSeats.isNotEmpty()
            ) {
                Text("Book Tickets")
            }
        }
    }
}

@Composable
private fun SeatingGrid(
    seating: SeatingArrangement,
    selectedSeats: List<SeatInfo>,
    onSeatSelect: (SeatInfo) -> Unit
) {
    LazyVerticalGrid(
        columns = GridCells.Fixed(10),
        horizontalArrangement = Arrangement.spacedBy(4.dp),
        verticalArrangement = Arrangement.spacedBy(4.dp)
    ) {
        items(seating.sections.flatMap { section ->
            section.rows.flatMap { row ->
                row.seats.map { seat ->
                    SeatInfo(section.name, row.name, seat.number)
                }
            }
        }) { seatInfo ->
            SeatButton(
                seatInfo = seatInfo,
                isSelected = selectedSeats.contains(seatInfo),
                onSelect = { onSeatSelect(seatInfo) }
            )
        }
    }
}

@Composable
private fun SeatButton(
    seatInfo: SeatInfo,
    isSelected: Boolean,
    onSelect: () -> Unit
) {
    Button(
        onClick = onSelect,
        modifier = Modifier.size(32.dp),
        colors = ButtonDefaults.buttonColors(
            containerColor = if (isSelected) {
                MaterialTheme.colorScheme.primary
            } else {
                MaterialTheme.colorScheme.surfaceVariant
            }
        ),
        contentPadding = PaddingValues(0.dp)
    ) {
        Text(
            text = seatInfo.number,
            style = MaterialTheme.typography.labelSmall
        )
    }
}

@Composable
private fun AIRecommendationsDialog(
    recommendations: NetworkResult<List<List<SeatInfo>>>,
    onDismiss: () -> Unit,
    onApplyRecommendation: (List<SeatInfo>) -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("AI Recommendations") },
        text = {
            when (recommendations) {
                is NetworkResult.Success -> {
                    Column(
                        verticalArrangement = Arrangement.spacedBy(8.dp)
                    ) {
                        Text("Here are some seating recommendations based on your preferences:")
                        recommendations.data.forEachIndexed { index, seats ->
                            Card(
                                onClick = { onApplyRecommendation(seats) },
                                modifier = Modifier.fillMaxWidth()
                            ) {
                                Column(
                                    modifier = Modifier.padding(8.dp),
                                    verticalArrangement = Arrangement.spacedBy(4.dp)
                                ) {
                                    Text(
                                        text = "Option ${index + 1}",
                                        style = MaterialTheme.typography.titleSmall
                                    )
                                    seats.forEach { seat ->
                                        Text(
                                            text = "Section ${seat.section}, Row ${seat.row}, Seat ${seat.number}",
                                            style = MaterialTheme.typography.bodySmall
                                        )
                                    }
                                }
                            }
                        }
                    }
                }
                is NetworkResult.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.CenterHorizontally)
                    )
                }
                is NetworkResult.Error -> {
                    Text(
                        text = recommendations.message,
                        color = MaterialTheme.colorScheme.error
                    )
                }
                else -> {}
            }
        },
        confirmButton = {
            TextButton(onClick = onDismiss) {
                Text("Close")
            }
        }
    )
}

data class SeatInfo(
    val section: String,
    val row: String,
    val number: String
) 