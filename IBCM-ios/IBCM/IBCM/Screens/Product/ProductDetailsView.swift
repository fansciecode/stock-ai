//
//  ProductDetailsView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct ProductDetailsView: View {
    let productId: String
    @StateObject private var viewModel = ProductDetailsViewModel()
    @State private var quantity = 1
    @State private var showingReviews = false
    @State private var showingAddToCart = false
    @State private var selectedImageIndex = 0
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            ZStack {
                if viewModel.isLoading {
                    ProgressView("Loading product details...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if let errorMessage = viewModel.errorMessage {
                    ErrorView(message: errorMessage) {
                        viewModel.loadProductDetails(productId)
                    }
                } else if let product = viewModel.product {
                    ProductDetailsContent(
                        product: product,
                        quantity: $quantity,
                        selectedImageIndex: $selectedImageIndex,
                        onAddToCart: {
                            viewModel.addToCart(productId: productId, quantity: quantity)
                            showingAddToCart = true
                        },
                        onViewReviews: {
                            showingReviews = true
                        }
                    )
                }
            }
            .navigationTitle("Product Details")
            .navigationBarItems(
                leading: Button("Back") { dismiss() },
                trailing: Button(action: { showingReviews = true }) {
                    HStack {
                        Image(systemName: "star.fill")
                        Text("Reviews")
                    }
                }
            )
            .onAppear {
                viewModel.loadProductDetails(productId)
            }
            .sheet(isPresented: $showingReviews) {
                ProductReviewsView(productId: productId)
            }
            .alert("Added to Cart", isPresented: $showingAddToCart) {
                Button("Continue Shopping", role: .cancel) { }
                Button("Go to Cart") {
                    // Navigate to cart
                }
            } message: {
                Text("Product has been added to your cart successfully!")
            }
        }
    }
}

// MARK: - Product Details Content
struct ProductDetailsContent: View {
    let product: Product
    @Binding var quantity: Int
    @Binding var selectedImageIndex: Int
    let onAddToCart: () -> Void
    let onViewReviews: () -> Void

