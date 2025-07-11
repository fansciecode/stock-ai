//
//  EventReviewView.swift
//  IBCM
//
//  Created by AI Assistant on 25/01/2025.
//

import SwiftUI
import Combine

struct EventReviewView: View {
    let eventId: String
    @StateObject private var viewModel = EventReviewViewModel()
    @State private var showingWriteReview = false
    @State private var selectedFilter: ReviewFilter = .all
    @Environment(\.dismiss) private var dismiss

    enum ReviewFilter: String, CaseIterable {
        case all = "All"
        case fiveStar = "5 Star"
        case fourStar = "4 Star"
        case threeStar = "3 Star"
        case twoStar = "2 Star"
        case oneStar = "1 Star"
    }

    var body: some View {
        NavigationView {
            VStack(spacing: 0) {
                // Header Section
                if let event = viewModel.event {
                    EventReviewHeader(event: event)
                        .padding(.horizontal)
                        .padding(.bottom, 16)
                }

                // Rating Overview
                RatingOverview(
                    averageRating: viewModel.averageRating,
                    totalReviews: viewModel.totalReviews,
                    ratingDistribution: viewModel.ratingDistribution
                )
                .padding(.horizontal)
                .padding(.bottom, 16)

                // Filter Section
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 12) {
                        ForEach(ReviewFilter.allCases, id: \.self) { filter in
                            FilterChip(
                                title: filter.rawValue,
                                isSelected: selectedFilter == filter,
                                count: viewModel.getReviewCount(for: filter)
                            ) {
                                selectedFilter = filter
                                viewModel.filterReviews(by: filter)
                            }
                        }
                    }
                    .padding(.horizontal)
                }
                .padding(.bottom, 16)

                // Reviews List
                if viewModel.isLoading {
                    ProgressView("Loading reviews...")
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else if viewModel.filteredReviews.isEmpty {
                    EmptyReviewsView()
                        .frame(maxWidth: .infinity, maxHeight: .infinity)
                } else {
                    ScrollView {
                        LazyVStack(spacing: 16) {
                            ForEach(viewModel.filteredReviews) { review in
                                ReviewCard(review: review) { reviewId in
                                    viewModel.markHelpful(reviewId)
                                }
                            }
                        }
                        .padding(.horizontal)
                    }
                }
            }
            .navigationTitle("Reviews")
            .navigationBarTitleDisplayMode(.inline)
            .navigationBarItems(
                leading: Button("Back") { dismiss() },
                trailing: Button("Write Review") {
                    showingWriteReview = true
                }
            )
            .onAppear {
                viewModel.loadEventReviews(eventId)
            }
            .sheet(isPresented: $showingWriteReview) {
                WriteReviewView(eventId: eventId) {
                    viewModel.loadEventReviews(eventId)
                }
            }
        }
    }
}

// MARK: - Event Review Header
struct EventReviewHeader: View {
    let event: Event

    var body: some View {
        HStack(spacing: 12) {
            AsyncImage(url: URL(string: event.imageUrl)) { image in
                image
                    .resizable()
                    .aspectRatio(contentMode: .fill)
            } placeholder: {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .overlay(
                        Image(systemName: "photo")
                            .foregroundColor(.gray)
                    )
            }
            .frame(width: 80, height: 80)
            .cornerRadius(12)

            VStack(alignment: .leading, spacing: 4) {
                Text(event.title)
                    .font(.headline)
                    .fontWeight(.semibold)
                    .lineLimit(2)

                Text(event.formattedDate)
                    .font(.caption)
                    .foregroundColor(.secondary)

                Text(event.location)
                    .font(.caption)
                    .foregroundColor(.secondary)
                    .lineLimit(1)
            }

            Spacer()
        }
    }
}

// MARK: - Rating Overview
struct RatingOverview: View {
    let averageRating: Double
    let totalReviews: Int
    let ratingDistribution: [Int]

    var body: some View {
        VStack(spacing: 16) {
            HStack {
                VStack(alignment: .leading, spacing: 4) {
                    Text("\(averageRating, specifier: "%.1f")")
                        .font(.largeTitle)
                        .fontWeight(.bold)

                    StarRating(rating: averageRating, size: 20)

                    Text("\(totalReviews) reviews")
                        .font(.caption)
                        .foregroundColor(.secondary)
                }

                Spacer()

                VStack(alignment: .trailing, spacing: 4) {
                    ForEach((1...5).reversed(), id: \.self) { star in
                        HStack(spacing: 8) {
                            Text("\(star)")
                                .font(.caption)
                                .foregroundColor(.secondary)

                            RatingBar(
                                count: ratingDistribution[star - 1],
                                total: totalReviews
                            )

                            Text("\(ratingDistribution[star - 1])")
                                .font(.caption)
                                .foregroundColor(.secondary)
                                .frame(minWidth: 20, alignment: .leading)
                        }
                    }
                }
            }
        }
        .padding()
        .background(Color.gray.opacity(0.1))
        .cornerRadius(12)
    }
}

