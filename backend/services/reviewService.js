export const updateReviewStats = async (event) => {
    const reviews = event.reviews.filter(r => r.status === 'APPROVED');
    
    // Calculate average rating
    event.reviewStats.averageRating = 
        reviews.reduce((acc, r) => acc + r.rating, 0) / reviews.length || 0;
    
    // Update review count
    event.reviewStats.numReviews = reviews.length;
    
    // Update rating distribution
    event.reviewStats.ratingDistribution = {
        1: reviews.filter(r => r.rating === 1).length,
        2: reviews.filter(r => r.rating === 2).length,
        3: reviews.filter(r => r.rating === 3).length,
        4: reviews.filter(r => r.rating === 4).length,
        5: reviews.filter(r => r.rating === 5).length
    };
    
    // Update media count
    event.reviewStats.hasMediaCount = 
        reviews.filter(r => r.media && r.media.length > 0).length;
    
    // Update response rate
    event.reviewStats.responseRate = 
        reviews.filter(r => r.response).length / reviews.length || 0;
}; 