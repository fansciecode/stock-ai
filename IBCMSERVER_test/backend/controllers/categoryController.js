import Category from "../models/categoryModel.js";
import { UserModel } from "../models/userModel.js";

// Fetch all event categories
export const getCategories = async (req, res) => {
  try {
    const { format = 'new' } = req.query;

    // If old format requested, return simple response
    if (format === 'old') {
        const categories = await Category.find({});
        return res.json(categories);
    }

    // Get user's interests if logged in
    const userInterests = req.user ? 
        (await User.findById(req.user._id).select('interests')).interests : 
        [];

    const categories = await Category.aggregate([
        {
            $lookup: {
                from: 'events',
                localField: '_id',
                foreignField: 'category',
                pipeline: [
                    { $match: { date: { $gte: new Date() } } }
                ],
                as: 'events'
            }
        },
        {
            $project: {
                _id: 1,
                name: 1,
                description: 1,
                eventCount: { $size: '$events' },
                isSelected: {
                    $in: ['$_id', userInterests]
                }
            }
        }
    ]);

    res.json({
        success: true,
        data: categories
    });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: "Error fetching categories", 
        error: error.message 
    });
  }
};

// Update user's preferred categories
export const updateUserCategories = async (req, res) => {
  try {
    const { categories } = req.body;

    if (!categories || !Array.isArray(categories)) {
      return res.status(400).json({ message: "Invalid categories" });
    }

    const user = await User.findById(req.user._id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    user.interests = categories;
    await user.save();

    res.json({ 
        success: true, 
        message: "Categories updated successfully", 
        data: {
            interests: user.interests
        }
    });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: "Error updating categories", 
        error: error.message 
    });
  }
};

// Add a new category (Admin only)
export const addCategory = async (req, res) => {
  try {
    const { name, description } = req.body;

    if (!name) {
      return res.status(400).json({ message: "Category name is required" });
    }

    const categoryExists = await Category.findOne({ name });

    if (categoryExists) {
      return res.status(400).json({ message: "Category already exists" });
    }

    const category = new Category({ name, description });
    await category.save();

    res.status(201).json({ 
        success: true, 
        message: "Category created", 
        data: category 
    });

  } catch (error) {
    res.status(500).json({ 
        success: false, 
        message: "Server error", 
        error: error.message 
    });
  }
};