    var body: some View {
        ScrollView {
            VStack(alignment: .leading, spacing: 16) {
                // Product Images
                ProductImageCarousel(
                    images: product.images,
                    selectedIndex: $selectedImageIndex
                )

                VStack(alignment: .leading, spacing: 12) {
                    // Product Title and Price
                    VStack(alignment: .leading, spacing: 8) {
                        Text(product.name)
                            .font(.title2)
                            .fontWeight(.bold)
                            .foregroundColor(.primary)

                        HStack {
                            Text("$\(product.price, specifier: "%.2f")")
                                .font(.title)
                                .fontWeight(.semibold)
                                .foregroundColor(.blue)

                            if let originalPrice = product.originalPrice, originalPrice > product.price {
                                Text("$\(originalPrice, specifier: "%.2f")")
                                    .font(.body)
                                    .foregroundColor(.secondary)
                                    .strikethrough()
                            }

                            Spacer()

                            if product.isInStock {
                                Text("In Stock")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.green.opacity(0.2))
                                    .foregroundColor(.green)
                                    .cornerRadius(4)
                            } else {
                                Text("Out of Stock")
                                    .font(.caption)
                                    .padding(.horizontal, 8)
                                    .padding(.vertical, 4)
                                    .background(Color.red.opacity(0.2))
                                    .foregroundColor(.red)
                                    .cornerRadius(4)
                            }
                        }
                    }

                    // Rating and Reviews
                    if product.rating > 0 {
                        HStack {
                            HStack(spacing: 2) {
                                ForEach(1...5, id: \.self) { star in
                                    Image(systemName: star <= Int(product.rating) ? "star.fill" : "star")
                                        .foregroundColor(.yellow)
                                        .font(.caption)
                                }
                            }

                            Text("\(product.rating, specifier: "%.1f")")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            Text("(\(product.reviewCount) reviews)")
                                .font(.caption)
                                .foregroundColor(.blue)
                                .onTapGesture {
                                    onViewReviews()
                                }
                        }
                    }

                    Divider()

                    // Product Description
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Description")
                            .font(.headline)
                            .fontWeight(.semibold)

                        Text(product.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }

                    // Product Specifications
                    if !product.specifications.isEmpty {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Specifications")
                                .font(.headline)
                                .fontWeight(.semibold)

                            ForEach(product.specifications, id: \.key) { spec in
                                HStack {
                                    Text(spec.key)
                                        .font(.body)
                                        .foregroundColor(.primary)
                                    Spacer()
                                    Text(spec.value)
                                        .font(.body)
                                        .foregroundColor(.secondary)
                                }
                            }
                        }
                    }

                    // Quantity Selector
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Quantity")
                            .font(.headline)
                            .fontWeight(.semibold)

                        HStack {
                            Button(action: {
                                if quantity > 1 {
                                    quantity -= 1
                                }
                            }) {
                                Image(systemName: "minus.circle")
                                    .font(.title2)
                                    .foregroundColor(quantity > 1 ? .blue : .gray)
                            }
                            .disabled(quantity <= 1)

                            Text("\(quantity)")
                                .font(.title2)
                                .fontWeight(.semibold)
                                .frame(minWidth: 50)
                                .multilineTextAlignment(.center)

                            Button(action: {
                                if quantity < product.maxQuantity {
                                    quantity += 1
                                }
                            }) {
                                Image(systemName: "plus.circle")
                                    .font(.title2)
                                    .foregroundColor(quantity < product.maxQuantity ? .blue : .gray)
                            }
                            .disabled(quantity >= product.maxQuantity)

                            Spacer()

                            Text("Max: \(product.maxQuantity)")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }

                    // Shipping Information
                    VStack(alignment: .leading, spacing: 8) {
                        Text("Shipping")
                            .font(.headline)
                            .fontWeight(.semibold)

                        HStack {
                            Image(systemName: "truck")
                                .foregroundColor(.blue)

                            VStack(alignment: .leading, spacing: 2) {
                                Text("Free shipping on orders over $50")
                                    .font(.body)
                                    .foregroundColor(.primary)

                                Text("Estimated delivery: 3-5 business days")
                                    .font(.caption)
                                    .foregroundColor(.secondary)
                            }
                        }
                    }

                    // Add to Cart Button
                    Button(action: onAddToCart) {
                        HStack {
                            Image(systemName: "cart.badge.plus")
                                .font(.title2)

                            Text("Add to Cart")
                                .font(.headline)
                                .fontWeight(.semibold)
                        }
                        .foregroundColor(.white)
                        .frame(maxWidth: .infinity)
                        .padding()
                        .background(product.isInStock ? Color.blue : Color.gray)
                        .cornerRadius(12)
                    }
                    .disabled(!product.isInStock)

                    // Buy Now Button
                    Button(action: {
                        // Handle buy now
                    }) {
                        Text("Buy Now")
                            .font(.headline)
                            .fontWeight(.semibold)
                            .foregroundColor(.blue)
                            .frame(maxWidth: .infinity)
                            .padding()
                            .background(Color.blue.opacity(0.1))
                            .cornerRadius(12)
                    }
                    .disabled(!product.isInStock)
                }
                .padding(.horizontal)
            }
        }
    }
}

// MARK: - Product Image Carousel
struct ProductImageCarousel: View {
    let images: [String]
    @Binding var selectedIndex: Int

    var body: some View {
        VStack(spacing: 8) {
            TabView(selection: $selectedIndex) {
                ForEach(images.indices, id: \.self) { index in
                    AsyncImage(url: URL(string: images[index])) { image in
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fit)
                    } placeholder: {
                        Rectangle()
                            .fill(Color.gray.opacity(0.3))
                            .overlay(
                                Image(systemName: "photo")
                                    .foregroundColor(.gray)
                                    .font(.largeTitle)
                            )
                    }
                    .frame(height: 300)
                    .cornerRadius(12)
                    .tag(index)
                }
            }
            .frame(height: 300)
            .tabViewStyle(PageTabViewStyle())

            // Image indicators
            if images.count > 1 {
                HStack(spacing: 8) {
                    ForEach(images.indices, id: \.self) { index in
                        Circle()
                            .fill(index == selectedIndex ? Color.blue : Color.gray.opacity(0.4))
                            .frame(width: 8, height: 8)
                            .onTapGesture {
                                selectedIndex = index
                            }
                    }
                }
            }
        }
    }
}

