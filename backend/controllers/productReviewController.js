import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import ProductOrder from '../models/productOrderModel.js';
import Notification from '../models/notificationModel.js';

// @desc    Create new product review
// @route   POST /api/products/:id/reviews
// @access  Private
export const createProductReview = asyncHandler(async (req, res) => {
    const { rating, title, comment, media } = req.body;
    const productId = req.params.id;

    const product = await Product.findById(productId);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Check if user has purchased the product
    const order = await ProductOrder.findOne({
        user: req.user._id,
        'items.product': productId,
        status: 'DELIVERED'
    });

    // Allow review but mark as unverified if no purchase found
    const verified = !!order;

    // Check if user already reviewed
    const alreadyReviewed = product.reviews.find(
        r => r.user.toString() === req.user._id.toString()
    );

    if (alreadyReviewed) {
        res.status(400);
        throw new Error('Product already reviewed');
    }

    const review = {
        user: req.user._id,
        rating: Number(rating),
        title,
        comment,
        media,
        verified,
        orderId: order?._id,
        status: verified ? 'APPROVED' : 'PENDING'
    };

    product.reviews.push(review);

    // Update review statistics
    updateProductReviewStats(product);
    await product.save();

    // Notify seller
    await Notification.create({
        recipient: product.seller,
        type: 'PRODUCT_REVIEW',
        title: 'New Product Review',
        message: `A new ${rating}-star review for ${product.name}`,
        data: {
            productId,
            reviewId: review._id,
            rating
        }
    });

    res.status(201).json(review);
});

// @desc    Get product reviews
// @route   GET /api/products/:id/reviews
// @access  Public
export const getProductReviews = asyncHandler(async (req, res) => {
    const {
        verified,
        rating,
        sort = '-createdAt',
        page = 1,
        limit = 10
    } = req.query;

    const product = await Product.findById(req.params.id)
        .populate('reviews.user', 'name avatar');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    let filteredReviews = product.reviews;

    // Apply filters
    if (verified === 'true') {
        filteredReviews = filteredReviews.filter(r => r.verified);
    }
    if (rating) {
        filteredReviews = filteredReviews.filter(r => r.rating === Number(rating));
    }

    // Apply sorting
    filteredReviews.sort((a, b) => {
        switch (sort) {
            case 'rating':
                return a.rating - b.rating;
            case '-rating':
                return b.rating - a.rating;
            case 'helpful':
                return (a.helpful?.length || 0) - (b.helpful?.length || 0);
            case '-helpful':
                return (b.helpful?.length || 0) - (a.helpful?.length || 0);
            case '-createdAt':
            default:
                return new Date(b.createdAt) - new Date(a.createdAt);
        }
    });

    // Paginate results
    const startIndex = (page - 1) * limit;
    const endIndex = page * limit;

    const results = {
        reviews: filteredReviews.slice(startIndex, endIndex),
        page: Number(page),
        pages: Math.ceil(filteredReviews.length / limit),
        total: filteredReviews.length,
        stats: product.reviewStats
    };

    res.json(results);
});

// @desc    Respond to a review (seller only)
// @route   POST /api/products/:id/reviews/:reviewId/respond
// @access  Private/Seller
export const respondToReview = asyncHandler(async (req, res) => {
    const { comment } = req.body;
    const { id, reviewId } = req.params;

    const product = await Product.findById(id);
    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Verify seller ownership
    if (product.seller.toString() !== req.user.businessId) {
        res.status(403);
        throw new Error('Not authorized');
    }

    const review = product.reviews.id(reviewId);
    if (!review) {
        res.status(404);
        throw new Error('Review not found');
    }

    review.sellerResponse = {
        comment,
        respondedAt: new Date()
    };

    await product.save();

    // Notify reviewer
    await Notification.create({
        recipient: review.user,
        type: 'REVIEW_RESPONSE',
        title: 'Seller Responded to Your Review',
        message: `Seller responded to your review of ${product.name}`,
        data: {
            productId: id,
            reviewId
        }
    });

    res.json(review);
});

// Helper function to update review statistics
const updateProductReviewStats = (product) => {
    const approvedReviews = product.reviews.filter(r => r.status === 'APPROVED');
    
    product.reviewStats = {
        averageRating: approvedReviews.reduce((acc, r) => acc + r.rating, 0) / approvedReviews.length || 0,
        totalReviews: approvedReviews.length,
        verifiedReviews: approvedReviews.filter(r => r.verified).length,
        ratingDistribution: {
            1: approvedReviews.filter(r => r.rating === 1).length,
            2: approvedReviews.filter(r => r.rating === 2).length,
            3: approvedReviews.filter(r => r.rating === 3).length,
            4: approvedReviews.filter(r => r.rating === 4).length,
            5: approvedReviews.filter(r => r.rating === 5).length
        }
    };
}; 