import SwiftUI

struct AISearchResultRow: View {
    let result: SearchResult
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                // Icon based on type
                Image(systemName: iconForType(result.type))
                    .foregroundColor(.blue)
                    .frame(width: 30, height: 30)
                    .background(Color.blue.opacity(0.1))
                    .clipShape(Circle())
                
                VStack(alignment: .leading, spacing: 4) {
                    Text(result.title)
                        .font(.headline)
                        .lineLimit(1)
                    
                    Text(result.description)
                        .font(.subheadline)
                        .foregroundColor(.secondary)
                        .lineLimit(2)
                }
                
                Spacer()
                
                // Relevance score
                VStack {
                    Text(String(format: "%.0f%%", result.score * 100))
                        .font(.caption)
                        .foregroundColor(.green)
                    
                    Text("match")
                        .font(.caption2)
                        .foregroundColor(.secondary)
                }
            }
            
            // Metadata (if available)
            if let metadata = result.metadata, !metadata.isEmpty {
                HStack {
                    ForEach(Array(metadata.prefix(3)), id: \.key) { key, value in
                        HStack(spacing: 4) {
                            Text(key.capitalized + ":")
                                .font(.caption2)
                                .foregroundColor(.secondary)
                            
                            Text(value)
                                .font(.caption)
                                .foregroundColor(.primary)
                        }
                        .padding(.horizontal, 6)
                        .padding(.vertical, 2)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(4)
                        
                        if key != Array(metadata.prefix(3)).last?.key {
                            Spacer()
                        }
                    }
                }
            }
        }
        .padding(.vertical, 4)
        .contentShape(Rectangle())
    }
    
    private func iconForType(_ type: String) -> String {
        switch type.lowercased() {
        case "event":
            return "calendar"
        case "user", "person":
            return "person.fill"
        case "product":
            return "tag.fill"
        case "location", "place":
            return "mappin.and.ellipse"
        case "article", "post":
            return "doc.text"
        case "service":
            return "wrench.and.screwdriver"
        default:
            return "magnifyingglass"
        }
    }
} 