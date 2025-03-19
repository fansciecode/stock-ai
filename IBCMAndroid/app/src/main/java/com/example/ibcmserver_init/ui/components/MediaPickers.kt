package com.example.ibcmserver_init.ui.components

import android.net.Uri
import androidx.activity.compose.rememberLauncherForActivityResult
import androidx.activity.result.contract.ActivityResultContracts
import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Modifier
import androidx.compose.ui.platform.LocalContext
import androidx.compose.ui.unit.dp

data class ImageContent(
    val uri: Uri,
    val name: String,
    val type: String = "image"
)

data class DocumentContent(
    val uri: Uri,
    val name: String,
    val type: String
)

@Composable
fun ImagePickerDialog(
    onDismiss: () -> Unit,
    onImagesSelected: (List<ImageContent>) -> Unit
) {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        val images = uris.map { uri ->
            ImageContent(
                uri = uri,
                name = uri.lastPathSegment ?: "image",
                type = context.contentResolver.getType(uri)?.split("/")?.last() ?: "jpg"
            )
        }
        onImagesSelected(images)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Images") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Choose images from your device")
                Text(
                    text = "Supported formats: JPG, PNG, GIF",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    launcher.launch("image/*")
                }
            ) {
                Text("Choose")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
}

@Composable
fun DocumentPickerDialog(
    onDismiss: () -> Unit,
    onDocumentsSelected: (List<DocumentContent>) -> Unit
) {
    val context = LocalContext.current
    val launcher = rememberLauncherForActivityResult(
        contract = ActivityResultContracts.GetMultipleContents()
    ) { uris ->
        val documents = uris.map { uri ->
            val mimeType = context.contentResolver.getType(uri)
            val type = when {
                mimeType?.contains("pdf") == true -> "pdf"
                mimeType?.contains("msword") == true || mimeType?.contains("document") == true -> "doc"
                else -> "file"
            }
            DocumentContent(
                uri = uri,
                name = uri.lastPathSegment ?: "document",
                type = type
            )
        }
        onDocumentsSelected(documents)
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Select Documents") },
        text = {
            Column(
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Choose documents from your device")
                Text(
                    text = "Supported formats: PDF, DOC, DOCX",
                    style = MaterialTheme.typography.bodySmall
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    launcher.launch("application/*")
                }
            ) {
                Text("Choose")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 