import express from "express";
import { getCategories, updateUserCategories,addCategory } from "../controllers/categoryController.js";
import { protect,isAdmin } from "../middleware/authMiddleware.js";

const router = express.Router();

router.get("/", getCategories);
router.put("/update", protect, updateUserCategories);
router.post("/", protect, isAdmin, addCategory); // Admin can add categories

export default router;
