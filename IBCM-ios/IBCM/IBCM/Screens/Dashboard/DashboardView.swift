import SwiftUI

struct DashboardView: View {
    @StateObject private var viewModel = DashboardViewModel()
    @EnvironmentObject private var appState: AppState
    
    var body: some View {
        ScrollView {
            VStack(spacing: 20) {
                // Header with user info and notifications
                HeaderView(user: appState.currentUser)
                
                // Quick Actions
                QuickActionsView(onActionSelected: viewModel.handleQuickAction)
                
                // Upcoming Events Section
                if !viewModel.upcomingEvents.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Upcoming Events")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)
                        
                        ScrollView(.horizontal, showsIndicators: false) {
                            LazyHStack(spacing: 15) {
                                ForEach(viewModel.upcomingEvents) { event in
                                    EventCardView(event: event)
                                        .onTapGesture {
                                            viewModel.selectEvent(event)
                                        }
                                }
                            }
                            .padding(.horizontal)
                        }
                    }
                }
                
                // Recent Orders Section
                if !viewModel.recentOrders.isEmpty {
                    VStack(alignment: .leading) {
                        Text("Recent Orders")
                            .font(.title2)
                            .fontWeight(.bold)
                            .padding(.horizontal)
                        
                        ForEach(viewModel.recentOrders) { order in
                            OrderCardView(order: order)
                                .onTapGesture {
                                    viewModel.selectOrder(order)
                                }
                        }
                    }
                    .padding(.horizontal)
                }
                
                // Business Stats (if business user)
                if appState.currentUser?.role == .business {
                    BusinessStatsView(stats: viewModel.businessStats)
                }
            }
        }
        .refreshable {
            await viewModel.fetchDashboardData()
        }
        .task {
            await viewModel.fetchDashboardData()
        }
        .sheet(item: $viewModel.selectedEvent) { event in
            EventDetailView(event: event)
        }
        .sheet(item: $viewModel.selectedOrder) { order in
            OrderDetailView(order: order)
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
    }
}

// MARK: - Header View
struct HeaderView: View {
    let user: User?
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text("Welcome back,")
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                Text(user?.fullName ?? "Guest")
                    .font(.title2)
                    .fontWeight(.bold)
            }
            
            Spacer()
            
            NavigationLink(destination: NotificationsView()) {
                Image(systemName: "bell.fill")
                    .font(.title2)
                    .foregroundColor(.primary)
            }
        }
        .padding()
    }
}

// MARK: - Quick Actions View
struct QuickActionsView: View {
    let onActionSelected: (QuickAction) -> Void
    
    var body: some View {
        ScrollView(.horizontal, showsIndicators: false) {
            LazyHStack(spacing: 15) {
                ForEach(QuickAction.allCases) { action in
                    Button(action: { onActionSelected(action) }) {
                        VStack {
                            Image(systemName: action.iconName)
                                .font(.title2)
                                .foregroundColor(.white)
                                .frame(width: 50, height: 50)
                                .background(action.color)
                                .clipShape(Circle())
                            
                            Text(action.title)
                                .font(.caption)
                                .foregroundColor(.primary)
                        }
                    }
                }
            }
            .padding(.horizontal)
        }
    }
}

// MARK: - Event Card View
struct EventCardView: View {
    let event: Event
    
    var body: some View {
        VStack(alignment: .leading) {
            AsyncImage(url: URL(string: event.imageURL)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Color.gray.opacity(0.3)
            }
            .frame(width: 200, height: 120)
            .clipShape(RoundedRectangle(cornerRadius: 10))
            
            Text(event.title)
                .font(.headline)
                .lineLimit(1)
            
            Text(event.formattedDate)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 200)
    }
}

// MARK: - Order Card View
struct OrderCardView: View {
    let order: Order
    
    var body: some View {
        HStack {
            VStack(alignment: .leading) {
                Text(order.id)
                    .font(.headline)
                Text(order.status.rawValue)
                    .font(.subheadline)
                    .foregroundColor(order.status.color)
            }
            
            Spacer()
            
            Text(order.formattedTotal)
                .font(.title3)
                .fontWeight(.semibold)
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(10)
    }
}

// MARK: - Business Stats View
struct BusinessStatsView: View {
    let stats: BusinessStats
    
    var body: some View {
        VStack(spacing: 15) {
            Text("Business Statistics")
                .font(.title2)
                .fontWeight(.bold)
            
            HStack {
                StatCard(title: "Revenue", value: stats.formattedRevenue)
                StatCard(title: "Orders", value: "\(stats.totalOrders)")
            }
            
            HStack {
                StatCard(title: "Events", value: "\(stats.totalEvents)")
                StatCard(title: "Customers", value: "\(stats.totalCustomers)")
            }
        }
        .padding()
        .background(Color.secondary.opacity(0.1))
        .cornerRadius(15)
    }
}

struct StatCard: View {
    let title: String
    let value: String
    
    var body: some View {
        VStack {
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
        }
        .frame(maxWidth: .infinity)
        .padding()
        .background(Color.white)
        .cornerRadius(10)
    }
}

struct DashboardView_Previews: PreviewProvider {
    static var previews: some View {
        DashboardView()
            .environmentObject(AppState())
    }
} 