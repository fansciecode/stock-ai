import SwiftUI

struct OrderView: View {
    @StateObject private var viewModel = OrderViewModel()
    
    var body: some View {
        NavigationView {
            List {
                ForEach(viewModel.orders) { order in
                    NavigationLink(destination: OrderDetailView(viewModel: viewModel, orderId: order.id)) {
                        OrderRow(order: order)
                    }
                }
                
                if viewModel.hasMorePages {
                    ProgressView()
                        .frame(maxWidth: .infinity)
                        .onAppear {
                            Task {
                                await viewModel.loadOrders()
                            }
                        }
                }
            }
            .navigationTitle("Orders")
            .refreshable {
                await viewModel.loadOrders(refresh: true)
            }
            .overlay {
                if viewModel.orders.isEmpty && !viewModel.isLoading {
                    ContentUnavailableView(
                        "No Orders",
                        systemImage: "shippingbox",
                        description: Text("You haven't placed any orders yet")
                    )
                }
            }
            .alert("Error", isPresented: $viewModel.showError) {
                Button("OK", role: .cancel) {}
            } message: {
                Text(viewModel.errorMessage ?? "An error occurred")
            }
        }
    }
}

struct OrderRow: View {
    let order: Order
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text("Order #\(order.id)")
                    .font(.headline)
                Spacer()
                Text(order.formattedTotal)
                    .fontWeight(.semibold)
            }
            
            HStack {
                Image(systemName: order.status.systemImage)
                    .foregroundColor(.accentColor)
                Text(order.status.displayName)
                    .foregroundColor(.secondary)
                Spacer()
                Text(order.createdAt, style: .date)
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            if !order.items.isEmpty {
                Text("\(order.items.count) item\(order.items.count == 1 ? "" : "s")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
        }
        .padding(.vertical, 4)
    }
}

struct OrderDetailView: View {
    @ObservedObject var viewModel: OrderViewModel
    let orderId: String
    @State private var showingCancelAlert = false
    @State private var showingRefundSheet = false
    @State private var refundReason = ""
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Order Status
                VStack(spacing: 8) {
                    Image(systemName: viewModel.selectedOrder?.status.systemImage ?? "")
                        .font(.largeTitle)
                        .foregroundColor(.accentColor)
                    Text(viewModel.selectedOrder?.status.displayName ?? "")
                        .font(.headline)
                }
                .frame(maxWidth: .infinity)
                .padding()
                .background(Color(.systemBackground))
                .cornerRadius(12)
                .shadow(radius: 2)
                
                // Order Items
                if let order = viewModel.selectedOrder {
                    VStack(alignment: .leading, spacing: 16) {
                        Text("Items")
                            .font(.headline)
                        
                        ForEach(order.items) { item in
                            HStack {
                                AsyncImage(url: URL(string: item.imageUrl ?? "")) { image in
                                    image
                                        .resizable()
                                        .aspectRatio(contentMode: .fill)
                                } placeholder: {
                                    Color.gray.opacity(0.2)
                                }
                                .frame(width: 60, height: 60)
                                .cornerRadius(8)
                                
                                VStack(alignment: .leading, spacing: 4) {
                                    Text(item.name)
                                        .font(.subheadline)
                                    Text("Qty: \(item.quantity)")
                                        .font(.caption)
                                        .foregroundColor(.secondary)
                                }
                                
                                Spacer()
                                
                                Text("$\(item.subtotal, specifier: "%.2f")")
                                    .fontWeight(.semibold)
                            }
                            .padding(.vertical, 4)
                        }
                        
                        Divider()
                        
                        HStack {
                            Text("Total")
                                .font(.headline)
                            Spacer()
                            Text(order.formattedTotal)
                                .font(.headline)
                        }
                    }
                    .padding()
                    .background(Color(.systemBackground))
                    .cornerRadius(12)
                    .shadow(radius: 2)
                    
                    // Shipping Address
                    if let address = order.shippingAddress {
                        VStack(alignment: .leading, spacing: 8) {
                            Text("Shipping Address")
                                .font(.headline)
                            Text(address.formattedAddress)
                                .font(.subheadline)
                        }
                        .frame(maxWidth: .infinity, alignment: .leading)
                        .padding()
                        .background(Color(.systemBackground))
                        .cornerRadius(12)
                        .shadow(radius: 2)
                    }
                    
                    // Order Actions
                    if order.status == .pending || order.status == .confirmed {
                        Button(action: { showingCancelAlert = true }) {
                            Text("Cancel Order")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.red)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    } else if order.status == .delivered {
                        Button(action: { showingRefundSheet = true }) {
                            Text("Request Refund")
                                .frame(maxWidth: .infinity)
                                .padding()
                                .background(Color.blue)
                                .foregroundColor(.white)
                                .cornerRadius(12)
                        }
                    }
                }
            }
            .padding()
        }
        .navigationTitle("Order Details")
        .navigationBarTitleDisplayMode(.inline)
        .alert("Cancel Order", isPresented: $showingCancelAlert) {
            Button("Cancel", role: .cancel) {}
            Button("Yes, Cancel Order", role: .destructive) {
                Task {
                    await viewModel.cancelOrder(orderId: orderId)
                }
            }
        } message: {
            Text("Are you sure you want to cancel this order?")
        }
        .sheet(isPresented: $showingRefundSheet) {
            NavigationView {
                Form {
                    Section(header: Text("Refund Reason")) {
                        TextEditor(text: $refundReason)
                            .frame(height: 100)
                    }
                    
                    Section {
                        Button("Submit Refund Request") {
                            Task {
                                await viewModel.requestRefund(orderId: orderId, reason: refundReason)
                                showingRefundSheet = false
                            }
                        }
                        .disabled(refundReason.isEmpty)
                        
                        Button("Cancel", role: .cancel) {
                            showingRefundSheet = false
                        }
                    }
                }
                .navigationTitle("Request Refund")
                .navigationBarTitleDisplayMode(.inline)
            }
        }
        .task {
            await viewModel.loadOrderDetails(orderId: orderId)
        }
    }
}

#Preview {
    OrderView()
} 