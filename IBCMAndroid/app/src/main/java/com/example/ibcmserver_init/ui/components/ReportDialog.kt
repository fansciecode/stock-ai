@Composable
fun ReportDialog(
    type: String,
    onDismiss: () -> Unit,
    onReport: (String) -> Unit
) {
    var selectedReason by remember { mutableStateOf<String?>(null) }
    var otherReason by remember { mutableStateOf("") }

    val reasons = when (type) {
        "Event" -> listOf(
            "Inappropriate content",
            "Fake event",
            "Scam",
            "Wrong location",
            "Misleading information",
            "Other"
        )
        "User" -> listOf(
            "Spam",
            "Fake profile",
            "Harassment",
            "Inappropriate behavior",
            "Scam",
            "Other"
        )
        "Chat", "Message" -> listOf(
            "Harassment",
            "Spam",
            "Inappropriate content",
            "Threatening messages",
            "Scam",
            "Other"
        )
        else -> listOf()
    }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Report $type") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                Text("Why are you reporting this $type?")
                
                reasons.forEach { reason ->
                    Row(
                        modifier = Modifier
                            .fillMaxWidth()
                            .clickable { selectedReason = reason }
                            .padding(vertical = 8.dp),
                        verticalAlignment = Alignment.CenterVertically
                    ) {
                        RadioButton(
                            selected = reason == selectedReason,
                            onClick = { selectedReason = reason }
                        )
                        Text(
                            text = reason,
                            modifier = Modifier.padding(start = 8.dp)
                        )
                    }
                }

                if (selectedReason == "Other") {
                    OutlinedTextField(
                        value = otherReason,
                        onValueChange = { otherReason = it },
                        label = { Text("Please specify") },
                        modifier = Modifier.fillMaxWidth()
                    )
                }
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val finalReason = if (selectedReason == "Other") otherReason else selectedReason
                    if (!finalReason.isNullOrBlank()) {
                        onReport(finalReason)
                    }
                },
                enabled = selectedReason != null && 
                    (selectedReason != "Other" || otherReason.isNotBlank())
            ) {
                Text("Report")
            }
        },
        dismissButton = {
            TextButton(onClick = onDismiss) {
                Text("Cancel")
            }
        }
    )
} 