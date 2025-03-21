import SwiftUI

struct EventDetailView: View {
    let eventId: String
    @StateObject private var viewModel = EventDetailsViewModel()
    @State private var showReviewSheet = false
    @State private var showCommentSheet = false
    @State private var rating = 0
    @State private var reviewComment = ""
    @State private var commentText = ""
    
    var body: some View {
        ScrollView {
            if let event = viewModel.event {
                VStack(alignment: .leading, spacing: 20) {
                    // Event Header
                    VStack(alignment: .leading, spacing: 8) {
                        Text(event.title)
                            .font(.title)
                            .fontWeight(.bold)
                        
                        Text(event.description)
                            .font(.body)
                            .foregroundColor(.secondary)
                    }
                    .padding(.horizontal)
                    
                    // Event Details
                    VStack(spacing: 16) {
                        DetailRow(icon: "calendar", title: "Date", value: event.formattedDate)
                        DetailRow(icon: "clock", title: "Time", value: event.formattedTime)
                        DetailRow(icon: "mappin.and.ellipse", title: "Location", value: event.location)
                        DetailRow(icon: "tag", title: "Category", value: event.category)
                        DetailRow(icon: "person.2", title: "Attendees", value: "\(event.attendees.count)/\(event.maxAttendees)")
                    }
                    .padding()
                    .background(Color(.systemGray6))
                    .cornerRadius(12)
                    .padding(.horizontal)
                    
                    // Analytics
                    if let analytics = viewModel.analytics {
                        VStack(alignment: .leading, spacing: 12) {
                            Text("Event Analytics")
                                .font(.headline)
                                .padding(.horizontal)
                            
                            ScrollView(.horizontal, showsIndicators: false) {
                                HStack(spacing: 16) {
                                    AnalyticCard(
                                        title: "Rating",
                                        value: String(format: "%.1f", analytics.averageRating),
                                        icon: "star.fill"
                                    )
                                    
                                    AnalyticCard(
                                        title: "Views",
                                        value: "\(analytics.viewCount)",
                                        icon: "eye.fill"
                                    )
                                    
                                    AnalyticCard(
                                        title: "Interested",
                                        value: "\(analytics.interestedCount)",
                                        icon: "heart.fill"
                                    )
                                    
                                    AnalyticCard(
                                        title: "Comments",
                                        value: "\(analytics.totalComments)",
                                        icon: "bubble.left.fill"
                                    )
                                }
                                .padding(.horizontal)
                            }
                        }
                    }
                    
                    // Reviews
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Reviews")
                                .font(.headline)
                            Spacer()
                            Button("Add Review") {
                                showReviewSheet = true
                            }
                        }
                        .padding(.horizontal)
                        
                        if event.reviews.isEmpty {
                            Text("No reviews yet")
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        } else {
                            ForEach(event.reviews, id: \.userId) { review in
                                ReviewRow(review: review)
                            }
                        }
                    }
                    
                    // Comments
                    VStack(alignment: .leading, spacing: 12) {
                        HStack {
                            Text("Comments")
                                .font(.headline)
                            Spacer()
                            Button("Add Comment") {
                                showCommentSheet = true
                            }
                        }
                        .padding(.horizontal)
                        
                        if event.comments.isEmpty {
                            Text("No comments yet")
                                .foregroundColor(.secondary)
                                .padding(.horizontal)
                        } else {
                            ForEach(event.comments, id: \.id) { comment in
                                CommentRow(comment: comment)
                            }
                        }
                    }
                }
                .padding(.vertical)
            } else {
                if viewModel.isLoading {
                    ProgressView()
                        .padding()
                } else {
                    ContentUnavailableView {
                        Label("Event Not Found", systemImage: "calendar.badge.exclamationmark")
                    } description: {
                        Text("The event you're looking for could not be found.")
                    }
                }
            }
        }
        .navigationBarTitleDisplayMode(.inline)
        .toolbar {
            if let event = viewModel.event {
                ToolbarItem(placement: .navigationBarTrailing) {
                    Button(event.attendees.contains(UserDefaults.standard.string(forKey: "userId") ?? "") ? "Leave" : "Join") {
                        Task {
                            if event.attendees.contains(UserDefaults.standard.string(forKey: "userId") ?? "") {
                                await viewModel.leaveEvent()
                            } else {
                                await viewModel.joinEvent()
                            }
                        }
                    }
                }
            }
        }
        .sheet(isPresented: $showReviewSheet) {
            NavigationView {
                Form {
                    Section {
                        RatingPicker(rating: $rating)
                        TextEditor(text: $reviewComment)
                            .frame(height: 100)
                    }
                }
                .navigationTitle("Add Review")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            showReviewSheet = false
                        }
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Submit") {
                            Task {
                                await viewModel.addReview(rating: rating, comment: reviewComment)
                                rating = 0
                                reviewComment = ""
                                showReviewSheet = false
                            }
                        }
                        .disabled(rating == 0 || reviewComment.isEmpty)
                    }
                }
            }
        }
        .sheet(isPresented: $showCommentSheet) {
            NavigationView {
                Form {
                    Section {
                        TextEditor(text: $commentText)
                            .frame(height: 100)
                    }
                }
                .navigationTitle("Add Comment")
                .navigationBarTitleDisplayMode(.inline)
                .toolbar {
                    ToolbarItem(placement: .navigationBarLeading) {
                        Button("Cancel") {
                            showCommentSheet = false
                        }
                    }
                    ToolbarItem(placement: .navigationBarTrailing) {
                        Button("Submit") {
                            Task {
                                await viewModel.addComment(text: commentText)
                                commentText = ""
                                showCommentSheet = false
                            }
                        }
                        .disabled(commentText.isEmpty)
                    }
                }
            }
        }
        .alert("Error", isPresented: $viewModel.showError) {
            Button("OK", role: .cancel) {}
        } message: {
            Text(viewModel.errorMessage)
        }
        .task {
            await viewModel.loadEventDetails(eventId: eventId)
        }
    }
}

