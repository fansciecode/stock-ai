package com.example.ibcmserver_init.ui.screens.security

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.rememberScrollState
import androidx.compose.foundation.verticalScroll
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.res.stringResource
import androidx.compose.ui.unit.dp
import androidx.compose.ui.window.Dialog
import com.example.ibcmserver_init.data.api.ReportType
import com.example.ibcmserver_init.data.api.ReportStatus

@Composable
fun ReportEventDialog(
    eventId: String,
    onDismiss: () -> Unit,
    onReport: (ReportType, String, List<String>) -> Unit,
    modifier: Modifier = Modifier
) {
    var selectedReportType by remember { mutableStateOf<ReportType?>(null) }
    var description by remember { mutableStateOf("") }
    var evidence by remember { mutableStateOf<List<String>>(emptyList()) }
    var showEvidenceDialog by remember { mutableStateOf(false) }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = MaterialTheme.shapes.large,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier
                    .padding(24.dp)
                    .verticalScroll(rememberScrollState()),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Report Event",
                    style = MaterialTheme.typography.headlineSmall
                )

                // Report Type Selection
                ExposedDropdownMenuBox(
                    expanded = false,
                    onExpandedChange = { }
                ) {
                    OutlinedTextField(
                        value = selectedReportType?.name ?: "",
                        onValueChange = { },
                        readOnly = true,
                        label = { Text("Report Type") },
                        modifier = Modifier.fillMaxWidth()
                    )

                    ExposedDropdownMenu(
                        expanded = false,
                        onDismissRequest = { }
                    ) {
                        ReportType.values().forEach { reportType ->
                            DropdownMenuItem(
                                text = { Text(reportType.name) },
                                onClick = { selectedReportType = reportType }
                            )
                        }
                    }
                }

                // Description Input
                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 3,
                    maxLines = 5
                )

                // Evidence Section
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.SpaceBetween,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Text(
                        text = "Evidence (${evidence.size})",
                        style = MaterialTheme.typography.bodyMedium
                    )
                    TextButton(onClick = { showEvidenceDialog = true }) {
                        Text("Add Evidence")
                    }
                }

                // Action Buttons
                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End,
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = {
                            selectedReportType?.let { reportType ->
                                onReport(reportType, description, evidence)
                            }
                        },
                        enabled = selectedReportType != null && description.isNotBlank()
                    ) {
                        Text("Submit Report")
                    }
                }
            }
        }
    }

    if (showEvidenceDialog) {
        AddEvidenceDialog(
            onDismiss = { showEvidenceDialog = false },
            onEvidenceAdded = { newEvidence ->
                evidence = evidence + newEvidence
                showEvidenceDialog = false
            }
        )
    }
}

@Composable
private fun AddEvidenceDialog(
    onDismiss: () -> Unit,
    onEvidenceAdded: (String) -> Unit
) {
    var evidenceUrl by remember { mutableStateOf("") }

    Dialog(onDismissRequest = onDismiss) {
        Surface(
            modifier = Modifier
                .fillMaxWidth()
                .wrapContentHeight(),
            shape = MaterialTheme.shapes.large,
            tonalElevation = 6.dp
        ) {
            Column(
                modifier = Modifier.padding(24.dp),
                verticalArrangement = Arrangement.spacedBy(16.dp)
            ) {
                Text(
                    text = "Add Evidence",
                    style = MaterialTheme.typography.titleMedium
                )

                OutlinedTextField(
                    value = evidenceUrl,
                    onValueChange = { evidenceUrl = it },
                    label = { Text("Evidence URL") },
                    modifier = Modifier.fillMaxWidth()
                )

                Row(
                    modifier = Modifier.fillMaxWidth(),
                    horizontalArrangement = Arrangement.End
                ) {
                    TextButton(onClick = onDismiss) {
                        Text("Cancel")
                    }
                    Spacer(modifier = Modifier.width(8.dp))
                    Button(
                        onClick = { onEvidenceAdded(evidenceUrl) },
                        enabled = evidenceUrl.isNotBlank()
                    ) {
                        Text("Add")
                    }
                }
            }
        }
    }
}

@Composable
fun ReportStatusBadge(
    status: ReportStatus,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, contentColor) = when (status) {
        ReportStatus.SUBMITTED -> MaterialTheme.colorScheme.primary to MaterialTheme.colorScheme.onPrimary
        ReportStatus.UNDER_REVIEW -> MaterialTheme.colorScheme.secondary to MaterialTheme.colorScheme.onSecondary
        ReportStatus.RESOLVED -> MaterialTheme.colorScheme.tertiary to MaterialTheme.colorScheme.onTertiary
        ReportStatus.REJECTED -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.onError
    }

    Surface(
        modifier = modifier,
        color = backgroundColor,
        contentColor = contentColor,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = status.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
} 