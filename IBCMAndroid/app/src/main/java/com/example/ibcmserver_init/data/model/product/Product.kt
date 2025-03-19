data class Product(
    val id: String,
    val name: String,
    val description: String,
    val price: Double,
    val images: List<String>,
    val category: String,
    val sellerId: String,
    val sellerName: String,
    val averageRating: Double = 0.0,
    val reviewCount: Int = 0,
    val createdAt: Date,
    val updatedAt: Date,
    val status: ProductStatus
) {
    val formattedPrice: String
        get() = String.format("$%.2f", price)
        
    val formattedDate: String
        get() = SimpleDateFormat("MMM dd, yyyy", Locale.getDefault()).format(createdAt)
} 