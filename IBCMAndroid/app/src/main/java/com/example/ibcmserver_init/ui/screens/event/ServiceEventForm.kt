package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.ibcmserver_init.data.model.event.ServiceDetails
import com.example.ibcmserver_init.data.model.event.ServiceProvider
import com.example.ibcmserver_init.data.model.event.TimeSlot
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ServiceEventForm(
    onServiceDetailsCreated: (ServiceDetails) -> Unit
) {
    var showAddServiceDialog by remember { mutableStateOf(false) }
    var showAddTimeSlotDialog by remember { mutableStateOf(false) }
    var serviceDetails by remember { mutableStateOf<ServiceDetails?>(null) }
    var timeSlots by remember { mutableStateOf<List<TimeSlot>>(emptyList()) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Service Details",
            style = MaterialTheme.typography.titleMedium
        )

        serviceDetails?.let { details ->
            ServiceDetailsCard(
                serviceDetails = details,
                onEdit = { showAddServiceDialog = true },
                onDelete = { serviceDetails = null }
            )
        } ?: Button(
            onClick = { showAddServiceDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Add Service Details")
        }

        Divider()

        Text(
            text = "Time Slots",
            style = MaterialTheme.typography.titleMedium
        )

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(timeSlots) { timeSlot ->
                TimeSlotCard(
                    timeSlot = timeSlot,
                    onDelete = {
                        timeSlots = timeSlots.filter { it.id != timeSlot.id }
                    }
                )
            }
        }

        Button(
            onClick = { showAddTimeSlotDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Add Time Slot")
        }
    }

    if (showAddServiceDialog) {
        AddServiceDetailsDialog(
            existingDetails = serviceDetails,
            onDismiss = { showAddServiceDialog = false },
            onServiceDetailsCreated = { details ->
                serviceDetails = details
                onServiceDetailsCreated(details)
                showAddServiceDialog = false
            }
        )
    }

    if (showAddTimeSlotDialog) {
        AddTimeSlotDialog(
            onDismiss = { showAddTimeSlotDialog = false },
            onTimeSlotCreated = { timeSlot ->
                timeSlots = timeSlots + timeSlot
                showAddTimeSlotDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddServiceDetailsDialog(
    existingDetails: ServiceDetails? = null,
    onDismiss: () -> Unit,
    onServiceDetailsCreated: (ServiceDetails) -> Unit
) {
    var duration by remember { mutableStateOf(existingDetails?.duration?.toString() ?: "") }
    var maxParticipants by remember { mutableStateOf(existingDetails?.maxParticipants?.toString() ?: "") }
    var requirements by remember { mutableStateOf(existingDetails?.requirements?.joinToString(",") ?: "") }
    var cancellationPolicy by remember { mutableStateOf(existingDetails?.cancellationPolicy ?: "") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text(if (existingDetails != null) "Edit Service Details" else "Add Service Details") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = duration,
                    onValueChange = { duration = it },
                    label = { Text("Duration (minutes)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = maxParticipants,
                    onValueChange = { maxParticipants = it },
                    label = { Text("Max Participants") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = requirements,
                    onValueChange = { requirements = it },
                    label = { Text("Requirements (comma-separated)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )

                OutlinedTextField(
                    value = cancellationPolicy,
                    onValueChange = { cancellationPolicy = it },
                    label = { Text("Cancellation Policy") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val details = ServiceDetails(
                        duration = duration.toIntOrNull() ?: 60,
                        maxParticipants = maxParticipants.toIntOrNull() ?: 1,
                        requirements = requirements.split(",").map { it.trim() }.filter { it.isNotEmpty() },
                        cancellationPolicy = cancellationPolicy
                    )
                    onServiceDetailsCreated(details)
                },
                enabled = duration.toIntOrNull() != null && maxParticipants.toIntOrNull() != null
            ) {
                Text(if (existingDetails != null) "Update" else "Add")
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
fun AddTimeSlotDialog(
    onDismiss: () -> Unit,
    onTimeSlotCreated: (TimeSlot) -> Unit
) {
    var startTime by remember { mutableStateOf("") }
    var endTime by remember { mutableStateOf("") }
    var availability by remember { mutableStateOf("0") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Time Slot") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = startTime,
                    onValueChange = { startTime = it },
                    label = { Text("Start Time (HH:mm)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = endTime,
                    onValueChange = { endTime = it },
                    label = { Text("End Time (HH:mm)") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = availability,
                    onValueChange = { availability = it },
                    label = { Text("Availability") },
                    modifier = Modifier.fillMaxWidth()
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val timeSlot = TimeSlot(
                        id = java.util.UUID.randomUUID().toString(),
                        startTime = startTime,
                        endTime = endTime,
                        availability = availability.toIntOrNull() ?: 0
                    )
                    onTimeSlotCreated(timeSlot)
                },
                enabled = startTime.isNotBlank() && endTime.isNotBlank() &&
                        availability.toIntOrNull() != null
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
fun ServiceDetailsCard(
    serviceDetails: ServiceDetails,
    onEdit: () -> Unit,
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
                    text = "Service Details",
                    style = MaterialTheme.typography.titleMedium
                )
                Row {
                    IconButton(onClick = onEdit) {
                        Icon(
                            imageVector = Icons.Default.Edit,
                            contentDescription = "Edit"
                        )
                    }
                    IconButton(onClick = onDelete) {
                        Icon(
                            imageVector = Icons.Default.Delete,
                            contentDescription = "Delete"
                        )
                    }
                }
            }

            Text(
                text = "Duration: ${serviceDetails.duration} minutes",
                style = MaterialTheme.typography.bodyMedium
            )

            Text(
                text = "Max Participants: ${serviceDetails.maxParticipants}",
                style = MaterialTheme.typography.bodyMedium
            )

            if (serviceDetails.requirements.isNotEmpty()) {
                Text(
                    text = "Requirements:",
                    style = MaterialTheme.typography.titleSmall
                )
                serviceDetails.requirements.forEach { requirement ->
                    Text(
                        text = "• $requirement",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }

            Text(
                text = "Cancellation Policy:",
                style = MaterialTheme.typography.titleSmall
            )
            Text(
                text = serviceDetails.cancellationPolicy,
                style = MaterialTheme.typography.bodyMedium
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun TimeSlotCard(
    timeSlot: TimeSlot,
    onDelete: () -> Unit
) {
    Card(
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 2.dp)
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Column {
                Text(
                    text = "${timeSlot.startTime} - ${timeSlot.endTime}",
                    style = MaterialTheme.typography.titleMedium
                )
                Text(
                    text = "Available slots: ${timeSlot.availability}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }
            IconButton(onClick = onDelete) {
                Icon(
                    imageVector = Icons.Default.Delete,
                    contentDescription = "Delete"
                )
            }
        }
    }
} 