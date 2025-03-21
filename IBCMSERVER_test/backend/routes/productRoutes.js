import express from 'express';
import * as productController from '../controllers/productController.js';
import { protect, isSeller, isAdmin, isBusinessOwner } from '../middleware/authMiddleware.js';
import {
    createProductReview,
    getProductReviews,
    respondToReview
} from '../controllers/productReviewController.js';
import upload from '../middleware/uploadMiddleware.js';

const router = express.Router();

// Keep existing routes
router.route('/')
    .get(productController.getProducts)
    .post(protect, isSeller, productController.createProduct);

// Add new routes
router.get('/category/:categoryId', productController.getProductsByCategory);
router.get('/search', productController.searchProducts);
router.post('/:id/variants', protect, isSeller, productController.addProductVariant);
router.put('/:id/inventory', protect, isSeller, productController.updateInventory);

// Review routes
router.route('/:id/reviews')
    .post(protect, productController.createProductReview)
    .get(productController.getProductReviews);

router.post(
    '/:id/reviews/:reviewId/respond',
    protect,
    isSeller,
    productController.respondToReview
);

// Public routes
router.get('/:productId', productController.getProductDetails);

// Protected business routes
router.use(protect, isBusinessOwner);

router.route('/')
    .post(upload.array('images', 5), productController.createProduct)
    .get(productController.getBusinessProducts);

router.route('/:productId')
    .put(upload.array('images', 5), productController.updateProduct);

export default router; 