// MARK: - Supporting Views
struct DetailRow: View {
    let icon: String
    let title: String
    let value: String
    
    var body: some View {
        HStack {
            Label(title, systemImage: icon)
                .foregroundColor(.secondary)
            Spacer()
            Text(value)
                .foregroundColor(.primary)
        }
    }
}

struct AnalyticCard: View {
    let title: String
    let value: String
    let icon: String
    
    var body: some View {
        VStack(spacing: 8) {
            Image(systemName: icon)
                .font(.title2)
                .foregroundColor(.blue)
            
            Text(value)
                .font(.title3)
                .fontWeight(.bold)
            
            Text(title)
                .font(.caption)
                .foregroundColor(.secondary)
        }
        .frame(width: 100, height: 100)
        .background(Color(.systemGray6))
        .cornerRadius(12)
    }
}

struct ReviewRow: View {
    let review: Event.Review
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            HStack {
                Text(review.userName)
                    .font(.subheadline)
                    .fontWeight(.medium)
                Spacer()
                HStack {
                    Text("\(review.rating)")
                    Image(systemName: "star.fill")
                        .foregroundColor(.yellow)
                }
                .font(.subheadline)
            }
            
            Text(review.comment)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

struct CommentRow: View {
    let comment: Event.Comment
    
    var body: some View {
        VStack(alignment: .leading, spacing: 8) {
            Text(comment.userName)
                .font(.subheadline)
                .fontWeight(.medium)
            
            Text(comment.text)
                .font(.subheadline)
                .foregroundColor(.secondary)
        }
        .padding()
        .background(Color(.systemGray6))
        .cornerRadius(8)
        .padding(.horizontal)
    }
}

struct RatingPicker: View {
    @Binding var rating: Int
    
    var body: some View {
        HStack {
            ForEach(1...5, id: \.self) { number in
                Image(systemName: number <= rating ? "star.fill" : "star")
                    .foregroundColor(number <= rating ? .yellow : .gray)
                    .font(.title2)
                    .onTapGesture {
                        rating = number
                    }
            }
        }
    }
}

#Preview {
    NavigationView {
        EventDetailView(eventId: "preview")
    }
} 