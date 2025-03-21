package com.example.ibcmserver_init.ui.screens.package

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import com.example.ibcmserver_init.data.model.package.EventPackage
import com.example.ibcmserver_init.data.model.package.UserEventLimit
import com.example.ibcmserver_init.ui.components.LoadingIndicator
import com.example.ibcmserver_init.ui.components.ErrorDialog

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun PackageScreen(
    viewModel: PackageViewModel = hiltViewModel(),
    onNavigateBack: () -> Unit,
    onPackageSelected: (String) -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.loadAvailablePackages()
    }

    Scaffold(
        topBar = {
            TopAppBar(
                title = { Text("Event Packages") },
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
                is PackageUiState.Initial -> {
                    // Show loading or initial state
                }
                is PackageUiState.Loading -> {
                    LoadingIndicator()
                }
                is PackageUiState.PackagesLoaded -> {
                    PackageList(
                        packages = (uiState as PackageUiState.PackagesLoaded).packages,
                        onPackageSelected = onPackageSelected
                    )
                }
                is PackageUiState.Error -> {
                    ErrorDialog(
                        message = (uiState as PackageUiState.Error).message,
                        onDismiss = { viewModel.loadAvailablePackages() }
                    )
                }
                else -> {
                    // Handle other states
                }
            }
        }
    }
}

@Composable
private fun PackageList(
    packages: List<EventPackage>,
    onPackageSelected: (String) -> Unit
) {
    LazyColumn(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        items(packages) { package ->
            PackageCard(
                eventPackage = package,
                onClick = { onPackageSelected(package.id) }
            )
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
private fun PackageCard(
    eventPackage: EventPackage,
    onClick: () -> Unit
) {
    Card(
        onClick = onClick,
        modifier = Modifier.fillMaxWidth(),
        elevation = CardDefaults.cardElevation(defaultElevation = 4.dp)
    ) {
        Column(
            modifier = Modifier
                .fillMaxWidth()
                .padding(16.dp)
        ) {
            Text(
                text = eventPackage.name,
                style = MaterialTheme.typography.titleLarge
            )
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = eventPackage.description,
                style = MaterialTheme.typography.bodyMedium
            )
            
            Spacer(modifier = Modifier.height(16.dp))
            
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Column {
                    Text(
                        text = "₹${eventPackage.price / 100.0}",
                        style = MaterialTheme.typography.titleMedium
                    )
                    Text(
                        text = "${eventPackage.eventLimit} Events",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
                
                Button(onClick = onClick) {
                    Text("Select")
                }
            }
            
            Spacer(modifier = Modifier.height(8.dp))
            
            Text(
                text = "Features:",
                style = MaterialTheme.typography.titleSmall
            )
            
            eventPackage.features.forEach { feature ->
                Row(
                    modifier = Modifier.padding(vertical = 4.dp),
                    verticalAlignment = Alignment.CenterVertically
                ) {
                    Icon(
                        imageVector = Icons.Default.Check,
                        contentDescription = null,
                        modifier = Modifier.size(16.dp)
                    )
                    Spacer(modifier = Modifier.width(8.dp))
                    Text(
                        text = feature,
                        style = MaterialTheme.typography.bodySmall
                    )
                }
            }
        }
    }
}

@Composable
fun EventLimitDialog(
    userLimit: UserEventLimit,
    onPurchaseClick: () -> Unit,
    onDismiss: () -> Unit
) {
    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Event Creation Limit Reached") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                horizontalAlignment = Alignment.CenterHorizontally
            ) {
                Text(
                    text = "You have used ${userLimit.usedEvents} out of ${userLimit.totalEvents} events",
                    style = MaterialTheme.typography.bodyLarge,
                    textAlign = TextAlign.Center
                )
                
                Spacer(modifier = Modifier.height(16.dp))
                
                Text(
                    text = "Purchase a package to create more events",
                    style = MaterialTheme.typography.bodyMedium,
                    textAlign = TextAlign.Center
                )
            }
        },
        confirmButton = {
            Button(onClick = onPurchaseClick) {
                Text("View Packages")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 