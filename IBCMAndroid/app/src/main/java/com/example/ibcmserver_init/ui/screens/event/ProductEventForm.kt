package com.example.ibcmserver_init.ui.screens.event

import androidx.compose.foundation.layout.*
import androidx.compose.foundation.lazy.LazyColumn
import androidx.compose.foundation.lazy.items
import androidx.compose.material3.*
import androidx.compose.runtime.*
import androidx.compose.ui.Alignment
import androidx.compose.ui.Modifier
import androidx.compose.ui.unit.dp
import com.example.ibcmserver_init.data.model.event.*
import java.time.LocalDateTime
import java.time.format.DateTimeFormatter

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun ProductEventForm(
    onProductCreated: (Product) -> Unit
) {
    var showAddProductDialog by remember { mutableStateOf(false) }
    var showAddDeliveryOptionDialog by remember { mutableStateOf(false) }
    var products by remember { mutableStateOf<List<Product>>(emptyList()) }
    var deliveryOptions by remember { mutableStateOf<List<DeliveryOption>>(emptyList()) }

    Column(
        modifier = Modifier
            .fillMaxWidth()
            .padding(16.dp),
        verticalArrangement = Arrangement.spacedBy(16.dp)
    ) {
        Text(
            text = "Products",
            style = MaterialTheme.typography.titleMedium
        )

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(products) { product ->
                ProductCard(
                    product = product,
                    onDelete = {
                        products = products.filter { it.id != product.id }
                    }
                )
            }
        }

        Button(
            onClick = { showAddProductDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Add Product")
        }

        Divider()

        Text(
            text = "Delivery Options",
            style = MaterialTheme.typography.titleMedium
        )

        LazyColumn(
            modifier = Modifier.fillMaxWidth(),
            verticalArrangement = Arrangement.spacedBy(8.dp)
        ) {
            items(deliveryOptions) { option ->
                DeliveryOptionCard(
                    deliveryOption = option,
                    onDelete = {
                        deliveryOptions = deliveryOptions.filter { it.id != option.id }
                    }
                )
            }
        }

        Button(
            onClick = { showAddDeliveryOptionDialog = true },
            modifier = Modifier.fillMaxWidth()
        ) {
            Text("Add Delivery Option")
        }
    }

    if (showAddProductDialog) {
        AddProductDialog(
            onDismiss = { showAddProductDialog = false },
            onProductCreated = { product ->
                products = products + product
                onProductCreated(product)
                showAddProductDialog = false
            }
        )
    }

    if (showAddDeliveryOptionDialog) {
        AddDeliveryOptionDialog(
            onDismiss = { showAddDeliveryOptionDialog = false },
            onDeliveryOptionCreated = { option ->
                deliveryOptions = deliveryOptions + option
                showAddDeliveryOptionDialog = false
            }
        )
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun AddProductDialog(
    onDismiss: () -> Unit,
    onProductCreated: (Product) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var description by remember { mutableStateOf("") }
    var price by remember { mutableStateOf("0.00") }
    var inventory by remember { mutableStateOf("0") }
    var category by remember { mutableStateOf("") }
    var specifications by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Product") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = description,
                    onValueChange = { description = it },
                    label = { Text("Description") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )

                OutlinedTextField(
                    value = price,
                    onValueChange = { price = it },
                    label = { Text("Price") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = inventory,
                    onValueChange = { inventory = it },
                    label = { Text("Inventory") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = category,
                    onValueChange = { category = it },
                    label = { Text("Category") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = specifications,
                    onValueChange = { specifications = it },
                    label = { Text("Specifications (key:value, comma-separated)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val specs = specifications.split(",")
                        .map { it.trim() }
                        .filter { it.contains(":") }
                        .associate {
                            val parts = it.split(":")
                            parts[0].trim() to parts[1].trim()
                        }

                    val product = Product(
                        id = java.util.UUID.randomUUID().toString(),
                        name = name,
                        description = description,
                        price = price.toDoubleOrNull() ?: 0.0,
                        inventory = inventory.toIntOrNull() ?: 0,
                        category = category,
                        images = emptyList(),
                        specifications = specs,
                        variants = null
                    )
                    onProductCreated(product)
                },
                enabled = name.isNotBlank() && description.isNotBlank() &&
                        price.toDoubleOrNull() != null && inventory.toIntOrNull() != null &&
                        category.isNotBlank()
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
fun AddDeliveryOptionDialog(
    onDismiss: () -> Unit,
    onDeliveryOptionCreated: (DeliveryOption) -> Unit
) {
    var name by remember { mutableStateOf("") }
    var estimatedDays by remember { mutableStateOf("1") }
    var cost by remember { mutableStateOf("0.00") }
    var restrictions by remember { mutableStateOf("") }

    AlertDialog(
        onDismissRequest = onDismiss,
        title = { Text("Add Delivery Option") },
        text = {
            Column(
                modifier = Modifier.fillMaxWidth(),
                verticalArrangement = Arrangement.spacedBy(8.dp)
            ) {
                OutlinedTextField(
                    value = name,
                    onValueChange = { name = it },
                    label = { Text("Name") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = estimatedDays,
                    onValueChange = { estimatedDays = it },
                    label = { Text("Estimated Days") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = cost,
                    onValueChange = { cost = it },
                    label = { Text("Cost") },
                    modifier = Modifier.fillMaxWidth()
                )

                OutlinedTextField(
                    value = restrictions,
                    onValueChange = { restrictions = it },
                    label = { Text("Restrictions (comma-separated)") },
                    modifier = Modifier.fillMaxWidth(),
                    minLines = 2
                )
            }
        },
        confirmButton = {
            TextButton(
                onClick = {
                    val option = DeliveryOption(
                        id = java.util.UUID.randomUUID().toString(),
                        name = name,
                        estimatedDays = estimatedDays.toIntOrNull() ?: 1,
                        cost = cost.toDoubleOrNull() ?: 0.0,
                        restrictions = restrictions.split(",")
                            .map { it.trim() }
                            .filter { it.isNotEmpty() }
                    )
                    onDeliveryOptionCreated(option)
                },
                enabled = name.isNotBlank() && estimatedDays.toIntOrNull() != null &&
                        cost.toDoubleOrNull() != null
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
fun ProductCard(
    product: Product,
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
                    text = product.name,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete"
                    )
                }
            }

            Text(
                text = product.description,
                style = MaterialTheme.typography.bodyMedium
            )

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Price: $${product.price}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Inventory: ${product.inventory}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            Text(
                text = "Category: ${product.category}",
                style = MaterialTheme.typography.bodyMedium
            )

            if (product.specifications.isNotEmpty()) {
                Text(
                    text = "Specifications:",
                    style = MaterialTheme.typography.titleSmall
                )
                product.specifications.forEach { (key, value) ->
                    Text(
                        text = "• $key: $value",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
}

@OptIn(ExperimentalMaterial3Api::class)
@Composable
fun DeliveryOptionCard(
    deliveryOption: DeliveryOption,
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
                    text = deliveryOption.name,
                    style = MaterialTheme.typography.titleMedium
                )
                IconButton(onClick = onDelete) {
                    Icon(
                        imageVector = Icons.Default.Delete,
                        contentDescription = "Delete"
                    )
                }
            }

            Row(
                modifier = Modifier.fillMaxWidth(),
                horizontalArrangement = Arrangement.SpaceBetween
            ) {
                Text(
                    text = "Estimated Days: ${deliveryOption.estimatedDays}",
                    style = MaterialTheme.typography.bodyMedium
                )
                Text(
                    text = "Cost: $${deliveryOption.cost}",
                    style = MaterialTheme.typography.bodyMedium
                )
            }

            if (!deliveryOption.restrictions.isNullOrEmpty()) {
                Text(
                    text = "Restrictions:",
                    style = MaterialTheme.typography.titleSmall
                )
                deliveryOption.restrictions.forEach { restriction ->
                    Text(
                        text = "• $restriction",
                        style = MaterialTheme.typography.bodyMedium
                    )
                }
            }
        }
    }
} 