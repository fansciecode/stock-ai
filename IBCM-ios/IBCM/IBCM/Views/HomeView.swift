//
//  HomeView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import MapKit
import CoreLocation
import Combine

struct HomeView: View {
    var body: some View {
        NavigationView {
            ScrollView {
                VStack(alignment: .leading, spacing: 20) {
                    // Featured section
                    Text("Featured")
                        .font(.title)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                    
                    ScrollView(.horizontal, showsIndicators: false) {
                        HStack(spacing: 15) {
                            ForEach(0..<5) { _ in
                                FeaturedItemView()
                            }
                        }
                        .padding(.horizontal)
                    }
                    
                    // Recent activity section
                    Text("Recent Activity")
                        .font(.title)
                        .fontWeight(.bold)
                        .padding(.horizontal)
                        .padding(.top)
                    
                    ForEach(0..<10) { _ in
                        ActivityItemView()
                    }
                }
                .padding(.vertical)
            }
            .navigationTitle("Home")
        }
    }
}

struct FeaturedItemView: View {
    var body: some View {
        VStack(alignment: .leading) {
            Rectangle()
                .fill(Color.gray.opacity(0.3))
                .frame(width: 250, height: 150)
                .cornerRadius(10)
            
            Text("Featured Item")
                .fontWeight(.semibold)
            
            Text("Description goes here")
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 250)
    }
}

struct ActivityItemView: View {
    var body: some View {
        VStack(alignment: .leading) {
            HStack {
                Circle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(width: 50, height: 50)
                
                VStack(alignment: .leading) {
                    Text("Activity Title")
                        .fontWeight(.semibold)
                    
                    Text("Activity description")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }
                
                Spacer()
                
                Text("2h ago")
                    .font(.caption2)
                    .foregroundColor(.secondary)
            }
            
            Divider()
        }
        .padding(.horizontal)
    }
}

struct HomeView_Previews: PreviewProvider {
    static var previews: some View {
        HomeView()
    }
}
