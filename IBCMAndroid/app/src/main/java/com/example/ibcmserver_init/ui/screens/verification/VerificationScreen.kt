package com.example.ibcmserver_init.ui.screens.verification

import android.net.Uri
import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.foundation.shape.RoundedCornerShape
import androidx.compose.material.icons.Icons
import androidx.compose.material.icons.filled.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.draw.clip
import androidx.compose.ui.graphics.Color
import androidx.compose.ui.unit.dp
import androidx.hilt.navigation.compose.hiltViewModel
import coil.compose.AsyncImage
import com.example.ibcmserver_init.data.model.verification.DocumentFile
import com.example.ibcmserver_init.data.model.verification.DocumentType
import com.example.ibcmserver_init.data.model.verification.VerificationDetails
import com.example.ibcmserver_init.data.model.verification.VerificationStatus
import com.example.ibcmserver_init.ui.viewmodel.VerificationUiState
import com.example.ibcmserver_init.ui.viewmodel.VerificationViewModel

@Composable
fun VerificationScreen(
    viewModel: VerificationViewModel = hiltViewModel(),
    onVerificationComplete: () -> Unit
) {
    val uiState by viewModel.uiState.collectAsState()
    val selectedDocuments by viewModel.selectedDocuments.collectAsState()

    LaunchedEffect(Unit) {
        viewModel.checkStatus()
    }

    Column(
        modifier = Modifier
            .fillMaxSize()
            .padding(16.dp)
    ) {
        Text(
            text = "Document Verification",
            style = MaterialTheme.typography.headlineMedium,
            modifier = Modifier.padding(bottom = 16.dp)
        )

        when (val state = uiState) {
            is VerificationUiState.Initial -> {
                DocumentUploader(
                    onDocumentSelected = { uri, type ->
                        viewModel.addDocument(uri, type)
                    }
                )

                LazyColumn(
                    modifier = Modifier
                        .weight(1f)
                        .fillMaxWidth()
                ) {
                    items(selectedDocuments) { document ->
                        DocumentPreview(
                            document = document,
                            onRemove = { viewModel.removeDocument(document) }
                        )
                    }
                }

                Button(
                    onClick = { viewModel.submitVerification() },
                    enabled = selectedDocuments.isNotEmpty(),
                    modifier = Modifier
                        .fillMaxWidth()
                        .padding(vertical = 16.dp)
                ) {
                    Text("Submit Verification")
                }
            }

            is VerificationUiState.Loading -> {
                CircularProgressIndicator(
                    modifier = Modifier.align(Alignment.CenterHorizontally)
                )
            }

            is VerificationUiState.Submitted,
            is VerificationUiState.Status -> {
                VerificationStatus(
                    details = when (state) {
                        is VerificationUiState.Submitted -> state.details
                        is VerificationUiState.Status -> state.details
                        else -> error("Invalid state")
                    },
                    onComplete = onVerificationComplete
                )
            }

            is VerificationUiState.Error -> {
                ErrorMessage(
                    message = state.message,
                    onRetry = { viewModel.checkStatus() }
                )
            }
        }
    }
}

@Composable
fun DocumentUploader(
    onDocumentSelected: (Uri, DocumentType) -> Unit,
    modifier: Modifier = Modifier
) {
    var showDocumentPicker by remember { mutableStateOf(false) }
    var selectedDocumentType by remember { mutableStateOf<DocumentType?>(null) }

    Column(modifier = modifier) {
        DocumentTypeSelector(
            onTypeSelected = { type ->
                selectedDocumentType = type
                showDocumentPicker = true
            }
        )

        if (showDocumentPicker) {
            // This would be implemented with ActivityResultLauncher in the actual Activity/Fragment
            // For now, we'll just show a placeholder
            Text("Document picker would be shown here")
        }
    }
}

@Composable
fun DocumentTypeSelector(
    onTypeSelected: (DocumentType) -> Unit
) {
    Column {
        Text(
            text = "Select Document Type",
            style = MaterialTheme.typography.titleMedium,
            modifier = Modifier.padding(bottom = 8.dp)
        )

        DocumentType::class.sealedSubclasses.forEach { subclass ->
            val documentType = subclass.objectInstance ?: return@forEach
            Button(
                onClick = { onTypeSelected(documentType) },
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(vertical = 4.dp)
            ) {
                Text(documentType.toString().replace("_", " "))
            }
        }
    }
}

@Composable
fun DocumentPreview(
    document: DocumentFile,
    onRemove: () -> Unit,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier
            .fillMaxWidth()
            .padding(8.dp)
    ) {
        Row(
            modifier = Modifier
                .padding(8.dp)
                .fillMaxWidth(),
            horizontalArrangement = Arrangement.SpaceBetween,
            verticalAlignment = Alignment.CenterVertically
        ) {
            AsyncImage(
                model = document.uri,
                contentDescription = null,
                modifier = Modifier
                    .size(60.dp)
                    .clip(RoundedCornerShape(4.dp))
            )

            Text(
                text = document.type.toString().replace("_", " "),
                style = MaterialTheme.typography.bodyMedium
            )

            IconButton(onClick = onRemove) {
                Icon(
                    imageVector = Icons.Default.Close,
                    contentDescription = "Remove document"
                )
            }
        }
    }
}

@Composable
fun VerificationStatus(
    details: VerificationDetails,
    onComplete: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp)
    ) {
        Icon(
            imageVector = when (details.status) {
                VerificationStatus.APPROVED -> Icons.Default.CheckCircle
                VerificationStatus.REJECTED -> Icons.Default.Cancel
                else -> Icons.Default.Pending
            },
            contentDescription = null,
            tint = when (details.status) {
                VerificationStatus.APPROVED -> Color.Green
                VerificationStatus.REJECTED -> Color.Red
                else -> Color.Gray
            },
            modifier = Modifier
                .size(48.dp)
                .align(Alignment.CenterHorizontally)
        )

        Text(
            text = when (details.status) {
                VerificationStatus.APPROVED -> "Verification Approved"
                VerificationStatus.REJECTED -> "Verification Rejected"
                VerificationStatus.PENDING -> "Verification Pending"
                VerificationStatus.MORE_INFO_NEEDED -> "Additional Information Needed"
            },
            style = MaterialTheme.typography.headlineSmall,
            modifier = Modifier.padding(vertical = 16.dp)
        )

        if (details.remarks != null) {
            Text(
                text = details.remarks,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.error
            )
        }

        if (details.status == VerificationStatus.APPROVED) {
            Button(
                onClick = onComplete,
                modifier = Modifier
                    .fillMaxWidth()
                    .padding(top = 16.dp)
            ) {
                Text("Continue")
            }
        }
    }
}

@Composable
fun ErrorMessage(
    message: String,
    onRetry: () -> Unit
) {
    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        horizontalAlignment = Alignment.CenterHorizontally
    ) {
        Icon(
            imageVector = Icons.Default.Error,
            contentDescription = null,
            tint = MaterialTheme.colorScheme.error,
            modifier = Modifier.size(48.dp)
        )

        Text(
            text = message,
            style = MaterialTheme.typography.bodyLarge,
            color = MaterialTheme.colorScheme.error,
            modifier = Modifier.padding(vertical = 16.dp)
        )

        Button(onClick = onRetry) {
            Text("Retry")
        }
    }
} 