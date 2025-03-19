package com.example.ibcmserver_init.ui.screens.event

data class ProductData(
    val id: String,
    val name: String,
    val description: String,
    val price: String,
    val images: List<String>,
    val specifications: Map<String, String>,
    val highlights: List<String>,
    val maxQuantity: Int,
    val imageUrl: String, // Thumbnail image for catalog view
    val rating: Float,
    val reviewCount: Int,
    val seller: String,
    val isAvailable: Boolean,
    val discount: Int? = null // Percentage discount if applicable
) 