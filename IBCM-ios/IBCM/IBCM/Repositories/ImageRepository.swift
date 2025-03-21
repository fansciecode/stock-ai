import Foundation
import UIKit

protocol ImageRepository {
    func uploadImage(imageUri: String) async throws -> String
    func uploadImages(imageUris: [String]) async throws -> [String]
    func getImage(imageUrl: String) async throws -> Data
    func deleteImage(imageUrl: String) async throws
    func compressImage(imageUri: String) async throws -> String
}

class ImageRepositoryImpl: ImageRepository {
    private let apiService: APIService
    private let cache: NSCache<NSString, CachedImage>
    
    init(apiService: APIService = .shared) {
        self.apiService = apiService
        self.cache = NSCache()
    }
    
    func uploadImage(imageUri: String) async throws -> String {
        let imageData = try await loadImageData(from: imageUri)
        
        let response: ImageUploadResponse = try await apiService.request(
            endpoint: "/images/upload",
            method: "POST",
            multipartData: [
                "image": MultipartData(
                    data: imageData,
                    mimeType: "image/jpeg",
                    filename: "image.jpg"
                )
            ]
        )
        return response.url
    }
    
    func uploadImages(imageUris: [String]) async throws -> [String] {
        let uploadTasks = imageUris.map { imageUri in
            Task {
                try await uploadImage(imageUri: imageUri)
            }
        }
        
        return try await withThrowingTaskGroup(of: String.self) { group in
            var urls: [String] = []
            for task in uploadTasks {
                group.addTask { try await task.value }
            }
            for try await url in group {
                urls.append(url)
            }
            return urls
        }
    }
    
    func getImage(imageUrl: String) async throws -> Data {
        if let cached = cache.object(forKey: imageUrl as NSString) {
            if Date().timeIntervalSince(cached.timestamp) < 3600 { // 1 hour cache
                return cached.data
            }
        }
        
        let data = try await apiService.downloadData(from: imageUrl)
        cache.setObject(CachedImage(data: data, timestamp: Date()), forKey: imageUrl as NSString)
        return data
    }
    
    func deleteImage(imageUrl: String) async throws {
        let response: BasicResponse = try await apiService.request(
            endpoint: "/images",
            method: "DELETE",
            body: try JSONEncoder().encode(["url": imageUrl])
        )
        
        if response.success {
            cache.removeObject(forKey: imageUrl as NSString)
        } else {
            throw ImageError.deleteFailed
        }
    }
    
    func compressImage(imageUri: String) async throws -> String {
        let imageData = try await loadImageData(from: imageUri)
        guard let image = UIImage(data: imageData) else {
            throw ImageError.invalidImage
        }
        
        // Compress image while maintaining reasonable quality
        let maxSize: CGFloat = 1024
        let scale = min(maxSize / image.size.width, maxSize / image.size.height, 1.0)
        let newSize = CGSize(width: image.size.width * scale, height: image.size.height * scale)
        
        let format = UIGraphicsImageRendererFormat()
        format.scale = 1
        
        let renderer = UIGraphicsImageRenderer(size: newSize, format: format)
        let compressedData = renderer.jpegData(withCompressionQuality: 0.7) { context in
            image.draw(in: CGRect(origin: .zero, size: newSize))
        }
        
        // Upload compressed image
        let response: ImageUploadResponse = try await apiService.request(
            endpoint: "/images/upload",
            method: "POST",
            multipartData: [
                "image": MultipartData(
                    data: compressedData,
                    mimeType: "image/jpeg",
                    filename: "compressed_image.jpg"
                )
            ]
        )
        return response.url
    }
    
    private func loadImageData(from uri: String) async throws -> Data {
        if uri.hasPrefix("http") {
            return try await apiService.downloadData(from: uri)
        } else {
            guard let url = URL(string: uri) else {
                throw ImageError.invalidUri
            }
            return try Data(contentsOf: url)
        }
    }
}

// MARK: - Cache Types
private class CachedImage {
    let data: Data
    let timestamp: Date
    
    init(data: Data, timestamp: Date) {
        self.data = data
        self.timestamp = timestamp
    }
}

// MARK: - Response Types
struct ImageUploadResponse: Codable {
    let success: Bool
    let url: String
    let message: String?
}

// MARK: - Errors
enum ImageError: LocalizedError {
    case invalidImage
    case invalidUri
    case uploadFailed
    case deleteFailed
    case downloadFailed
    case compressionFailed
    
    var errorDescription: String? {
        switch self {
        case .invalidImage:
            return "Invalid image data"
        case .invalidUri:
            return "Invalid image URI"
        case .uploadFailed:
            return "Failed to upload image"
        case .deleteFailed:
            return "Failed to delete image"
        case .downloadFailed:
            return "Failed to download image"
        case .compressionFailed:
            return "Failed to compress image"
        }
    }
} 