// MARK: - Error View
struct ErrorView: View {
    let message: String
    let onRetry: () -> Void

    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "exclamationmark.triangle")
                .font(.system(size: 50))
                .foregroundColor(.red)

            Text("Error")
                .font(.title)
                .fontWeight(.bold)

            Text(message)
                .font(.body)
                .multilineTextAlignment(.center)
                .foregroundColor(.secondary)

            Button("Retry") {
                onRetry()
            }
            .font(.headline)
            .foregroundColor(.white)
            .padding()
            .background(Color.blue)
            .cornerRadius(8)
        }
        .padding()
    }
}

// MARK: - Product Reviews View
struct ProductReviewsView: View {
    let productId: String
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack {
                Text("Product Reviews")
                    .font(.title)
                    .fontWeight(.bold)
                    .padding()

                // Reviews content would go here
                Text("Reviews for product \(productId)")
                    .foregroundColor(.secondary)

                Spacer()
            }
            .navigationBarItems(trailing: Button("Done") { dismiss() })
        }
    }
}

// MARK: - Product Details View Model
class ProductDetailsViewModel: ObservableObject {
    @Published var product: Product?
    @Published var isLoading = false
    @Published var errorMessage: String?

    private let productService = ProductService()

    func loadProductDetails(_ productId: String) {
        isLoading = true
        errorMessage = nil

        productService.getProductDetails(productId: productId) { [weak self] result in
            DispatchQueue.main.async {
                self?.isLoading = false

                switch result {
                case .success(let product):
                    self?.product = product
                case .failure(let error):
                    self?.errorMessage = error.localizedDescription
                }
            }
        }
    }

    func addToCart(productId: String, quantity: Int) {
        productService.addToCart(productId: productId, quantity: quantity) { result in
            DispatchQueue.main.async {
                switch result {
                case .success:
                    // Handle success
                    print("Product added to cart successfully")
                case .failure(let error):
                    print("Failed to add product to cart: \(error)")
                }
            }
        }
    }
}

// MARK: - Product Service
class ProductService {
    func getProductDetails(productId: String, completion: @escaping (Result<Product, Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
            let product = Product(
                id: productId,
                name: "Sample Product",
                description: "This is a detailed description of the product with all the important features and benefits.",
                price: 29.99,
                originalPrice: 39.99,
                images: [
                    "https://picsum.photos/400/300?random=1",
                    "https://picsum.photos/400/300?random=2",
                    "https://picsum.photos/400/300?random=3"
                ],
                rating: 4.5,
                reviewCount: 128,
                isInStock: true,
                maxQuantity: 10,
                specifications: [
                    ProductSpecification(key: "Brand", value: "IBCM"),
                    ProductSpecification(key: "Model", value: "SP-2024"),
                    ProductSpecification(key: "Color", value: "Blue"),
                    ProductSpecification(key: "Weight", value: "1.5 lbs")
                ]
            )
            completion(.success(product))
        }
    }

    func addToCart(productId: String, quantity: Int, completion: @escaping (Result<Void, Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 0.5) {
            completion(.success(()))
        }
    }
}

// MARK: - Product Model
struct Product: Identifiable, Codable {
    let id: String
    let name: String
    let description: String
    let price: Double
    let originalPrice: Double?
    let images: [String]
    let rating: Double
    let reviewCount: Int
    let isInStock: Bool
    let maxQuantity: Int
    let specifications: [ProductSpecification]
}

struct ProductSpecification: Codable {
    let key: String
    let value: String
}

#Preview {
    ProductDetailsView(productId: "sample-product")
}