// MARK: - Rating Bar
struct RatingBar: View {
    let count: Int
    let total: Int

    var body: some View {
        GeometryReader { geometry in
            ZStack(alignment: .leading) {
                Rectangle()
                    .fill(Color.gray.opacity(0.3))
                    .frame(height: 4)

                Rectangle()
                    .fill(Color.yellow)
                    .frame(width: geometry.size.width * CGFloat(count) / CGFloat(max(total, 1)), height: 4)
            }
        }
        .frame(height: 4)
        .frame(width: 100)
    }
}

// MARK: - Filter Chip
struct FilterChip: View {
    let title: String
    let isSelected: Bool
    let count: Int
    let action: () -> Void

    var body: some View {
        Button(action: action) {
            HStack(spacing: 4) {
                Text(title)
                    .font(.caption)
                    .fontWeight(.medium)

                if count > 0 {
                    Text("(\(count))")
                        .font(.caption)
                }
            }
            .foregroundColor(isSelected ? .white : .primary)
            .padding(.horizontal, 12)
            .padding(.vertical, 6)
            .background(isSelected ? Color.blue : Color.gray.opacity(0.2))
            .cornerRadius(16)
        }
        .buttonStyle(PlainButtonStyle())
    }
}

// MARK: - Review Card
struct ReviewCard: View {
    let review: Review
    let onMarkHelpful: (String) -> Void

    var body: some View {
        VStack(alignment: .leading, spacing: 12) {
            // User info and rating
            HStack {
                AsyncImage(url: URL(string: review.userProfileImage ?? "")) { image in
                    image
                        .resizable()
                        .aspectRatio(contentMode: .fill)
                } placeholder: {
                    Circle()
                        .fill(Color.gray.opacity(0.3))
                        .overlay(
                            Image(systemName: "person.fill")
                                .foregroundColor(.gray)
                        )
                }
                .frame(width: 40, height: 40)
                .clipShape(Circle())

                VStack(alignment: .leading, spacing: 2) {
                    Text(review.userName)
                        .font(.subheadline)
                        .fontWeight(.medium)

                    HStack {
                        StarRating(rating: Double(review.rating), size: 14)

                        Text(review.date)
                            .font(.caption)
                            .foregroundColor(.secondary)
                    }
                }

                Spacer()

                if review.isVerified {
                    HStack {
                        Image(systemName: "checkmark.seal.fill")
                            .foregroundColor(.blue)
                            .font(.caption)

                        Text("Verified")
                            .font(.caption)
                            .foregroundColor(.blue)
                    }
                }
            }

            // Review content
            Text(review.content)
                .font(.body)
                .foregroundColor(.primary)

            // Review images if any
            if !review.images.isEmpty {
                ScrollView(.horizontal, showsIndicators: false) {
                    HStack(spacing: 8) {
                        ForEach(review.images, id: \.self) { imageUrl in
                            AsyncImage(url: URL(string: imageUrl)) { image in
                                image
                                    .resizable()
                                    .aspectRatio(contentMode: .fill)
                            } placeholder: {
                                Rectangle()
                                    .fill(Color.gray.opacity(0.3))
                            }
                            .frame(width: 80, height: 80)
                            .cornerRadius(8)
                        }
                    }
                }
            }

            // Helpful section
            HStack {
                Button(action: {
                    onMarkHelpful(review.id)
                }) {
                    HStack(spacing: 4) {
                        Image(systemName: review.isMarkedHelpful ? "hand.thumbsup.fill" : "hand.thumbsup")
                            .foregroundColor(review.isMarkedHelpful ? .blue : .secondary)

                        Text("Helpful")
                            .font(.caption)
                            .foregroundColor(review.isMarkedHelpful ? .blue : .secondary)

                        if review.helpfulCount > 0 {
                            Text("(\(review.helpfulCount))")
                                .font(.caption)
                                .foregroundColor(.secondary)
                        }
                    }
                }
                .buttonStyle(PlainButtonStyle())

                Spacer()

                if review.isOwner {
                    Button("Edit") {
                        // Handle edit review
                    }
                    .font(.caption)
                    .foregroundColor(.blue)

                    Button("Delete") {
                        // Handle delete review
                    }
                    .font(.caption)
                    .foregroundColor(.red)
                }
            }
        }
        .padding()
        .background(Color.white)
        .cornerRadius(12)
        .shadow(color: Color.black.opacity(0.1), radius: 4, x: 0, y: 2)
    }
}

// MARK: - Star Rating
struct StarRating: View {
    let rating: Double
    let size: CGFloat

