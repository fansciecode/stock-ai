package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.ui.screens.security.ReportEventDialog
import com.example.ibcmserver_init.ui.screens.security.SecurityViewModel
import com.example.ibcmserver_init.data.api.SecurityWarning
import com.example.ibcmserver_init.data.api.SecuritySeverity

@Composable
fun EventDisplayScreen(
    eventId: String,
    onNavigateBack: () -> Unit,
    modifier: Modifier = Modifier,
    viewModel: EventViewModel = hiltViewModel(),
    securityViewModel: SecurityViewModel = hiltViewModel()
) {
    var showReportDialog by remember { mutableStateOf(false) }
    val securityState by securityViewModel.securityState.collectAsState()
    val eventState by viewModel.eventState.collectAsState()
    var showSecurityWarning by remember { mutableStateOf(false) }
    var currentWarning by remember { mutableStateOf<SecurityWarning?>(null) }

    LaunchedEffect(eventId) {
        viewModel.loadEvent(eventId)
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text(text = eventState.event?.title ?: "") },
                navigationIcon = {
                    IconButton(onClick = onNavigateBack) {
                        Icon(Icons.Default.ArrowBack, contentDescription = "Back")
                    }
                },
                actions = {
                    // Report Button
                    IconButton(onClick = { showReportDialog = true }) {
                        Icon(
                            imageVector = Icons.Default.Flag,
                            contentDescription = "Report Event",
                            tint = MaterialTheme.colorScheme.error
                        )
                    }
                }
            )
        }
    ) { paddingValues ->
        Box(
            modifier = modifier
                .fillMaxSize()
                .padding(paddingValues)
        ) {
            // Existing event display content
            Column(
                modifier = Modifier
                    .fillMaxSize()
                    .padding(16.dp)
            ) {
                // Event content here...
                
                // Security Warnings (if any)
                eventState.securityWarnings?.let { warnings ->
                    if (warnings.isNotEmpty()) {
                        SecurityWarningsSection(
                            warnings = warnings,
                            onWarningClick = { warning ->
                                currentWarning = warning
                                showSecurityWarning = true
                            }
                        )
                    }
                }
            }

            // Report Dialog
            if (showReportDialog) {
                ReportEventDialog(
                    eventId = eventId,
                    onDismiss = { showReportDialog = false },
                    onReport = { reportType, description, evidence ->
                        securityViewModel.reportEvent(
                            eventId = eventId,
                            reportType = reportType,
                            description = description,
                            evidence = evidence,
                            reporterId = viewModel.getCurrentUserId() // Implement this in EventViewModel
                        )
                        showReportDialog = false
                    }
                )
            }

            // Security Warning Dialog
            if (showSecurityWarning && currentWarning != null) {
                AlertDialog(
                    onDismissRequest = { showSecurityWarning = false },
                    title = { Text("Security Warning") },
                    text = {
                        Column {
                            Text(currentWarning!!.message)
                            Spacer(modifier = Modifier.height(8.dp))
                            SecuritySeverityBadge(severity = currentWarning!!.severity)
                        }
                    },
                    confirmButton = {
                        TextButton(onClick = { showSecurityWarning = false }) {
                            Text("Acknowledge")
                        }
                    }
                )
            }

            // Loading and Error States
            when (securityState) {
                is SecurityState.Loading -> {
                    CircularProgressIndicator(
                        modifier = Modifier.align(Alignment.Center)
                    )
                }
                is SecurityState.Error -> {
                    Snackbar(
                        modifier = Modifier.align(Alignment.BottomCenter)
                    ) {
                        Text((securityState as SecurityState.Error).message)
                    }
                }
                is SecurityState.ReportSubmitted -> {
                    LaunchedEffect(Unit) {
                        // Show success message
                        // You might want to implement a SnackbarHostState to show this
                    }
                }
                else -> { /* Handle other states if needed */ }
            }
        }
    }
}

@Composable
private fun SecurityWarningsSection(
    warnings: List<SecurityWarning>,
    onWarningClick: (SecurityWarning) -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(vertical = 8.dp)
    ) {
        Text(
            text = "Security Warnings",
            style = MaterialTheme.typography.titleMedium,
            color = MaterialTheme.colorScheme.error
        )
        Spacer(modifier = Modifier.height(8.dp))
        warnings.forEach { warning ->
            SecurityWarningItem(
                warning = warning,
                onClick = { onWarningClick(warning) }
            )
            Spacer(modifier = Modifier.height(4.dp))
        }
    }
}

@Composable
private fun SecurityWarningItem(
    warning: SecurityWarning,
    onClick: () -> Unit
) {
    Surface(
        onClick = onClick,
        color = MaterialTheme.colorScheme.errorContainer.copy(alpha = 0.1f),
        shape = MaterialTheme.shapes.small
    ) {
        Row(
            modifier = Modifier
                .fillMaxWidth()
                .padding(8.dp),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            Text(
                text = warning.message,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error,
                modifier = Modifier.weight(1f)
            )
            SecuritySeverityBadge(severity = warning.severity)
        }
    }
}

@Composable
private fun SecuritySeverityBadge(
    severity: SecuritySeverity,
    modifier: Modifier = Modifier
) {
    val (backgroundColor, contentColor) = when (severity) {
        SecuritySeverity.LOW -> MaterialTheme.colorScheme.primary to MaterialTheme.colorScheme.onPrimary
        SecuritySeverity.MEDIUM -> MaterialTheme.colorScheme.secondary to MaterialTheme.colorScheme.onSecondary
        SecuritySeverity.HIGH -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.onError
        SecuritySeverity.CRITICAL -> MaterialTheme.colorScheme.error to MaterialTheme.colorScheme.onError
    }

    Surface(
        modifier = modifier,
        color = backgroundColor,
        contentColor = contentColor,
        shape = MaterialTheme.shapes.small
    ) {
        Text(
            text = severity.name,
            modifier = Modifier.padding(horizontal = 8.dp, vertical = 4.dp),
            style = MaterialTheme.typography.labelSmall
        )
    }
} 