package com.example.ibcmserver_init.ui.components

import androidx.compose.foundation.layout.*
import androidx.compose.material3.*
import androidx.compose.runtime.Composable
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.text.style.TextAlign
import androidx.compose.ui.unit.dp
import com.example.ibcmserver_init.data.model.Message
import java.time.format.DateTimeFormatter
import java.time.LocalDateTime

@Composable
fun MessageItem(
    message: Message,
    modifier: Modifier = Modifier
) {
    Card(
        modifier = modifier.fillMaxWidth(),
        colors = CardDefaults.cardColors(
            containerColor = MaterialTheme.colorScheme.surfaceVariant
        )
    ) {
        Column(
            modifier = Modifier.padding(12.dp)
        ) {
            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween,
                verticalAlignment = Alignment.CenterVertically
            ) {
                Text(
                    text = message.senderName,
                    style = MaterialTheme.typography.labelMedium,
                    color = MaterialTheme.colorScheme.primary
                )
                Text(
                    text = formatTimestamp(message.timestamp),
                    style = MaterialTheme.typography.labelSmall,
                    color = MaterialTheme.colorScheme.onSurfaceVariant
                )
            }
            Spacer(modifier = Modifier.height(4.dp))
            Text(
                text = message.content,
                style = MaterialTheme.typography.bodyMedium,
                color = MaterialTheme.colorScheme.onSurfaceVariant
            )
            message.imageUrl?.let { url ->
                Spacer(modifier = Modifier.height(8.dp))
                // TODO: Add image loading component here
            }
        }
    }
}

private fun formatTimestamp(timestamp: String): String {
    return try {
        val dateTime = LocalDateTime.parse(timestamp)
        val formatter = DateTimeFormatter.ofPattern("MMM d, h:mm a")
        dateTime.format(formatter)
    } catch (e: Exception) {
        timestamp
    }
} 