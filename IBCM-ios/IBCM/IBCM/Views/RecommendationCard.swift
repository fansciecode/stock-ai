import SwiftUI

struct RecommendationCard: View {
    let item: RecommendationItem
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            // Image
            if let imageUrl = item.imageUrl, let url = URL(string: imageUrl) {
                AsyncImage(url: url) { phase in
                    switch phase {
                    case .empty:
                        Rectangle()
                            .foregroundColor(.gray.opacity(0.3))
                            .aspectRatio(16/9, contentMode: .fill)
                    case .success(let image):
                        image
                            .resizable()
                            .aspectRatio(contentMode: .fill)
                    case .failure:
                        Rectangle()
                            .foregroundColor(.gray.opacity(0.3))
                            .aspectRatio(16/9, contentMode: .fill)
                            .overlay(
                                Image(systemName: "photo")
                                    .foregroundColor(.gray)
                            )
                    @unknown default:
                        EmptyView()
                    }
                }
                .frame(height: 120)
                .clipped()
                .cornerRadius(8)
            } else {
                Rectangle()
                    .foregroundColor(.gray.opacity(0.3))
                    .frame(height: 120)
                    .cornerRadius(8)
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }
            
            // Content
            VStack(alignment: .leading, spacing: 4) {
                Text(item.title)
                    .font(.headline)
                    .lineLimit(1)
                
                Text(item.description)
                    .font(.subheadline)
                    .foregroundColor(.secondary)
                    .lineLimit(2)
                
                // Score and Type
                HStack {
                    Label(
                        String(format: "%.1f", item.score),
                        systemImage: "star.fill"
                    )
                    .font(.caption)
                    .foregroundColor(.orange)
                    
                    Spacer()
                    
                    Text(item.type.capitalized)
                        .font(.caption)
                        .padding(.horizontal, 8)
                        .padding(.vertical, 2)
                        .background(Color.blue.opacity(0.2))
                        .foregroundColor(.blue)
                        .cornerRadius(4)
                }
                
                // Reasons (if available)
                if let reasons = item.reasons, !reasons.isEmpty {
                    Text(reasons.first ?? "")
                        .font(.caption)
                        .foregroundColor(.secondary)
                        .lineLimit(1)
                }
            }
            .padding(.horizontal, 4)
        }
        .background(Color(UIColor.systemBackground))
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 5, x: 0, y: 2)
    }
} 