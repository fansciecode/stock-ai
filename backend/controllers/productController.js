import asyncHandler from 'express-async-handler';
import Product from '../models/productModel.js';
import Inventory from '../models/inventoryModel.js';

const createProduct = asyncHandler(async (req, res) => {
    const {
        name,
        category,
        price,
        initialStock,
        specifications,
        variants
    } = req.body;

    // Generate SKU
    const sku = await generateSKU(req.user.businessId, category);

    // Create product
    const product = await Product.create({
        business: req.user.businessId,
        name,
        sku,
        category,
        price,
        specifications,
        status: initialStock > 0 ? 'ACTIVE' : 'OUT_OF_STOCK'
    });

    // Create initial inventory
    const inventory = await Inventory.create({
        business: req.user.businessId,
        product: product._id,
        sku,
        quantity: initialStock || 0
    });

    // Handle variants if any
    if (variants && variants.length > 0) {
        const variantPromises = variants.map(async variant => {
            const variantSku = await generateSKU(req.user.businessId, category, variant.name);
            
            // Create inventory for variant
            const variantInventory = await Inventory.create({
                business: req.user.businessId,
                product: product._id,
                sku: variantSku,
                quantity: variant.initialStock || 0
            });

            return {
                ...variant,
                sku: variantSku,
                inventory: variantInventory._id
            };
        });

        product.variants = await Promise.all(variantPromises);
        await product.save();
    }

    res.status(201).json({
        product: {
            ...product.toObject(),
            inventory: {
                quantity: inventory.quantity,
                status: inventory.status
            }
        }
    });
});

const updateProduct = asyncHandler(async (req, res) => {
    const { productId } = req.params;
    const updates = req.body;

    const product = await Product.findOne({
        _id: productId,
        business: req.user.businessId
    });

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    // Update basic product info
    Object.keys(updates).forEach(key => {
        if (key !== 'inventory' && key !== 'variants') {
            product[key] = updates[key];
        }
    });

    // Handle inventory updates if provided
    if (updates.inventory) {
        const inventory = await Inventory.findOne({
            product: product._id,
            business: req.user.businessId
        });

        if (inventory) {
            await inventory.adjustStock(
                updates.inventory.quantity,
                'ADJUSTED',
                'Product Update'
            );
        }
    }

    // Handle variant updates
    if (updates.variants) {
        for (const variant of updates.variants) {
            const existingVariant = product.variants.id(variant._id);
            if (existingVariant) {
                // Update existing variant
                Object.assign(existingVariant, variant);
                
                // Update variant inventory
                if (variant.inventory) {
                    const variantInventory = await Inventory.findById(existingVariant.inventory);
                    if (variantInventory) {
                        await variantInventory.adjustStock(
                            variant.inventory.quantity,
                            'ADJUSTED',
                            'Variant Update'
                        );
                    }
                }
            }
        }
    }

    await product.save();

    // Get updated inventory status
    const availability = await product.checkAvailability();

    res.json({
        product: {
            ...product.toObject(),
            availability
        }
    });
});

const getProductDetails = asyncHandler(async (req, res) => {
    const { productId } = req.params;

    const product = await Product.findById(productId)
        .populate('variants.inventory');

    if (!product) {
        res.status(404);
        throw new Error('Product not found');
    }

    const availability = await product.checkAvailability();
    const pricing = product.calculatePrice();

    res.json({
        ...product.toObject(),
        availability,
        pricing
    });
});

const getBusinessProducts = asyncHandler(async (req, res) => {
    const {
        category,
        status,
        inStock,
        page = 1,
        limit = 10
    } = req.query;

    const query = { business: req.user.businessId };

    if (category) query.category = category;
    if (status) query.status = status;
    if (inStock === 'true') {
        const inStockProducts = await Inventory.find({
            business: req.user.businessId,
            status: 'IN_STOCK'
        }).distinct('product');
        query._id = { $in: inStockProducts };
    }

    const products = await Product.find(query)
        .skip((page - 1) * limit)
        .limit(limit)
        .lean();

    // Get availability for all products
    const productsWithAvailability = await Promise.all(
        products.map(async product => {
            const availability = await Product.findById(product._id)
                .checkAvailability();
            const pricing = Product.findById(product._id)
                .calculatePrice();
            return {
                ...product,
                availability,
                pricing
            };
        })
    );

    const total = await Product.countDocuments(query);

    res.json({
        products: productsWithAvailability,
        page,
        totalPages: Math.ceil(total / limit),
        total
    });
});

export {
    createProduct,
    updateProduct,
    getProductDetails,
    getBusinessProducts
}; 