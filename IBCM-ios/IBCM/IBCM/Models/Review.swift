import Foundation

struct Review: Codable, Identifiable {
    let id: String
    let eventId: String
    let userId: String
    let userName: String
    let userAvatar: String?
    let rating: Int
    let title: String?
    let comment: String
    let createdAt: String
    let updatedAt: String?
    let isVerified: Bool
    let helpfulCount: Int
    let reportCount: Int
    
    // MARK: - Mock Data
    
    static func mockReview(id: String = UUID().uuidString) -> Review {
        return Review(
            id: id,
            eventId: UUID().uuidString,
            userId: UUID().uuidString,
            userName: "Jane Smith",
            userAvatar: "https://randomuser.me/api/portraits/women/1.jpg",
            rating: Int.random(in: 3...5),
            title: "Great experience!",
            comment: "This was an amazing event. The organizer did a fantastic job with everything from the venue to the activities. Would definitely attend again!",
            createdAt: "2023-05-15T14:30:00.000Z",
            updatedAt: nil,
            isVerified: true,
            helpfulCount: Int.random(in: 0...50),
            reportCount: 0
        )
    }
    
    static func mockReviews(count: Int) -> [Review] {
        var reviews: [Review] = []
        
        let comments = [
            "Amazing event! Would definitely recommend to others.",
            "The organizer did a fantastic job. Everything was well planned.",
            "Great experience overall. Just a few minor issues with the timing.",
            "Loved the venue and the activities. Will attend again!",
            "Very professional organization. Impressed with the attention to detail."
        ]
        
        let names = [
            "Jane Smith",
            "Michael Johnson",
            "Emily Davis",
            "Robert Wilson",
            "Sarah Brown"
        ]
        
        for i in 0..<count {
            let nameIndex = i % names.count
            let commentIndex = i % comments.count
            
            reviews.append(Review(
                id: UUID().uuidString,
                eventId: UUID().uuidString,
                userId: UUID().uuidString,
                userName: names[nameIndex],
                userAvatar: "https://randomuser.me/api/portraits/\(i % 2 == 0 ? "women" : "men")/\(i % 10 + 1).jpg",
                rating: Int.random(in: 3...5),
                title: nil,
                comment: comments[commentIndex],
                createdAt: "2023-\(String(format: "%02d", (i % 12) + 1))-\(String(format: "%02d", (i % 28) + 1))T14:30:00.000Z",
                updatedAt: nil,
                isVerified: Bool.random(),
                helpfulCount: Int.random(in: 0...50),
                reportCount: Int.random(in: 0...3)
            ))
        }
        
        return reviews
    }
}

// MARK: - API Response Models

struct ReviewResponse: Codable {
    let success: Bool
    let data: Review
    let message: String?
}

struct ReviewsResponse: Codable {
    let success: Bool
    let data: [Review]
    let pagination: PaginationInfo?
    let message: String?
}

// MARK: - Request Models

struct CreateReviewRequest: Codable {
    let eventId: String
    let rating: Int
    let title: String?
    let comment: String
    let images: [String]?
}

struct UpdateReviewRequest: Codable {
    let rating: Int?
    let title: String?
    let comment: String?
    let images: [String]?
}

struct ReportReviewRequest: Codable {
    let reason: String
    let details: String?
} 