    var body: some View {
        HStack(spacing: 2) {
            ForEach(1...5, id: \.self) { star in
                Image(systemName: star <= Int(rating) ? "star.fill" :
                      (Double(star) - rating < 1.0 ? "star.leadinghalf.filled" : "star"))
                    .foregroundColor(.yellow)
                    .font(.system(size: size))
            }
        }
    }
}

// MARK: - Empty Reviews View
struct EmptyReviewsView: View {
    var body: some View {
        VStack(spacing: 16) {
            Image(systemName: "star.circle")
                .font(.system(size: 60))
                .foregroundColor(.gray)

            Text("No Reviews Yet")
                .font(.title2)
                .fontWeight(.semibold)

            Text("Be the first to share your experience!")
                .font(.body)
                .foregroundColor(.secondary)
                .multilineTextAlignment(.center)
        }
        .padding()
    }
}

// MARK: - Write Review View
struct WriteReviewView: View {
    let eventId: String
    let onReviewSubmitted: () -> Void
    @State private var rating = 5
    @State private var reviewText = ""
    @State private var isSubmitting = false
    @Environment(\.dismiss) private var dismiss

    var body: some View {
        NavigationView {
            VStack(alignment: .leading, spacing: 20) {
                Text("Write a Review")
                    .font(.largeTitle)
                    .fontWeight(.bold)

                // Rating selection
                VStack(alignment: .leading, spacing: 12) {
                    Text("Rating")
                        .font(.headline)

                    HStack {
                        ForEach(1...5, id: \.self) { star in
                            Button(action: {
                                rating = star
                            }) {
                                Image(systemName: star <= rating ? "star.fill" : "star")
                                    .foregroundColor(.yellow)
                                    .font(.title2)
                            }
                        }

                        Spacer()
                    }
                }

                // Review text
                VStack(alignment: .leading, spacing: 12) {
                    Text("Your Review")
                        .font(.headline)

                    TextEditor(text: $reviewText)
                        .frame(minHeight: 150)
                        .padding(8)
                        .background(Color.gray.opacity(0.1))
                        .cornerRadius(8)
                        .overlay(
                            RoundedRectangle(cornerRadius: 8)
                                .stroke(Color.gray.opacity(0.3), lineWidth: 1)
                        )

                    Text("\(reviewText.count)/500")
                        .font(.caption)
                        .foregroundColor(reviewText.count > 500 ? .red : .secondary)
                        .frame(maxWidth: .infinity, alignment: .trailing)
                }

                Spacer()

                // Submit button
                Button(action: {
                    submitReview()
                }) {
                    HStack {
                        if isSubmitting {
                            ProgressView()
                                .scaleEffect(0.8)
                                .foregroundColor(.white)
                        }

                        Text("Submit Review")
                            .font(.headline)
                            .fontWeight(.semibold)
                    }
                    .foregroundColor(.white)
                    .frame(maxWidth: .infinity)
                    .padding()
                    .background(isFormValid ? Color.blue : Color.gray)
                    .cornerRadius(12)
                }
                .disabled(!isFormValid || isSubmitting)
            }
            .padding()
            .navigationBarItems(
                leading: Button("Cancel") { dismiss() }
            )
        }
    }

    private var isFormValid: Bool {
        !reviewText.trimmingCharacters(in: .whitespacesAndNewlines).isEmpty &&
        reviewText.count <= 500
    }

    private func submitReview() {
        isSubmitting = true

        // Simulate API call
        DispatchQueue.main.asyncAfter(deadline: .now() + 2.0) {
            isSubmitting = false
            onReviewSubmitted()
            dismiss()
        }
    }
}

// MARK: - Review Model
struct Review: Identifiable {
    let id: String
    let userId: String
    let userName: String
    let userProfileImage: String?
    let rating: Int
    let content: String
    let date: String
    let helpfulCount: Int
    let images: [String]
    let isVerified: Bool
    let isOwner: Bool
    let isMarkedHelpful: Bool
}

// MARK: - Event Review View Model
class EventReviewViewModel: ObservableObject {
    @Published var event: Event?
    @Published var reviews: [Review] = []
    @Published var filteredReviews: [Review] = []
    @Published var isLoading = false
    @Published var averageRating: Double = 0.0
    @Published var totalReviews: Int = 0
    @Published var ratingDistribution: [Int] = [0, 0, 0, 0, 0]

    private let reviewService = ReviewService()

    func loadEventReviews(_ eventId: String) {
        isLoading = true

        let group = DispatchGroup()

        // Load event details
        group.enter()
        loadEventDetails(eventId) {
            group.leave()
        }

        // Load reviews
        group.enter()
        loadReviews(eventId) {
            group.leave()
        }

        group.notify(queue: .main) { [weak self] in
            self?.isLoading = false
        }
    }

