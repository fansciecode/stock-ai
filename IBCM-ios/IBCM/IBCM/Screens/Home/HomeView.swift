//
//  HomeView.swift
//  IBCM
//
//  Created by kiran Naik on 20/03/25.
//

import SwiftUI
import MapKit
import CoreLocation

struct HomeView: View {
    @EnvironmentObject private var authViewModel: AuthViewModel
    @EnvironmentObject private var navigation: AppNavigation
    @StateObject private var viewModel = HomeViewModel()
    
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Welcome section
                    welcomeSection
                    
                    // Featured events section
                    featuredEventsSection
                    
                    // Categories section
                    categoriesSection
                    
                    // Upcoming events section
                    upcomingEventsSection
                }
                .padding()
            }
            .navigationTitle("Home")
            .navigationBarItems(
                trailing: Button(action: {
                    authViewModel.signOut()
                }) {
                    Image(systemName: "rectangle.portrait.and.arrow.right")
                        .foregroundColor(.blue)
                }
            )
        }
        .onAppear {
            viewModel.checkLocationPermission()
            viewModel.loadCategories()
            viewModel.loadEvents()
        }
    }
    
    // MARK: - UI Components
    
    private var welcomeSection: some View {
        VStack(alignment: .leading) {
            Text("Welcome, \(authViewModel.currentUser?.name ?? "User")!")
                .font(.title)
                .fontWeight(.bold)
            
            Text("Discover events and connect with the community")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
    }
    
    private var featuredEventsSection: some View {
        VStack(alignment: .leading) {
            Text("Featured Events")
                .font(.headline)
                .padding(.top)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 15) {
                    ForEach(0..<3) { index in
                        featuredEventCard(index: index)
                    }
                }
            }
        }
    }
    
    private func featuredEventCard(index: Int) -> some View {
        VStack(alignment: .leading) {
            RoundedRectangle(cornerRadius: 10)
                .fill(Color.blue.opacity(0.2))
                .frame(width: 280, height: 150)
                .overlay(
                    Text("Event \(index + 1)")
                        .foregroundColor(.blue)
                )
            
            Text("Featured Event \(index + 1)")
                .font(.headline)
            
            Text("March \(20 + index), 2025")
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .frame(width: 280)
        .onTapGesture {
            navigation.navigate(to: .eventDetails)
        }
    }
    
    private var categoriesSection: some View {
        VStack(alignment: .leading) {
            Text("Categories")
                .font(.headline)
                .padding(.top)
            
            ScrollView(.horizontal, showsIndicators: false) {
                HStack(spacing: 15) {
                    ForEach(viewModel.categories) { category in
                        categoryCard(category: category)
                    }
                }
            }
        }
    }
    
    private func categoryCard(category: Category) -> some View {
        VStack {
            Circle()
                .fill(Color.blue.opacity(0.2))
                .frame(width: 70, height: 70)
                .overlay(
                    Text(String(category.name.prefix(1)))
                        .font(.title)
                        .foregroundColor(.blue)
                )
            
            Text(category.name)
                .font(.caption)
                .foregroundColor(.primary)
        }
        .onTapGesture {
            viewModel.selectCategory(category: category)
        }
    }
    
    private var upcomingEventsSection: some View {
        VStack(alignment: .leading) {
            Text("Upcoming Events")
                .font(.headline)
                .padding(.top)
            
            ForEach(viewModel.filteredEvents) { event in
                upcomingEventRow(event: event)
            }
            
            if viewModel.filteredEvents.isEmpty {
                Text("No upcoming events")
                    .foregroundColor(.secondary)
                    .padding()
                    .frame(maxWidth: .infinity)
            }
        }
    }
    
    private func upcomingEventRow(event: Event) -> some View {
        HStack {
            RoundedRectangle(cornerRadius: 8)
                .fill(Color.blue.opacity(0.2))
                .frame(width: 60, height: 60)
                .overlay(
                    Text(event.category?.name.prefix(1) ?? "E")
                        .foregroundColor(.blue)
                )
            
            VStack(alignment: .leading) {
                Text(event.title)
                    .font(.headline)
                
                Text("\(formatDate(date: event.startDate)) • \(event.location?.address ?? "No location")")
                    .font(.caption)
                    .foregroundColor(.secondary)
            }
            
            Spacer()
            
            Image(systemName: "chevron.right")
                .foregroundColor(.gray)
        }
        .padding(.vertical, 5)
        .onTapGesture {
            navigation.navigate(to: .eventDetails)
        }
    }
    
    // MARK: - Helper Functions
    
    private func formatDate(date: Date) -> String {
        let formatter = DateFormatter()
        formatter.dateStyle = .medium
        formatter.timeStyle = .short
        return formatter.string(from: date)
    }
} 