    func filterReviews(by filter: EventReviewView.ReviewFilter) {
        switch filter {
        case .all:
            filteredReviews = reviews
        case .fiveStar:
            filteredReviews = reviews.filter { $0.rating == 5 }
        case .fourStar:
            filteredReviews = reviews.filter { $0.rating == 4 }
        case .threeStar:
            filteredReviews = reviews.filter { $0.rating == 3 }
        case .twoStar:
            filteredReviews = reviews.filter { $0.rating == 2 }
        case .oneStar:
            filteredReviews = reviews.filter { $0.rating == 1 }
        }
    }

    func getReviewCount(for filter: EventReviewView.ReviewFilter) -> Int {
        switch filter {
        case .all:
            return reviews.count
        case .fiveStar:
            return reviews.filter { $0.rating == 5 }.count
        case .fourStar:
            return reviews.filter { $0.rating == 4 }.count
        case .threeStar:
            return reviews.filter { $0.rating == 3 }.count
        case .twoStar:
            return reviews.filter { $0.rating == 2 }.count
        case .oneStar:
            return reviews.filter { $0.rating == 1 }.count
        }
    }

    func markHelpful(_ reviewId: String) {
        if let index = reviews.firstIndex(where: { $0.id == reviewId }) {
            // Update the review (this would typically be an API call)
            // For now, we'll just simulate it
        }
    }

    private func loadEventDetails(_ eventId: String, completion: @escaping () -> Void) {
        // Simulate loading event details
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.0) {
            let event = Event(
                id: eventId,
                title: "Sample Event",
                description: "Event description",
                date: Date(),
                location: "Sample Location",
                latitude: 0.0,
                longitude: 0.0,
                price: 29.99,
                categoryId: "1",
                imageUrl: "https://picsum.photos/300/200",
                rating: 4.5,
                attendeeCount: 150,
                isFeatured: false,
                isPopular: true
            )

            DispatchQueue.main.async {
                self.event = event
                completion()
            }
        }
    }

    private func loadReviews(_ eventId: String, completion: @escaping () -> Void) {
        reviewService.getEventReviews(eventId: eventId) { [weak self] result in
            DispatchQueue.main.async {
                switch result {
                case .success(let reviews):
                    self?.reviews = reviews
                    self?.filteredReviews = reviews
                    self?.calculateRatingStatistics()
                case .failure(let error):
                    print("Error loading reviews: \(error)")
                }
                completion()
            }
        }
    }

    private func calculateRatingStatistics() {
        totalReviews = reviews.count

        if totalReviews > 0 {
            let totalRating = reviews.reduce(0) { $0 + $1.rating }
            averageRating = Double(totalRating) / Double(totalReviews)

            // Calculate distribution
            ratingDistribution = [0, 0, 0, 0, 0]
            for review in reviews {
                if review.rating >= 1 && review.rating <= 5 {
                    ratingDistribution[review.rating - 1] += 1
                }
            }
        }
    }
}

// MARK: - Review Service
class ReviewService {
    func getEventReviews(eventId: String, completion: @escaping (Result<[Review], Error>) -> Void) {
        // Simulate API call
        DispatchQueue.global().asyncAfter(deadline: .now() + 1.5) {
            let reviews = self.generateMockReviews()
            completion(.success(reviews))
        }
    }

    private func generateMockReviews() -> [Review] {
        return [
            Review(
                id: "1",
                userId: "user1",
                userName: "John Doe",
                userProfileImage: "https://picsum.photos/100/100?random=1",
                rating: 5,
                content: "Great event! Well organized and engaging content. The speakers were knowledgeable and the venue was perfect.",
                date: "3 days ago",
                helpfulCount: 12,
                images: ["https://picsum.photos/200/150?random=1"],
                isVerified: true,
                isOwner: false,
                isMarkedHelpful: false
            ),
            Review(
                id: "2",
                userId: "user2",
                userName: "Jane Smith",
                userProfileImage: "https://picsum.photos/100/100?random=2",
                rating: 4,
                content: "Enjoyable event with good speakers. Could use better refreshments though. Overall, I would recommend it to others.",
                date: "1 week ago",
                helpfulCount: 8,
                images: [],
                isVerified: false,
                isOwner: false,
                isMarkedHelpful: true
            ),
            Review(
                id: "3",
                userId: "user3",
                userName: "Michael Johnson",
                userProfileImage: "https://picsum.photos/100/100?random=3",
                rating: 3,
                content: "Average event. Some good moments but could be improved. The location was good but the content was not as expected.",
                date: "2 weeks ago",
                helpfulCount: 5,
                images: [],
                isVerified: true,
                isOwner: false,
                isMarkedHelpful: false
            )
        ]
    }
}

#Preview {
    EventReviewView(eventId: "sample-event")
}
